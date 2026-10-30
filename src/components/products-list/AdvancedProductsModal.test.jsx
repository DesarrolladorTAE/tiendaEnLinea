import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import AdvancedProductsModal from "./AdvancedProductsModal";
import ImportProductsModal from "./ImportProductsModal";

jest.mock("./importPreview.mjs", () => ({ summarizeProductCsv: jest.fn() }));
jest.mock("./importResult.mjs", () => ({ normalizeImportResult: jest.fn() }));
jest.mock("./ImportResultSummary", () => () => null);
import axiosClient from "../../config/axiosClient";
import { useTienda } from "../../context/TiendaContext";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: jest.fn() }));
let root, host;
const button = text => [...document.querySelectorAll("button")].find(b => b.textContent.includes(text));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  jest.clearAllMocks();
  useTienda.mockReturnValue({ tienda: null });
  axiosClient.get.mockResolvedValue({ data: { data: [] } });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = mode => act(() => root.render(<AdvancedProductsModal mode={mode} branch={{ id: 7, name: "Centro" }} onClose={jest.fn()} onChanged={jest.fn()} />));

test("requires three acceptance steps and the exact confirmation without sending a delete request", () => {
  render("delete");
  act(() => Simulate.click(button("Aceptar y continuar (1/3)")));
  expect(button("Aceptar y continuar (2/3)").disabled).toBe(true);
  act(() => Simulate.change(document.querySelector('input[type="checkbox"]'), { target: { checked: true } }));
  act(() => Simulate.click(button("Aceptar y continuar (2/3)")));
  expect(button("Eliminar definitivamente").disabled).toBe(true);
  act(() => Simulate.change(document.querySelector('input[type="text"]'), { target: { value: "eliminar" } }));
  expect(button("Eliminar definitivamente").disabled).toBe(true);
  act(() => Simulate.change(document.querySelector('input[type="text"]'), { target: { value: "ELIMINAR" } }));
  expect(button("Eliminar definitivamente").disabled).toBe(false);
  expect(axiosClient.delete).not.toHaveBeenCalled();
});

test("rejects unsupported files and files over 20 MB", () => {
  render("excel");
  const input = document.querySelector('input[type="file"]');
  act(() => Simulate.change(input, { target: { files: [new File(["a"], "datos.csv")], value: "" } }));
  expect(button("Importar").disabled).toBe(true);
  act(() => Simulate.change(input, { target: { files: [{ name: "datos.xlsx", size: 20 * 1024 * 1024 + 1 }], value: "" } }));
  expect(button("Importar").disabled).toBe(true);
  expect(axiosClient.post).not.toHaveBeenCalled();
});

test("sends Excel and branch in FormData and keeps row errors available for retry", async () => {
  axiosClient.post.mockRejectedValue({ response: { status: 422, data: { message: "Corrige el archivo", errors: { "fila.7": ["SKU inválido"] } } } });
  render("excel");
  const file = new File(["example"], "datos.xlsx");
  act(() => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [file], value: "" } }));
  await act(async () => { Simulate.click(button("Importar")); });
  const [url, data, config] = axiosClient.post.mock.calls[0];
  expect(url).toBe("/productos/importar-excel");
  expect(data.get("archivo")).toBe(file);
  expect(data.get("branch_id")).toBe("7");
  expect(config.headers).toBeUndefined();
  expect(document.body.textContent).toContain("fila.7:");
  expect(document.body.textContent).toContain("SKU inválido");
  expect(button("Importar").disabled).toBe(false);
});

test("prevents duplicate uploads and shows the successful import summary", async () => {
  let complete;
  axiosClient.post.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  render("excel");
  act(() => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [new File(["example"], "datos.xls")], value: "" } }));
  const submit = button("Importar");
  act(() => { Simulate.click(submit); Simulate.click(submit); });
  expect(axiosClient.post).toHaveBeenCalledTimes(1);
  expect(button("Cancelar").disabled).toBe(true);
  await act(async () => { complete({ data: { message: "Importación completada.", result: { created: 10, updated: 2, total: 12 } } }); });
  expect(document.body.textContent).toContain("Creados: 10 · Actualizados: 2 · Total: 12");
});

test("offers Excel for store 329 alongside normal and SICAR imports and allows returning to the choices", async () => {
  useTienda.mockReturnValue({ tienda: { id: "329" } });
  act(() => root.render(<ImportProductsModal open branch={{ id: 7, name: "Centro" }} onClose={jest.fn()} onImported={jest.fn()} />));
  expect(button("Desde SICAR")).toBeDefined();
  expect(button("Importar Excel")).toBeDefined();
  await act(async () => Simulate.click(button("Importar Excel")));
  expect(document.querySelector('input[type="file"]').accept).toBe(".xlsx,.xls");
  expect(document.body.textContent).toContain("10,000");
  const back = [...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Tipos de"));
  act(() => Simulate.click(back));
  expect(button("Desde SICAR")).toBeDefined();
  expect(button("Importar Excel")).toBeDefined();
  expect(axiosClient.delete).not.toHaveBeenCalled();
});

test.each([null, 328, 330])("hides only Excel for store %s", id => {
  useTienda.mockReturnValue({ tienda: id === null ? null : { id } });
  act(() => root.render(<ImportProductsModal open branch={{ id: 7, name: "Centro" }} onClose={jest.fn()} onImported={jest.fn()} />));
  expect(button("Importar Excel")).toBeUndefined();
  expect(document.querySelectorAll('[aria-pressed]').length).toBe(2);
  expect(button("Desde SICAR")).toBeDefined();
  expect(axiosClient.post).not.toHaveBeenCalled();
});
