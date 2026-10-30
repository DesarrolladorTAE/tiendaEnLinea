import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePOSLogic } from "./usePOSLogic";
import client from "../../config/axiosClientPOS";
import { showError } from "../../utils/alerts";

jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
const ticket = jest.fn(), showTicket = jest.fn();
let root, host, latest, products;
function Harness() {
  const [cart, setCart] = useState([]);
  latest = { ...usePOSLogic({ cart, setCart, setTicketData: ticket, setShowTicket: showTicket }), setCart };
  return null;
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
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
