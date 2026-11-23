import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import VehicleCatalogSearch from "./VehicleCatalogSearch";
import { getPublicVehicleResource } from "../../services/public/storefrontService";
jest.mock("../../services/public/storefrontService", () => ({ getPublicVehicleResource: jest.fn() }));
jest.mock("../../wrappers/product/ShopProducts", () => ({ products }) => <div>{products.map(p => p.name).join(",")}</div>);
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return { ...actual, TextField: ({ select, label, children, inputProps, ...props }) => select ? <select aria-label={label} value={props.value} disabled={props.disabled} onChange={props.onChange}>{children}</select> : <input aria-label={label} value={props.value} type={props.type} onChange={props.onChange} />, MenuItem: ({ children, value }) => <option value={value}>{children}</option>, Pagination: ({ onChange }) => <button onClick={() => onChange(null, 2)}>Página 2</button> };
});
let root, host;
const searches = () => getPublicVehicleResource.mock.calls.filter(c => c[1] === "search-by-vehicle");
const change = (label, value) => act(() => Simulate.change(host.querySelector(`[aria-label="${label}"]`), { target: { value } }));
const tick = () => act(async () => { jest.advanceTimersByTime(300); });
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers(); jest.clearAllMocks();
  getPublicVehicleResource.mockImplementation((slug, resource) => Promise.resolve({ data: resource === "vehicle-brands" ? { data: [{ id: 1, name: "Nissan" }, { id: 2, name: "Toyota" }] } : resource === "vehicle-models" ? { data: [{ id: 3, name: "Versa" }] } : resource === "vehicle-years" ? { data: [2020], has_open_ranges: true } : resource === "vehicle-part-types" ? { data: [{ id: 4, name: "Faros" }] } : { data: [{ id: 42, name: "Faro original" }], total: 25, last_page: 2 } }));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<VehicleCatalogSearch branchSlug="centro" shopProps={{}} />));
  await tick();
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.useRealTimers(); });
test("uses the public branch context, server pagination and existing product cards", async () => {
  expect(host.textContent).toContain("Faro original");
  expect(searches()[0][0]).toBe("centro");
  expect(searches()[0][2].params).toEqual({ page: 1, per_page: 20 });
  act(() => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent === "Página 2")));
  await tick(); expect(searches().at(-1)[2].params.page).toBe(2);
});
test("clears dependent filters and cancels the previous search", async () => {
  const firstSignal = searches()[0][2].signal;
  change("Marca", "1"); await act(async () => {}); await tick();
  expect(firstSignal.aborted).toBe(true);
  change("Modelo", "3"); await act(async () => {});
  change("Año", "2020"); await act(async () => {});
  change("Tipo de refacción", "4"); await tick();
  expect(searches().at(-1)[2].params).toEqual({ brand_id: "1", model_id: "3", year: "2020", category_id: "4", page: 1, per_page: 20 });
  change("Marca", "2"); await act(async () => {}); await tick();
  expect(searches().at(-1)[2].params).toEqual({ brand_id: "2", page: 1, per_page: 20 });
});
test("supports manual years for open ranges and rejects invalid years", async () => {
  change("Marca", "1"); await act(async () => {});
  change("Modelo", "3"); await act(async () => {});
  change("Año", "1800"); await tick();
  expect(host.textContent).toContain("Introduce un año entero entre 1886 y 2200");
  change("Año", "2022"); await tick(); expect(searches().at(-1)[2].params.year).toBe("2022");
});
