import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import ProductList from "./ProductList";
import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), delete: jest.fn(), patch: jest.fn() } }));
jest.mock("../../context/AdminUiContext", () => ({ useAdminUi: jest.fn() }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: () => ({ tienda: null, tiendaLoading: false }) }));
jest.mock("../../hooks/useLimiteProductos", () => () => ({ puedeCrear: true, totalProductos: mockTotalProducts, cargando: false, actualizarLimite: jest.fn() }));
jest.mock("../../hooks/useComplementosActivos", () => () => ({ tieneComplemento: () => false }));
jest.mock("../../components/admin/promociones/Taebanner", () => () => null);
jest.mock("./modals/LabelModal", () => () => null);
jest.mock("../../components/products-list/CategoryModal", () => () => null);
jest.mock("../../components/products-list/ImportProductsModal", () => () => null);
jest.mock("../../components/products-list/AdvancedProductsModal", () => () => null);
// Native controls exercise the same controlled props without MUI portal interactions.
jest.mock("../../components/products-list/ProductSearchBar", () => props => <>
  <input aria-label="query" value={props.searchTerm} onChange={e => props.setSearchTerm(e.target.value)} />
  <select aria-label="field" value={props.searchField} onChange={e => props.setSearchField(e.target.value)}>
    {["all", "name", "sku", "oe_number"].map(field => <option key={field}>{field}</option>)}
  </select>
</>);

let root, host, branch, mockTotalProducts;
const searchCalls = () => axiosClient.get.mock.calls.filter(([url]) => url === "/products/search");
const page = (rows, last = 3) => ({ data: { data: rows, current_page: 1, last_page: last } });
const mount = () => act(() => root.render(<MemoryRouter><ProductList /></MemoryRouter>));
const tick = async () => act(async () => { jest.advanceTimersByTime(300); });
const change = (label, value) => act(() => Simulate.change(document.querySelector(`[aria-label="${label}"]`), { target: { value } }));

test.each([0, 1, 100, 101, 598])("default zeros do not count toward the factor threshold in a 659-product catalog: %s", async count => {
  mockTotalProducts = 659;
  const rows = Array.from({ length: 659 }, (_, index) => ({ id: index + 1, name: `Producto ${index + 1}`, stock: 1, iva: 0.16, price: 145, profit_factor: index < count ? "45.0000" : "0.0000" }));
  axiosClient.get.mockImplementation(url => Promise.resolve({ data: url === "/admin/branches/123/products" ? rows : [] }));
  mount(); await tick();
  const headers = [...host.querySelectorAll("th")].map(th => th.textContent);
  expect(headers.includes("Factor de utilidad")).toBe(count > 100);
  expect(host.querySelectorAll("tbody tr")).toHaveLength(10);
  if (count > 100) {
    expect(host.querySelector('[data-label="Factor de utilidad"]').textContent).toBe("45%");
    expect(host.querySelector('[title="Cambiar factor de utilidad"]')).not.toBeNull();
  } else expect(host.querySelector('[title="Cambiar factor de utilidad"]')).toBeNull();
});

test("search preserves the branch factor threshold and another branch without factors hides it", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({ id: index + 1, name: `Producto ${index + 1}`, stock: 1, iva: 0.16, price: 145, profit_factor: "45" }));
  axiosClient.get.mockImplementation(url => Promise.resolve(url === "/products/search" ? page([{ id: 1, name: "Coincidencia", stock: 1, price: 145, iva: 0.16 }], 1) : { data: url === "/admin/productos/1" ? rows[0] : url === "/admin/branches/123/products" ? rows : [] }));
  mount(); await tick();
  change("query", "Coincidencia"); await tick();
  expect(host.querySelector('[data-label="Factor de utilidad"]').textContent).toBe("45%");
  branch = { id: 456, name: "Otra" }; mount(); await tick();
  expect([...host.querySelectorAll("th")].some(th => th.textContent === "Factor de utilidad")).toBe(false);
});

test("changes a factor directly from the table and shows the authoritative price without a full product update", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({ id: index + 1, name: `Producto ${index + 1}`, stock: 1, iva: 0.16, price: 145, profit_factor: "45" }));
  axiosClient.get.mockImplementation(url => Promise.resolve({ data: url === "/admin/productos/1" ? { ...rows[0], purchase_cost: 100 } : url === "/admin/branches/123/products" ? rows : [] }));
  axiosClient.patch.mockResolvedValue({ data: { data: { ...rows[0], profit_factor: "60.0000", price: "160.04", base_price: "137.965517", stock: 999 } } });
  mount(); await tick();
  await act(async () => Simulate.click(host.querySelector('[aria-label="Cambiar factor de utilidad de Producto 1"]')));
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(host.querySelector('[data-label="Factor de utilidad"] input')).toBeNull();
  expect(dialog.textContent).toContain("Costo guardado");
  await act(async () => Simulate.change(dialog.querySelector("input"), { target: { value: "60" } }));
  await act(async () => Simulate.click([...dialog.querySelectorAll("button")].find(button => button.textContent === "Guardar factor")));
  expect(axiosClient.patch).toHaveBeenCalledWith("/admin/products/1/profit-factor", { profit_factor: 60 });
  const row = host.querySelector("tbody tr");
  expect(row.querySelector('[data-label="Precio"]').textContent).toBe("$160.04");
  expect(row.querySelector('[data-label="Factor de utilidad"]').textContent).toBe("60%");
  expect(row.querySelector('[data-label="Stock"]').textContent).toBe("Sin almacén1");
});

test("changing one of 101 positive factors to zero hides the column immediately", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({ id: index + 1, name: `Producto ${index + 1}`, stock: 1, iva: 0, price: 145, profit_factor: "45.0000" }));
  axiosClient.get.mockImplementation(url => Promise.resolve({ data: url === "/admin/productos/1" ? { ...rows[0], purchase_cost: 100 } : url === "/admin/branches/123/products" ? rows : [] }));
  axiosClient.patch.mockResolvedValue({ data: { data: { ...rows[0], profit_factor: "0.0000", price: 100, base_price: 100 } } });
  mount(); await tick();
  await act(async () => Simulate.click(host.querySelector('[aria-label="Cambiar factor de utilidad de Producto 1"]')));
  const dialog = document.querySelector('[role="dialog"]');
  await act(async () => Simulate.change(dialog.querySelector("input"), { target: { value: "0" } }));
  await act(async () => Simulate.click([...dialog.querySelectorAll("button")].find(button => button.textContent === "Guardar factor")));
  expect([...host.querySelectorAll("th")].some(th => th.textContent === "Factor de utilidad")).toBe(false);
  expect(host.querySelector('[data-label="Precio"]').textContent).toBe("$100");
});
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); global.IS_REACT_ACT_ENVIRONMENT = true;
  branch = { id: 123, name: "Centro" };
  mockTotalProducts = 101;
  const setSelectedBranch = jest.fn(), setHideLayout = jest.fn();
  useAdminUi.mockImplementation(() => ({ selectedBranch: branch, setSelectedBranch, setHideLayout }));
  axiosClient.get.mockImplementation(url => Promise.resolve(url === "/products/search" ? page([{ id: 1, name: "Filtro", sku: "SHNN0102", oe_number: "00123", price: "145.00", iva: 0.16 }]) : { data: [] }));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.useRealTimers(); });

test("uses all by default and renders server results with codes, price and branch", async () => {
  mount(); expect(document.body.textContent).toContain("Cargando productos...");
  await tick();
  expect(searchCalls()).toHaveLength(0);
  change("query", "  SHNN0102  "); await tick();
  expect(searchCalls()[0][1].params).toEqual({ q: "SHNN0102", field: "all", branch_id: 123, per_page: 10, page: 1 });
  for (const text of ["Filtro", "SHNN0102", "00123", "$145.00", "Centro"]) expect(document.body.textContent).toContain(text);
  expect(document.querySelector('[title="Editar producto"]')).not.toBeNull();
  const headers = [...document.querySelectorAll("th")].map(th => th.textContent);
  expect(headers).toContain("SKU / OE");
  expect(headers).not.toContain("Sucursal");
});

test.each([0, null, undefined])("confirms unassigned stock %s using the editor detail for listing and search", async stock => {
  const product = { id: 555, name: "Crema", stock, price: 200, iva: 0, warehouse_stocks: [] };
  axiosClient.get.mockImplementation(url => Promise.resolve(
    url === "/admin/productos/555" ? { data: { ...product, stock: 21 } } :
    url === "/products/search" ? page([product], 1) :
    { data: url === "/admin/branches/123/products" ? [product] : [] }
  ));
  mount(); await tick();
  expect(document.querySelector('[data-label="Stock"]').textContent).toBe("Sin almacén21");
  change("query", "Crema"); await tick();
  expect(document.querySelector('[data-label="Stock"]').textContent).toBe("Sin almacén21");
});

test("keeps query and resets page when changing field or branch", async () => {
  mount(); await tick(); change("query", "SHNN0102"); await tick();
  act(() => Simulate.click(document.querySelector('[aria-label="Go to page 2"]'))); await tick();
  expect(searchCalls().at(-1)[1].params.page).toBe(2);
  change("field", "sku"); await tick();
  expect(document.querySelector('[aria-label="query"]').value).toBe("SHNN0102");
  expect(searchCalls().at(-1)[1].params).toMatchObject({ q: "SHNN0102", field: "sku", page: 1, branch_id: 123 });
  branch = { id: 456, name: "Norte" }; mount(); await tick();
  expect(searchCalls().at(-1)[1].params).toMatchObject({ field: "sku", page: 1, branch_id: 456 });
});

test("ignores stale responses and exposes empty and error states", async () => {
  let resolveOld;
  axiosClient.get.mockImplementation(url => url === "/products/search" ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ data: [] }));
  mount(); await tick(); change("query", "old"); await tick();
  change("field", "name");
  axiosClient.get.mockResolvedValue(page([], 1)); await tick();
  await act(async () => resolveOld(page([{ id: 99, name: "Obsoleto" }])));
  expect(document.body.textContent).not.toContain("Obsoleto");
  expect(document.body.textContent).toContain("No se encontraron productos");
  axiosClient.get.mockRejectedValue({ response: { data: { message: "Sin acceso" } } });
  change("query", "x"); await tick();
  expect(document.querySelector('[role="alert"]').textContent).toContain("Sin acceso");
  expect(document.body.textContent).not.toContain("No se encontraron productos");
});

test("does not search empty or whitespace text and restores the branch listing after clearing", async () => {
  mount(); await tick();
  expect(searchCalls()).toHaveLength(0);
  change("query", "   "); await tick();
  expect(searchCalls()).toHaveLength(0);
  change("query", "Manguera"); await tick();
  expect(searchCalls()).toHaveLength(1);
  axiosClient.get.mockResolvedValue({ data: [{ id: 3, name: "Listado normal", price: 10, iva: 0 }] });
  change("query", ""); await tick();
  expect(searchCalls()).toHaveLength(1);
  expect(axiosClient.get).toHaveBeenCalledWith("/admin/branches/123/products");
  expect(document.body.textContent).toContain("Listado normal");
});

test("keeps SKU visible and omits OE and branch columns for a catalog without OE", async () => {
  axiosClient.get.mockImplementation(url => Promise.resolve({ data: url.includes("/products") ? [{ id: 1, name: "Producto", sku: "000123", price: 10, iva: 0 }] : [] }));
  mount(); await tick();
  const headers = [...document.querySelectorAll("th")].map(th => th.textContent);
  expect(headers).toContain("SKU");
  expect(headers).not.toContain("Número OE");
  expect(headers).not.toContain("Sucursal");
  expect(document.querySelector("tbody").textContent).toContain("000123");
});

test("does not reload on focus but still refreshes after an inventory change", async () => {
  mount(); await tick(); change("query", "Filtro"); await tick();
  const previous = searchCalls().length;
  await act(async () => { window.dispatchEvent(new Event("focus")); document.dispatchEvent(new Event("visibilitychange")); });
  expect(searchCalls()).toHaveLength(previous);
  await act(async () => { window.dispatchEvent(new Event("products:changed")); });
  expect(searchCalls()).toHaveLength(previous + 1);
  expect(document.querySelector('[aria-label="query"]').value).toBe("Filtro");
});

test("switches OE to all without clearing text when moving to a branch without OE", async () => {
  mount(); await tick(); change("query", "000123"); await tick();
  change("field", "oe_number"); await tick();
  expect(searchCalls().at(-1)[1].params.field).toBe("oe_number");
  branch = { id: 789, name: "Otra" };
  axiosClient.get.mockResolvedValue(page([], 1)); mount(); await tick();
  expect(searchCalls().at(-1)[1].params).toMatchObject({ q: "000123", branch_id: 789, field: "all", page: 1 });
  expect(document.querySelector('[aria-label="query"]').value).toBe("000123");
});
