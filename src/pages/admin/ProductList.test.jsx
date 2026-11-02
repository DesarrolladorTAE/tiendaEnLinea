import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import ProductList from "./ProductList";
import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), delete: jest.fn() } }));
jest.mock("../../context/AdminUiContext", () => ({ useAdminUi: jest.fn() }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: () => ({ tienda: null, tiendaLoading: false }) }));
jest.mock("../../hooks/useLimiteProductos", () => () => ({ puedeCrear: true, actualizarLimite: jest.fn() }));
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

let root, host, branch;
const searchCalls = () => axiosClient.get.mock.calls.filter(([url]) => url === "/products/search");
const page = (rows, last = 3) => ({ data: { data: rows, current_page: 1, last_page: last } });
const mount = () => act(() => root.render(<MemoryRouter><ProductList /></MemoryRouter>));
const tick = async () => act(async () => { jest.advanceTimersByTime(300); });
const change = (label, value) => act(() => Simulate.change(document.querySelector(`[aria-label="${label}"]`), { target: { value } }));
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); global.IS_REACT_ACT_ENVIRONMENT = true;
  branch = { id: 123, name: "Centro" };
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
  expect(axiosClient.get).toHaveBeenLastCalledWith("/admin/branches/123/products");
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
