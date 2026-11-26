import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ServiceOperationsPage from "./ServiceOperationsPage";
import useVehicleRecordsAccess from "../../hooks/useVehicleRecordsAccess";
import client from "../../config/axiosClient";

jest.mock("../../context/TiendaContext", () => ({ useTienda: () => ({ tiendaLoading: false }) }));
jest.mock("../../hooks/useDynamicFormsAccess", () => ({ __esModule: true, default: () => ({ read: true }) }));
jest.mock("../../hooks/useVehicleRecordsAccess", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));

let root;
let host;
const order = { id: 77, branch_id: 12, order_code: "SO-DEMO", service_id: 8, status: { code: "in_progress" },
  vehicle_id: 81, visit_mileage: 0, vehicle_snapshot: { brand: "Marca histórica", plates: "DEMO-01" },
  customer_snapshot: { name: "Cliente histórico" }, history: [{ id: 1, description: "Recepción registrada", created_at: "2026-11-26T12:00:00Z" }],
  form_requirements_snapshot: [{ template_id: 7, required: true, version: 2, name: "Inspección de recepción" }] };
const mount = (path, mode) => act(async () => root.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes>
    <Route path="/admin/services/bookings" element={<ServiceOperationsPage mode={mode} />} />
    <Route path="/admin/services/orders/:orderId" element={<ServiceOperationsPage mode={mode} />} />
  </Routes>
</MemoryRouter>));

const press = (label) => act(async () => [...document.querySelectorAll("button")].find(
  (item) => item.textContent === label).click());
const choose = async (label, value) => {
  const input = [...document.querySelectorAll('input[role="combobox"]')].find(
    (item) => document.querySelector('label[for="' + item.id + '"]')?.textContent === label);
  await act(async () => { input.focus(); Simulate.keyDown(input, { key: "ArrowDown" }); });
  await act(async () => [...document.querySelectorAll('[role="option"]')].find(
    (item) => item.textContent === value).click());
};

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  useVehicleRecordsAccess.mockReturnValue({ storeId: 3, branch: { id: 12 }, canRead: true, canWrite: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("un acceso directo sin sesión no consulta operaciones", async () => {
  useVehicleRecordsAccess.mockReturnValue({ branch: { id: 12 } });
  await mount("/admin/services/orders/77", "orders");
  expect(host.textContent).toContain("sesión administrativa");
  expect(client.get).not.toHaveBeenCalled();
});

test("un detalle 403 mantiene ocultas las acciones y el registro", async () => {
  client.get.mockRejectedValue({ response: { status: 403 } });
  await mount("/admin/services/orders/77", "orders");
  expect(host.textContent).toContain("No tienes acceso");
  expect(host.textContent).not.toContain("Finalizar orden");
});

test("la ficha conserva snapshots y cero, y bloquea el cierre con inspecciones pendientes", async () => {
  client.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith("/resources") ? { resources: [] }
    : { data: order, forms_progress: { required_pending: [7] } } }));
  await mount("/admin/services/orders/77", "orders");
  expect(host.textContent).toContain("Marca histórica");
  expect(host.textContent).toContain("Kilometraje de visita: 0");
  expect(host.textContent).toContain("Inspección de recepción");
  expect(host.textContent).toContain("Recepción registrada");
  expect([...host.querySelectorAll("button")].find((button) => button.textContent === "Finalizar orden").disabled).toBe(true);
  expect(host.querySelector('a[href="/admin/services/orders/77/forms?branch_id=12"]')).not.toBeNull();
});

test("la ficha descarta un detalle cuya sucursal no coincide", async () => {
  client.get.mockResolvedValue({ data: { data: { ...order, branch_id: 99 } } });
  await mount("/admin/services/orders/77", "orders");
  expect(host.textContent).toContain("no coincide");
  expect(host.textContent).not.toContain(order.order_code);
});


test("recepción tradicional conserva la clave al reintentar y bloquea el doble envío", async () => {
  const customer = { id: 14, nombre_alias: "Cliente demo" };
  const service = { id: 4, name: "Servicio demo", config: null };
  client.get.mockImplementation(async (url) => {
    if (url === "/clientes/simple") return { data: { data: [customer] } };
    if (url.endsWith("/services")) return { data: { services: { last_page: 1, data: [service] } } };
    if (url.endsWith("/services/4")) return { data: { service } };
    if (url.endsWith("/resources")) return { data: { resources: [] } };
    return { data: { last_page: 1, data: [] } };
  });
  client.post.mockRejectedValueOnce({ response: { status: 422, data: { message: "Revisa la recepción." } } });
  let finish;
  client.post.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID: () => "demo-idempotency-key" }, configurable: true });
  try {
    await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ServiceOperationsPage mode="orders" /></MemoryRouter>));
    await press("Recepción sin cita");
    await choose("Cliente", customer.nombre_alias);
    await choose("Servicio", service.name);
    expect(document.body.textContent).not.toContain("Vehículo obligatorio");
    const form = document.querySelector('[role="dialog"] form');
    await act(async () => { Simulate.submit(form); Simulate.submit(form); });
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("Revisa la recepción.");
    await act(async () => { Simulate.submit(form); Simulate.submit(form); });
    expect(client.post).toHaveBeenCalledTimes(2);
    const bodies = client.post.mock.calls.map(([,body]) => body);
    expect(bodies[0]).toEqual(bodies[1]);
    expect(bodies[1]).toMatchObject({ customer_id: 14, service_id: 4, vehicle_id: null });
    await act(async () => finish({ data: { data: { id: 77, branch_id: 12 } } }));
  } finally {
    if (original) Object.defineProperty(globalThis, "crypto", original);
    else delete globalThis.crypto;
  }
});

test("cita vehicular bloquea el guardado sin expediente y conserva observaciones si se agota el horario", async () => {
  const customer = { id: 14, nombre_alias: "Cliente demo" };
  const service = { id: 8, name: "Servicio vehicular", config: { vehicle_requirement: "required" } };
  client.get.mockImplementation(async (url) => {
    if (url === "/clientes/simple") return { data: { data: [customer] } };
    if (url.endsWith("/services")) return { data: { services: { last_page: 1, data: [service] } } };
    if (url.endsWith("/services/8")) return { data: { service } };
    if (url.endsWith("/resources")) return { data: { resources: [] } };
    if (url === "/clients/14/vehicles") return { data: { data: [{ id: 81, plates: "DEMO-01", is_active: true }] } };
    if (url.endsWith("/availability")) return { data: { data: { timezone: "America/Mexico_City",
      slots: [{ start_time: "10:00", end_time: "11:00" }] } } };
    return { data: { last_page: 1, data: [] } };
  });
  client.post.mockRejectedValue({ response: { status: 422, data: { errors: { start_time: ["Horario agotado."] } } } });
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID: () => "demo-booking-key" }, configurable: true });
  try {
    await mount("/admin/services/bookings", "bookings");
    await press("Programar cita");
    await choose("Cliente", customer.nombre_alias);
    await choose("Servicio", service.name);
    const form = document.querySelector('[role="dialog"] form');
    const submit = form.querySelector('[type="submit"]');
    const date = form.querySelector('input[type="date"]');
    const notes = form.querySelector('textarea');
    const slots = [...form.querySelectorAll('div[role="combobox"]')].at(-1);
    await act(async () => { date.value = "2026-12-02"; Simulate.change(date); });
    await act(async () => Simulate.mouseDown(slots, { button: 0 }));
    await act(async () => [...document.querySelectorAll('[role="option"]')].find((node) => node.textContent.includes("10:00")).click());
    expect(submit.disabled).toBe(true);
    await choose("Vehículo obligatorio", "DEMO-01");
    await act(async () => { notes.value = "Trae el comprobante"; Simulate.change(notes); });
    expect(submit.disabled).toBe(false);
    await act(async () => Simulate.submit(form));
    expect(client.post.mock.calls[0][1]).toMatchObject({ customer_id: 14, vehicle_id: 81, start_time: "10:00" });
    expect(form.textContent).toContain("Horario agotado.");
    expect(notes.value).toBe("Trae el comprobante");
    expect(submit.disabled).toBe(true);
    expect(client.get.mock.calls.filter(([url]) => url.endsWith("/availability"))).toHaveLength(2);
  } finally {
    if (original) Object.defineProperty(globalThis, "crypto", original);
    else delete globalThis.crypto;
  }
});
