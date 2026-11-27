import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import POSServiceWorkspace from "./POSServiceWorkspace";
import client from "../../config/axiosClientPOS";
import admin from "../../config/axiosClient";

jest.mock("../../config/axiosClientPOS", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: () => { throw new Error("Contexto administrativo en POS"); } }));

const keys = ["service_sales", "vehicle_records", "service_forms", "sales"];
const flags = { available: true, enabled: true, visible: true, store_enabled: true, source: "pos", operational_enabled: true };
const page = (rows = []) => ({ data: rows, current_page: 1, last_page: 1, total: rows.length });
const order = { id: 77, store_id: 3, branch_id: 12, order_code: "SO-DEMO", status: { code: "pending" } };
const service = { id: 8, name: "Servicio ficticio", config: { vehicle_requirement: "none" } };
const customer = { id: 14, nombre_alias: "Cliente ficticio" };
let host;
let root;
let terminal;
let enabled;
let fail;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  terminal = { id: 9, branch_id: 12, store_id: 3, abilities: ["sell-only"] };
  enabled = keys;
  fail = {};
  client.post.mockReset().mockImplementation(async (path) => {
    if (path === "/pos/me") return { data: terminal };
    if (path === "/service-orders/77/forms") return { data: { data: { id: 901, service_order_id: 77 } } };
    if (path === "/branches/12/service-orders") return { data: { data: order } };
    throw new Error(path);
  });
  client.get.mockReset().mockImplementation(async (path) => {
    if (fail[path]) throw { response: { status: fail[path] } };
    if (path === "/my-products-by-pos1") return { data: { pos: { id: terminal.id }, ...terminal } };
    if (path === "/pos/modules") return { data: { data: enabled.map((key) => ({ key, ...flags })) } };
    if (path.endsWith("/catalog-settings")) return { data: { data: { branch_id: terminal.branch_id, capabilities: {
      scope: { actor: "pos", branch_id: terminal.branch_id, pos_location_id: terminal.id },
      vehicle_records: { ...flags, authorization: { read: true, write: true } },
      service_forms: { ...flags, authorization: { read: true, capture: true } },
    } } } };
    if (path.endsWith("/services")) return { data: { services: page([service]) } };
    if (path.endsWith("/services/8")) return { data: { service } };
    if (path.endsWith("/resources")) return { data: { resources: [] } };
    if (path.endsWith("/bookings") || path.endsWith("/service-orders")) return { data: page() };
    if (path.endsWith("/service-orders/77")) return { data: { data: order, forms_progress: { required_pending: [] } } };
    if (path.endsWith("/service-orders/77/forms")) return { data: { data: { order_id: 77, forms: [{ template_id: 7, required: true }], submissions: [] } } };
    if (path.endsWith("/service-orders/77/forms/901")) return { data: { data: {
      id: 901, service_order_id: 77, status: "draft", folio: "SF-DEMO", answers: {},
      schema_snapshot: { title: "Inspección de recepción", sections: [
        { id: "general", title: "General", fields: [{ id: "condition", label: "Condición exterior", type: "short_text" }] },
      ] },
    } } };
    if (path === "/vehicles") return { data: page([{ id: 81, is_active: true, plates: "DEMO" }]) };
    if (path === "/vehicles/81") return { data: { data: { id: 81, is_active: true, plates: "DEMO" } } };
    if (path === "/clientes/simple") return { data: page([customer]) };
    throw new Error(path);
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  expect(admin.get).not.toHaveBeenCalled();
  expect(admin.post).not.toHaveBeenCalled();
});

const render = (query = "", props = {}) => act(async () => {
  root.render(<MemoryRouter initialEntries={[`/prueba/pos?${query}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <POSServiceWorkspace section="servicios" posId={9} branchId={99} moduleKeys={keys} session={1} {...props} />
  </MemoryRouter>);
});
const paths = () => client.get.mock.calls.map(([path]) => path);

test("navega de Servicios a Agenda usando solo la sucursal autenticada", async () => {
  await render("branch_id=99");
  const agenda = [...host.querySelectorAll("a")].find((item) => item.textContent === "Agenda");
  expect(agenda).toBeDefined();
  await act(async () => agenda.click());
  expect(host.textContent).toContain("Agenda de servicios");
  expect(host.textContent).not.toContain("El periodo cambió mientras se cargaba");
  expect(paths()).toContain("/branches/12/bookings");
  expect(paths().every((path) => !path.includes("/99/"))).toBe(true);
});

test("crea una sola orden sin cita en la sucursal autenticada", async () => {
  await render("vista=intake");
  expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain("Recepción sin cita");
  expect(paths()).toContain("/branches/12/service-orders");
  expect(paths()).toContain("/clientes/simple");
  const choose = async (field, label) => {
    const input = [...document.querySelectorAll('[role="dialog"] input[role="combobox"]')].find(
      (item) => document.querySelector(`label[for="${item.id}"]`)?.textContent === field);
    await act(async () => { input.focus(); Simulate.keyDown(input, { key: "ArrowDown" }); });
    await act(async () => [...document.querySelectorAll('[role="option"]')].find((item) => item.textContent === label).click());
  };
  await choose("Cliente", customer.nombre_alias);
  await choose("Servicio", service.name);
  const crypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID: () => "pos-demo-idempotency" }, configurable: true });
  try {
    const form = document.querySelector('[role="dialog"] form');
    await act(async () => { Simulate.submit(form); Simulate.submit(form); });
    const writes = client.post.mock.calls.filter(([path]) => path.endsWith("/service-orders"));
    expect(writes).toHaveLength(1);
    expect(writes[0][1]).toMatchObject({ customer_id: 14, service_id: 8, idempotency_key: "pos-demo-idempotency" });
    expect(host.textContent).toContain("SO-DEMO");
  } finally {
    if (crypto) Object.defineProperty(globalThis, "crypto", crypto);
    else delete globalThis.crypto;
  }
});

test("abre una orden y sus inspecciones, y conserva un enlace a la venta existente", async () => {
  await render("vista=orders&id=77");
  expect(host.textContent).toContain("SO-DEMO");
  expect(host.querySelector('a[href="/prueba/pos?seccion=venta"]')).toBeTruthy();
  const forms = [...host.querySelectorAll("a")].find((item) => item.textContent === "Abrir capturas");
  await act(async () => forms.click());
  expect(host.textContent).toContain("Formularios de la orden #77");
  await act(async () => [...host.querySelectorAll("button")].find((item) => item.textContent === "Iniciar captura").click());
  expect(client.post).toHaveBeenCalledWith("/service-orders/77/forms", { template_id: 7 }, expect.any(Object));
  expect(host.textContent).toContain("Condición exterior");
  expect(host.textContent).toContain("Guardar borrador");
});

test("rechaza una inspección directa si su módulo está deshabilitado", async () => {
  enabled = ["service_sales", "vehicle_records"];
  await render("vista=forms&id=77");
  expect(host.textContent).toContain("Inspecciones no disponibles");
  expect(paths()).not.toContain("/service-orders/77/forms");
});

test("muestra un expediente POS sin acciones administrativas", async () => {
  await render("id=81", { section: "expedientes" });
  expect(host.textContent).toContain("Expedientes vehiculares");
  expect(host.textContent).toContain("DEMO");
  expect(host.textContent).not.toMatch(/Desactivar vehículo|Activar vehículo|Regenerar QR|Cambiar sucursal/);
  expect(paths()).toContain("/vehicles/81");
});

test.each([401, 403, 404])("maneja HTTP %s y permite recuperar la consulta", async (status) => {
  fail["/branches/12/service-orders/77"] = status;
  await render("vista=orders&id=77");
  expect(host.querySelector('[role="alert"]')).toBeTruthy();
  expect(host.textContent).not.toContain("SO-DEMO");
  delete fail["/branches/12/service-orders/77"];
  await act(async () => [...host.querySelectorAll("button")].find((item) => item.textContent === "Reintentar").click());
  expect(host.textContent).toContain("SO-DEMO");
});

test("al cambiar terminal borra el detalle anterior y consulta el nuevo contexto", async () => {
  await render("vista=orders&id=77");
  expect(host.textContent).toContain("SO-DEMO");
  terminal = { id: 10, branch_id: 18, store_id: 3, abilities: ["sell-only"] };
  fail["/branches/18/service-orders/77"] = 404;
  await render("vista=orders&id=77", { posId: 10, session: 2 });
  expect(host.textContent).not.toContain("SO-DEMO");
  expect(paths()).toContain("/branches/18/service-orders/77");
});
