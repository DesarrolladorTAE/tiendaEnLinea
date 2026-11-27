import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { readFileSync } from "fs";
import { saveAs } from "file-saver";
import client from "../../config/axiosClient";
import { useTienda } from "../../context/TiendaContext";
import FinancialReportsPage from "./FinancialReportsPage";
import { financialExportPath, localReportDate, moneyMXN, reportError, validDistribution, validReportFilters } from "../../services/admin/financialReports";

jest.mock("../../context/TiendaContext", () => ({ useTienda: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
jest.mock("file-saver", () => ({ saveAs: jest.fn() }));
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ data }) => <div data-testid="series">{data.map((row) => row.raw).join(",")}</div>,
  Bar: () => null, CartesianGrid: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));

const fixtures = readFileSync("docs/frontend-integration/59-fixtures-reportes-administrativos.md", "utf8");
const [weekly, monthly] = [...fixtures.matchAll(/\x60\x60\x60json\s*([\s\S]*?)\x60\x60\x60/g)].map((match) => JSON.parse(match[1]));
const settings = { current_expenses_percent: "60.00", savings_percent: "40.00", cost_tax_basis: "net", timezone: "America/Mexico_City" };
let host, root;
const weeklyUrl = "/admin/reportes/financieros/semanal?branch_id=5&product_id=1&category_id=7&from=2026-11-02&to=2026-11-08";
const view = (path) => <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes>{["semanal", "mensual", "distribucion"].map((key) => <Route key={key} path={`/admin/reportes/financieros/${key}`} element={<FinancialReportsPage view={key} />} />)}</Routes>
</MemoryRouter>;
const mount = (path = weeklyUrl) => act(async () => root.render(view(path)));
const click = (name) => act(async () => [...document.querySelectorAll("button")].find((node) =>
  node.textContent === name || node.getAttribute("aria-label") === name).click());
const change = (label, value) => act(async () => {
  const labelNode = [...document.querySelectorAll("label")].find((item) => item.textContent === label);
  const input = document.getElementById(labelNode.htmlFor);
  input.value = value;
  Simulate.change(input);
});
const install = (report = weekly, month = monthly) => client.get.mockImplementation(async (url, config) => {
  if (url === "/reports/admin/settings") return { data: { data: settings } };
  if (url === "/reports/admin/weekly") return { data: { ...report, report: { ...report.report,
    detail_pagination: { ...report.report.detail_pagination, current_page: config.params.page } } } };
  if (url === "/reports/admin/monthly") return { data: month };
  if (url === "/branches") return { data: { data: [{ id: 5, name: "Centro" }] } };
  if (url === "/admin/categories") return { data: { categories: [{ id: 7, name: "Frenos" }] } };
  throw new Error("Ruta simulada sin fixture.");
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  localStorage.setItem("AUTH_TOKEN", "ficticio");
  useTienda.mockReturnValue({ tienda: { id: 2 }, tiendaLoading: false });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  install();
});
afterEach(() => { act(() => root.unmount()); host.remove(); localStorage.clear(); });

test("acceso directo requiere credencial administrativa", async () => {
  localStorage.removeItem("AUTH_TOKEN");
  localStorage.setItem("POS_TOKEN", "terminal-ficticia");
  await mount();
  expect(client.get).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Inicia sesión como tienda");
});
test("semanal conserva filtros en la paginación y usa el total del periodo", async () => {
  install({ ...weekly, report: { ...weekly.report, detail_pagination: { ...weekly.report.detail_pagination, total: 21 } } });
  await mount();
  expect(host.textContent).toContain("SKU 0001");
  expect(host.textContent).toContain("$100.000000 MXN");
  await click("Go to page 2");
  expect(client.get.mock.calls.filter(([url]) => url === "/reports/admin/weekly").at(-1)[1].params).toEqual({
    from: "2026-11-02", to: "2026-11-08", branch_id: "5", product_id: "1", category_id: "7", page: 2, per_page: 20,
  });
  expect(host.textContent).toContain("$100.000000 MXN");
});
test("distingue costo nulo y cero, pérdida, devoluciones, cancelaciones y cobranza", async () => {
  const summary = { ...weekly.report.summary, cost_coverage: "incomplete", missing_cost_lines: 1, missing_cost_quantity: "1.000000",
    gross_profit: null, profit_status: "incomplete_cost", distribution: { current_expenses_assigned: null, savings_assigned: null },
    returns_amount: "58.000000", cancellations_amount: "38.000000", commercial: { credit_originated: "240.000000" } };
  const item = weekly.report.details[0];
  install({ ...weekly, report: { ...weekly.report, summary, details: [
    { ...item, unit_cost_at_sale: null }, { ...item, sale_item_id: 2, unit_cost_at_sale: "0.000000", gross_profit: "-10.000000" },
  ] } });
  await mount();
  for (const message of ["Costo histórico no registrado", "$0.000000 MXN", "-$10.000000 MXN", "Utilidad bruta no disponible",
    "$58.000000 MXN", "$38.000000 MXN", "$240.000000 MXN", "Costo histórico parcial"]) {
    expect(host.textContent).toContain(message);
  }
});
test("periodo sin partidas sigue siendo un resultado y explica base fiscal desconocida", async () => {
  install({ ...weekly, report: { ...weekly.report, details: [], summary: {
    ...weekly.report.summary, gross_profit: null, profit_status: "tax_basis_unconfirmed",
  } } });
  await mount();
  expect(host.textContent).toContain("Sin partidas");
  expect(host.textContent).toContain("La base fiscal del costo requiere confirmación");
});
test("mensual usa semanas de Laravel y abre el bloque recortado preservando los filtros", async () => {
  await mount("/admin/reportes/financieros/mensual?branch_id=5&product_id=1&category_id=7&month=11&year=2026");
  expect(host.querySelector('[data-testid="series"]').textContent).toBe(monthly.report.weeks[0].summary.sales_net_without_tax);
  expect(host.textContent).toContain("Suma de asignaciones semanales");
  await click("Ver detalle semanal");
  expect(client.get).toHaveBeenCalledWith("/reports/admin/weekly", expect.objectContaining({ params: expect.objectContaining({
    from: monthly.report.weeks[0].from, to: monthly.report.weeks[0].to, branch_id: "5", product_id: "1", category_id: "7",
  }) }));
});
test("distribución 60/40 permite guardar decimales y omite ajustes fiscales", async () => {
  await mount("/admin/reportes/financieros/distribucion");
  expect(host.querySelector('input[value="60.00"]')).not.toBeNull();
  await change("Gastos corrientes (%)", "65.5");
  expect([...host.querySelectorAll("button")].find((button) => button.textContent === "Guardar distribución").disabled).toBe(true);
  await change("Ahorro (%)", "34.5");
  client.put.mockResolvedValue({ data: { data: { ...settings, current_expenses_percent: "65.5", savings_percent: "34.5" } } });
  await click("Guardar distribución");
  expect(client.put).toHaveBeenCalledWith("/reports/admin/settings",
    { current_expenses_percent: "65.5", savings_percent: "34.5" }, expect.any(Object));
  expect(host.textContent).toContain("Distribución guardada");
});

test("oculta datos al cambiar filtro y descarta la respuesta de un contexto anterior", async () => {
  const defaultGet = client.get.getMockImplementation();
  let stale;
  client.get.mockImplementation((url, config) => {
    if (url !== "/reports/admin/weekly") return defaultGet(url, config);
    if (config.params.to === "2026-11-08") return new Promise((resolve) => { stale = { signal: config.signal, resolve }; });
    return Promise.reject({ response: { status: 404 } });
  });
  await mount();
  await change("Hasta", "2026-11-07");
  expect(stale.signal.aborted).toBe(true);
  expect(host.textContent).toContain("no está disponible en esta tienda");
  await act(async () => stale.resolve({ data: weekly }));
  expect(host.textContent).not.toContain("SKU 0001");
});
test("una respuesta de otra tienda se descarta", async () => {
  install({ ...weekly, store: { id: 17 } });
  await mount();
  expect(host.textContent).not.toContain("SKU 0001");
  expect(host.textContent).toContain("no coincide con la tienda");
});

test("PDF y Excel conservan filtros y exportan el periodo completo", async () => {
  const defaultGet = client.get.getMockImplementation();
  const workbook = new Blob([new Uint8Array([80, 75, 3, 4, 0])], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const pdf = new Blob(["%PDF-1.7"], { type: "application/pdf" });
  URL.createObjectURL = jest.fn(() => "blob:report");
  URL.revokeObjectURL = jest.fn();
  client.get.mockImplementation((url, config) => url.includes("/pdf?") ? Promise.resolve({ data: pdf })
    : url.includes("/excel?") ? Promise.resolve({ data: workbook }) : defaultGet(url, config));
  await mount(weeklyUrl + "&page=2");
  await click("Descargar Excel");
  await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  expect(saveAs).toHaveBeenCalledWith(workbook, "reporte-semanal.xlsx");
  await click("Vista previa PDF");
  await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  expect(document.querySelector('iframe[title="Reporte financiero PDF"]')).not.toBeNull();
  for (const format of ["excel", "pdf"]) expect(client.get).toHaveBeenCalledWith(
    `/reports/admin/weekly/${format}?from=2026-11-02&to=2026-11-08&branch_id=5&product_id=1&category_id=7`,
    expect.objectContaining({ responseType: "blob" }));
  await click("Cerrar");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
});

test("Excel con sesión vencida quita el reporte financiero", async () => {
  const defaultGet = client.get.getMockImplementation();
  client.get.mockImplementation((url, config) => url.includes("/excel?") ?
    Promise.reject({ response: { status: 401, data: new Blob(['{"message":"Unauthenticated"}'], { type: "application/json" }) } }) : defaultGet(url, config));
  await mount();
  await click("Descargar Excel");
  expect(host.textContent).toContain("Tu sesión venció");
  expect(host.textContent).not.toContain("SKU 0001");
  expect(saveAs).not.toHaveBeenCalled();
});

test("valida semana, mes, porcentajes exactos, zona y visualización decimal", () => {
  expect(validReportFilters("weekly", { from: "2026-11-02", to: "2026-11-09" })).toBe(false);
  expect(validReportFilters("weekly", { from: "2026-02-30", to: "2026-03-02" })).toBe(false);
  expect(validReportFilters("monthly", { year: "2200", month: "12" })).toBe(true);
  expect(validDistribution("66.666667", "33.333333")).toBe(true);
  expect(validDistribution("66.666667", "33.333334")).toBe(false);
  expect(moneyMXN("999999999999.123456")).toContain(".123456 MXN");
  expect(moneyMXN(null)).toBe("No disponible");
  expect(localReportDate("America/Mexico_City", new Date("2026-11-02T03:00Z"))).toBe("2026-11-01");
  expect(financialExportPath("monthly", "excel", { year: 2026, month: 11, page: 3 })).toBe("/reports/admin/monthly/excel?year=2026&month=11");
});
test("conserva el mensaje JSON contenido en un blob de error", async () => {
  await expect(reportError({ response: { data: new Blob(['{"message":"Archivo no disponible"}'], { type: "application/json" }) } })).resolves.toBe("Archivo no disponible");
});

