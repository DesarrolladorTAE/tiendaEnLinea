import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import BranchVehicleSettings from "./BranchVehicleSettings";
import VehicleCompatibilitySection from "./VehicleCompatibilitySection";
import useBranchCatalogSettings from "../../hooks/useBranchCatalogSettings";
import { useTienda } from "../../context/TiendaContext";
import axiosClient from "../../config/axiosClient";
jest.mock("../../hooks/useBranchCatalogSettings", () => jest.fn());
jest.mock("../../context/TiendaContext", () => ({ useTienda: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn() } }));
jest.mock("../admin/productForm/AccordionSection", () => ({ children, title }) => <section><h2>{title}</h2>{children}</section>);
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return { ...actual, TextField: ({ label, children, value, onChange }) => <select aria-label={label} value={value} onChange={onChange}>{children}</select>, MenuItem: ({ value, children }) => <option value={value}>{children}</option> };
});
let root, host, retry;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  retry = jest.fn(); useTienda.mockReturnValue({ tienda: { id: 566 } });
  useBranchCatalogSettings.mockReturnValue({ settings: { vehicle_feature_available: true, vehicle_compatibilities_enabled: true, catalog_search_mode: "both" }, loading: false, error: "", retry });
  axiosClient.get.mockResolvedValue({ data: { data: [] } }); axiosClient.patch.mockResolvedValue({ data: {} });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test("saves only the selected branch settings without store or branch in the body", async () => {
  await act(async () => root.render(<BranchVehicleSettings branchId={565} />));
  act(() => Simulate.change(host.querySelector('select'), { target: { value: "vehicle" } }));
  await act(async () => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent === "Guardar configuración vehicular")));
  expect(axiosClient.patch).toHaveBeenCalledWith("/admin/branches/565/catalog-settings", { catalog_search_mode: "vehicle", vehicle_compatibilities_enabled: true });
  expect(retry).toHaveBeenCalled();
});
test("hides settings from other stores", () => {
  useTienda.mockReturnValue({ tienda: { id: 329 } });
  act(() => root.render(<BranchVehicleSettings branchId={565} />)); expect(host.textContent).toBe("");
});
test("shows optional editor only when both branch flags permit administration", async () => {
  useBranchCatalogSettings.mockReturnValue({ settings: { vehicle_feature_available: true, vehicle_compatibilities_enabled: false }, loading: false });
  await act(async () => root.render(<VehicleCompatibilitySection branchId={565} watch={() => []} setValue={jest.fn()} />));
  expect(host.textContent).toBe("");
});
test("removing the final loaded vehicle explicitly marks an empty list dirty", async () => {
  const setValue = jest.fn();
  await act(async () => root.render(<VehicleCompatibilitySection branchId={565} isEdit watch={() => [{ vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: 2020, year_to: null }]} setValue={setValue} />));
  act(() => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent.includes("Quitar vehículo"))));
  expect(setValue).toHaveBeenCalledWith("vehicle_compatibilities", [], { shouldDirty: true });
});
test("an unloaded list cannot be cleared accidentally", async () => {
  await act(async () => root.render(<VehicleCompatibilitySection branchId={565} isEdit watch={() => undefined} setValue={jest.fn()} />));
  expect(host.textContent).toContain("todavía no están disponibles");
  expect([...host.querySelectorAll("button")].some(b => b.textContent.includes("Agregar vehículo"))).toBe(false);
});
