import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePOSLogic } from "./usePOSLogic";
import client from "../../config/axiosClientPOS";
import { showError } from "../../utils/alerts";
import { readSaleRecovery, recoverPOSSale, reserveSaleRecovery, updateSaleRecovery } from "../../utils/posSaleRecovery";

jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
const ticket = jest.fn(), showTicket = jest.fn();
const verifyCheckout = jest.fn();
const refreshCash = jest.fn();
let root, host, latest, products;
function Harness() {
  const [cart, setCart] = useState([]);
  latest = { ...usePOSLogic({ cart, setCart, setTicketData: ticket, setShowTicket: showTicket, verifyCheckout, refreshCash }), setCart };
  return null;
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  verifyCheckout.mockResolvedValue(null);
  localStorage.setItem("POS_LOCATION_ID", "10");
  products = [{ id: 1, name: "Producto", stock: 0, has_variants: true, use_warehouse_inventory: true, variants: [
    { id: 11, stock: 0, warehouse_stocks: [{ warehouse_id: 2, stock: 4 }, { warehouse_id: 3, stock: 6 }] },
  ] }];
  client.get.mockImplementation(async () => ({ data: { products, meta: { last_page: 1 } } }));
  client.post.mockImplementation(async url => ({ data: url === "/pos/me" ? { warehouse_ids: [2, 3] } : { sale: { id: 88 }, message: "Venta registrada" } }));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); localStorage.clear(); });

const line = warehouse_id => ({ product_id: 1, variant_id: 11, warehouse_id, cart_key: `1-v11-w${warehouse_id}`, quantity: 2, price: 100 });

test("searches the selected POS product field across pages while retaining the category", async () => {
  const first = { id: 1, name: "Pieza A", sku: "OEM-10" };
  const second = { id: 2, name: "OEM-10", sku: "PZ-10", oe_number: "OEM-10" };
  client.get.mockImplementation(async (_, { params }) => ({
    data: { products: [params.page === 1 ? first : second], meta: { last_page: 2 } },
  }));
  act(() => {
    latest.setSearch("oem-10");
    latest.setSearchField("sku");
  });
  await act(async () => latest.refetchProducts({ categoryId: 3 }));
  expect(latest.products.map(({ id }) => id)).toEqual([1]);
  expect(latest.meta.total).toBe(1);
  expect(client.get).toHaveBeenCalledWith("my-products-by-pos1", {
    params: expect.objectContaining({ page: 2, category_id: 3, pos_location_id: 10 }),
  });
  act(() => latest.setSearchField("oe_number"));
  await act(async () => latest.refetchProducts({ categoryId: 3 }));
  expect(latest.products.map(({ id }) => id)).toEqual([2]);
});

test("keeps the cart and skips the sale when the latest cash status blocks checkout", async () => {
  verifyCheckout.mockResolvedValue("Abre la caja para cobrar.");
  await act(async () => latest.setCart([line(2)]));
  await act(async () => latest.handleCheckout({ items: latest.cart }));
  expect(client.post).not.toHaveBeenCalledWith("/v2/sales", expect.anything());
  expect(showError).toHaveBeenCalledWith("Abre la caja para cobrar.");
  expect(latest.cart).toHaveLength(1);
});

test("refreshes cash status and keeps the cart after a cash session rejection", async () => {
  client.post.mockRejectedValueOnce({
    response: { status: 422, data: { errors: { cash_session: ["El horario de caja terminó."] } } },
  });
  await act(async () => latest.setCart([line(2)]));
  await act(async () => latest.handleCheckout({ items: latest.cart }));
  expect(refreshCash).toHaveBeenCalledTimes(1);
  expect(showError).toHaveBeenCalledWith("El horario de caja terminó.");
  expect(latest.cart).toHaveLength(1);
});

test("includes requested shipment in the sale transaction and omits it when no delivery is selected", async () => {
  const shipment = { shipping_method_id: 3, recipient_name: "Ana", recipient_phone: "7221234567", destination_address: "Calle 10", notification_consent: false };
  await act(async () => latest.setCart([line(2)]));
  await act(async () => latest.handleCheckout({ items: latest.cart, shipment }));
  expect(client.post.mock.calls.find(([url]) => url === "/v2/sales")[1].shipment).toEqual(shipment);
  client.post.mockClear();
  await act(async () => latest.setCart([line(2)]));
  await act(async () => latest.handleCheckout({ items: latest.cart }));
  expect(client.post.mock.calls.find(([url]) => url === "/v2/sales")[1]).not.toHaveProperty("shipment");
});

test("sells detail inventory with zero parent stock through V2 and preserves both warehouse lines", async () => {
  await act(async () => latest.setCart([line(2), line(3)]));
  let sale;
  await act(async () => { sale = await latest.handleCheckout({ items: latest.cart, payments: [] }); });
  const payload = client.post.mock.calls.find(([url]) => url === "/v2/sales")[1];
  expect(payload.items.map(item => [item.variant_id, item.warehouse_id])).toEqual([[11, 2], [11, 3]]);
  expect(sale).toEqual({ id: 88 });
  expect(latest.cart).toHaveLength(0);
  expect(client.get.mock.calls.length).toBeGreaterThan(1);
});
test("reloads stock before selling and keeps the cart if the selected warehouse is now empty", async () => {
  await act(async () => latest.setCart([line(2)]));
  products = [{ ...products[0], variants: [{ ...products[0].variants[0], warehouse_stocks: [{ warehouse_id: 2, stock: 0 }, { warehouse_id: 3, stock: 100 }] }] }];
  await act(async () => latest.handleCheckout({ items: latest.cart }));
  expect(client.post.mock.calls.some(([url]) => url === "/v2/sales")).toBe(false);
  expect(showError).toHaveBeenCalledWith(expect.stringContaining("insuficiente"));
  expect(latest.cart).toHaveLength(1);
  expect(latest.cart[0].stock_available).toBe(0);
});
test("rejects detail lines missing selection and prevents duplicate checkout", async () => {
  await act(async () => latest.setCart([{ ...line(2), variant_id: null }]));
  await act(async () => latest.handleCheckout({ items: latest.cart }));
  expect(client.post.mock.calls.some(([url]) => url === "/v2/sales")).toBe(false);
  await act(async () => latest.setCart([line(2)]));
  await act(async () => { await Promise.all([latest.handleCheckout({ items: latest.cart }), latest.handleCheckout({ items: latest.cart })]); });
  expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
});
test("adding items validates the selected combination rather than the supplied stock_available", async () => {
  act(() => latest.handleAdd({ ...line(2), id: "1-v11-w2", stock_available: 999 }));
  expect(latest.cart[0].stock_available).toBe(4);
  act(() => latest.handleAdd({ ...line(3), id: "1-v11-w3", stock_available: 999 }));
  expect(latest.cart).toHaveLength(2);
  expect(latest.cart.map(item => item.warehouse_id)).toEqual([2, 3]);
});
test("inventory changes refresh cart products even when they are not on the visible page", async () => {
  await act(async () => latest.setCart([line(2)]));
  const fresh = { ...products[0], variants: [{ ...products[0].variants[0], warehouse_stocks: [{ warehouse_id: 2, stock: 1 }] }] };
  client.get.mockImplementation(async (_, config) => ({ data: { products: config.params.per_page === 100 ? [fresh] : [], meta: { last_page: 1 } } }));
  await act(async () => window.dispatchEvent(new Event("products:changed")));
  expect(latest.cart[0].stock_available).toBe(1);
  expect(latest.cart[0].quantity).toBe(2);
});

test("refreshing inventory updates warehouse prices and preserves a manual discount", async () => {
  await act(async () => latest.setCart([{ ...line(2), manual_discount: true, discount_percent: 10, original_price: 100 }]));
  const fresh = { ...products[0], price: 90, variants: [{ ...products[0].variants[0], price: 120, warehouse_stocks: [{ warehouse_id: 2, stock: 4, price: 140 }] }] };
  client.get.mockImplementation(async (_, config) => ({ data: { products: config.params.per_page === 100 ? [fresh] : [], meta: { last_page: 1 } } }));
  await act(async () => window.dispatchEvent(new Event("products:changed")));
  expect(latest.cart[0]).toMatchObject({ original_price: 140, price_original: 140, price: 126, discount_percent: 10 });
});

test("confirma el ID antes de actualizar inventario y conserva la venta aunque falle el comprobante", async () => {
  await act(async () => latest.setCart([line(2)]));
  const confirmed = jest.fn(() => {
    client.get.mockRejectedValue(new Error("Falló actualización visual"));
    ticket.mockImplementationOnce(() => { throw new Error("Falló comprobante"); });
  });
  const uncertain = jest.fn();
  let sale;
  await act(async () => { sale = await latest.handleCheckout({ items: latest.cart }, { confirmed, uncertain }); });
  expect(sale).toEqual({ id: 88 });
  expect(confirmed).toHaveBeenCalledWith({ id: 88 });
  expect(uncertain).not.toHaveBeenCalled();
  expect(latest.cart).toHaveLength(0);
  expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
});

test("una respuesta perdida marca el cobro incierto y conserva las líneas", async () => {
  await act(async () => latest.setCart([line(2)]));
  client.post.mockImplementation(async (url) => {
    if (url === "/v2/sales") throw new Error("Sin respuesta");
    return { data: { warehouse_ids: [2, 3] } };
  });
  const uncertain = jest.fn(), confirmed = jest.fn();
  await act(async () => latest.handleCheckout({ items: latest.cart }, { confirmed, uncertain }));
  expect(uncertain).toHaveBeenCalledTimes(1);
  expect(confirmed).not.toHaveBeenCalled();
  expect(latest.cart).toHaveLength(1);
  expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
});

test("envía el UUID antes del cobro y recupera la misma venta sin repetir el POST", async () => {
  const key = "a50cbd21-9951-4c92-961a-26d51f85544e";
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID: () => key }, configurable: true });
  const sale = { id: 88, pos_location_id: 10, store_id: 3 };
  try {
    await act(async () => latest.setCart([line(2)]));
    client.post.mockImplementation(async url => {
      if (url === "/v2/sales") throw new Error("Sin respuesta");
      return { data: { warehouse_ids: [2, 3] } };
    });
    const payload = { items: latest.cart, is_credit_sale: true, is_pending_sale: true,
      payments: [{ method: "td", amount: 200, reference: "FICTICIO-PRIVADO" }] };
    await act(async () => latest.handleCheckout(payload, { reserve: () => reserveSaleRecovery(10, 77) }));
    const reference = readSaleRecovery(10);
    expect(reference).toEqual({ key, orderId: 77 });
    expect(localStorage.getItem("pos-v2-recovery:10")).not.toContain("FICTICIO-PRIVADO");
    expect(() => reserveSaleRecovery(10)).toThrow("venta anterior");
    expect(client.post).toHaveBeenCalledWith("/v2/sales", expect.objectContaining({
      is_credit_sale: true, is_pending_sale: true,
      items: [expect.objectContaining({ variant_id: 11, warehouse_id: 2 })],
    }), { headers: { "Idempotency-Key": key } });
    client.get.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(recoverPOSSale(client, 10, reference)).rejects.toMatchObject({ response: { status: 404 } });
    expect(readSaleRecovery(10)).toEqual(reference);
    client.get.mockResolvedValueOnce({ data: { sale, replayed: true } });
    await expect(recoverPOSSale(client, 10, reference)).resolves.toMatchObject({ sale });
    expect(client.get).toHaveBeenLastCalledWith(`/v2/sales/idempotency/${key}`);
    expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
    updateSaleRecovery(10, reference);
    expect(readSaleRecovery(10)).toBeNull();
  } finally {
    if (original) Object.defineProperty(globalThis, "crypto", original);
    else delete globalThis.crypto;
  }
});

test("un 409 conserva el bloqueo y no confirma ni reenvía la venta", async () => {
  const key = "a50cbd21-9951-4c92-961a-26d51f85544e";
  localStorage.setItem("pos-v2-recovery:10", JSON.stringify({ key }));
  const reference = readSaleRecovery(10);
  client.post.mockImplementation(async url => {
    if (url === "/v2/sales") throw { response: { status: 409 } };
    return { data: { warehouse_ids: [2, 3] } };
  });
  const confirmed = jest.fn();
  await act(async () => latest.setCart([line(2)]));
  await act(async () => latest.handleCheckout({ items: latest.cart }, {
    reserve: () => reference, settle: (record, conflict) => updateSaleRecovery(10, record, conflict), confirmed,
  }));
  expect(readSaleRecovery(10)).toEqual({ key, conflict: true });
  expect(confirmed).not.toHaveBeenCalled();
  expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
});

test("un fallo al refrescar inventario visual conserva el comprobante y el ID confirmado", async () => {
  await act(async () => latest.setCart([line(2)]));
  const confirmed = jest.fn(() => client.get.mockRejectedValue(new Error("Falla de actualización visual")));
  let sale;
  await act(async () => { sale = await latest.handleCheckout({ items: latest.cart }, { confirmed }); });
  expect(sale).toEqual({ id: 88 });
  expect(ticket).toHaveBeenCalledWith(expect.objectContaining({ id: 88 }));
  expect(showTicket).toHaveBeenCalledWith(true);
  expect(latest.cart).toHaveLength(0);
  expect(client.post.mock.calls.filter(([url]) => url === "/v2/sales")).toHaveLength(1);
});
