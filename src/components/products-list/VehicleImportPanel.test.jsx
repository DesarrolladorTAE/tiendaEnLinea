import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import VehicleImportPanel from "./VehicleImportPanel";
import axiosClient from "../../config/axiosClient";
import { useTienda } from "../../context/TiendaContext";
import { saveAs } from "file-saver";
import { normalizeImportResult } from "./importResult.mjs";
jest.mock("../../hooks/useBranchCatalogSettings", () => () => ({ settings: { vehicle_feature_available: true, vehicle_compatibilities_enabled: true }, loading: false, error: "" }));
jest.mock("file-saver", () => ({ saveAs: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: jest.fn() }));
jest.mock("./importResult.mjs", () => ({ normalizeImportResult: jest.fn(() => ({})) }));
jest.mock("./ImportResultSummary", () => () => <div>Resultado disponible</div>);
let root, host;
const button = text => [...document.querySelectorAll("button")].find(b => b.textContent.includes(text));
const render = (mode = "autoparts") => act(() => root.render(<VehicleImportPanel mode={mode} branch={{ id: 7, name: "Centro" }} onBusy={jest.fn()} onImported={jest.fn()} />));
const select = file => act(() => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [file] } }));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  useTienda.mockReturnValue({ tienda: { id: 566 } });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test("downloads the combined template", async () => {
  const data = new Blob(["excel"]); axiosClient.get.mockResolvedValue({ data }); render();
  await act(async () => Simulate.click(button("Descargar plantilla")));
  expect(axiosClient.get).toHaveBeenCalledWith("/products/import-with-vehicles/template", { responseType: "blob", params: undefined });
  expect(saveAs).toHaveBeenCalledWith(data, "plantilla-productos-vehiculos.xlsx");
});
test.each(["xlsx", "xls", "csv"])("uploads %s products and vehicles together with only file and branch", async extension => {
  const payload = { resumen: { total: 2, creados: 1, errores: 1 }, errores_validacion: [{ fila: 4, motivo: "Modelo requerido" }] };
  axiosClient.post.mockResolvedValue({ data: payload }); render();
  const file = new File(["data"], `productos.${extension}`); select(file);
  await act(async () => Simulate.click(button("Importar productos y vehículos")));
  const [url, data] = axiosClient.post.mock.calls[0];
  expect(url).toBe("/products/import-with-vehicles");
  expect(data.get("archivo")).toBe(file); expect(data.get("branch_id")).toBe("7");
  expect([...data.keys()]).toEqual(["archivo", "branch_id"]);
  expect(normalizeImportResult).toHaveBeenCalledWith(expect.objectContaining(payload), false, "productos");
});
test("rejects combined files over 2 MB and keeps the 20 MB compatibility limit", () => {
  render(); select({ name: "productos.xlsx", size: 2 * 1024 * 1024 + 1 });
  expect(button("Importar productos y vehículos").disabled).toBe(true);
  expect(document.body.textContent).toContain("máximo 2 MB");
  render("vehicles"); select(new File(["data"], "compatibilidades.csv"));
  expect(button("Importar compatibilidades").disabled).toBe(false);
  select({ name: "compatibilidades.xlsx", size: 20 * 1024 * 1024 + 1 });
  expect(button("Importar compatibilidades").disabled).toBe(true);
  expect(document.body.textContent).toContain("máximo 20 MB");
  expect(axiosClient.post).not.toHaveBeenCalled();
});
test("hides vehicle imports from other stores", () => {
  useTienda.mockReturnValue({ tienda: { id: 329 } }); render();
  expect(host.textContent).toBe(""); expect(axiosClient.get).not.toHaveBeenCalled();
});
