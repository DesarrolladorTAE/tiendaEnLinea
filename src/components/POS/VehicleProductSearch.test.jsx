import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import client from "../../config/axiosClientPOS";
import VehicleProductSearch from "./VehicleProductSearch";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: {} }));
jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("./ProductCard", () => () => <div>Selección de producto POS</div>);
const terminal = { id: 6, store_id: 3, branch_id: 12 };
const fixture = { id: 123, name: "Balata", sku: "000123", price: null, in_stock: true, available_stock: 4,
  compatibility_status: "unknown", year_unconfirmed: true, variant_options: [{ id: 11, name: "Variante A" }] };
let host, root;
const results = (data) => ({ data: { data, last_page: 1 } });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  client.get.mockReset();
  client.get.mockImplementation(async (url) => {
    if (url === "/my-products-by-pos1") return { data: { store_id: 3, branch_id: 12, pos: { id: 6, allowed_warehouses: [] }, products: [], meta: { last_page: 1 } } };
    return results(url === "/products/search-by-vehicle" ? [fixture] : []);
  });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const mount = (order) => act(async () => root.render(<VehicleProductSearch terminal={terminal} records order={order}
  categories={[]} cardProps={{ cart: [], getProductImage: () => null }} />));

test("usa el contexto histórico de orden y no convierte un precio nulo ni un año incierto", async () => {
  await mount({ id: 77, order_code: "OS-DEMO", vehicle_id: 82 });
  expect(client.get).toHaveBeenCalledWith("/products/search-by-vehicle", expect.objectContaining({
    params: { service_order_id: 77, page: 1, per_page: 20 },
  }));
  expect(host.textContent).toContain("Año no confirmado");
  expect(host.textContent).toContain("Compatibilidad desconocida");
  expect(host.textContent).toContain("Precio al elegir variante o almacén");
  expect(host.textContent).toContain("Variante A");
});

test("cancelación de búsqueda evita renderizar la respuesta obsoleta", async () => {
  const original = client.get.getMockImplementation();
  const old = {};
  client.get.mockImplementation((url, config) => {
    if (url === "/products/search-by-vehicle" && !config.params.barcode) {
      old.signal = config.signal;
      return new Promise((resolve) => { old.resolve = resolve; });
    }
    if (url === "/products/search-by-vehicle") return Promise.resolve(results([{ ...fixture, name: "Resultado actual" }]));
    return original(url, config);
  });
  await mount();
  const label = [...host.querySelectorAll("label")].find((element) => element.textContent === "Código de barras");
  const field = document.getElementById(label.htmlFor);
  await act(async () => { field.value = "075001"; Simulate.change(field); });
  expect(old.signal.aborted).toBe(true);
  expect(host.textContent).toContain("Resultado actual");
  await act(async () => old.resolve(results([{ ...fixture, name: "Resultado anterior" }])));
  expect(host.textContent).not.toContain("Resultado anterior");
});


test("denegación del detalle mantiene el buscador y no usa el catálogo como fallback", async () => {
  const original = client.get.getMockImplementation();
  client.get.mockImplementation((url, config) => {
    if (url === "/products/search-by-vehicle") return Promise.resolve(results([{ ...fixture, compatibility_status: "compatible" }]));
    if (url === "/pos/products/123") return Promise.reject({ response: { status: 403 } });
    return original(url, config);
  });
  await mount();
  const warehouseRequests = client.get.mock.calls.filter(([url]) => url === "/my-products-by-pos1").length;
  await act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === "Seleccionar").click());
  expect(host.textContent).toContain("La terminal no tiene permiso para consultar este producto.");
  expect(host.textContent).not.toContain("Selección de producto POS");
  expect(client.get.mock.calls.filter(([url]) => url === "/my-products-by-pos1")).toHaveLength(warehouseRequests);
  expect(client.get.mock.calls.filter(([url]) => url === "/pos/products/123")).toHaveLength(1);
});
