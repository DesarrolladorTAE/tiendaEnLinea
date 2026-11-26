import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import VehicleRecordsPage from "./VehicleRecordsPage";
import useVehicleRecordsAccess from "../../hooks/useVehicleRecordsAccess";
import useDynamicFormsAccess from "../../hooks/useDynamicFormsAccess";
import client from "../../config/axiosClient";
import { readVehicle, readVehiclePage, vehicleDocumentPath } from "../../services/admin/vehicleRecords";
import { showConfirm } from "../../utils/alerts";
import { prepareVehicleWrite, vehicleDraft } from "../../components/vehicles/VehicleRecordFields";

jest.mock("../../hooks/useVehicleRecordsAccess", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../hooks/useDynamicFormsAccess", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

let root;
let host;
const vehicle = { id: 42, customer_id: 7, vehicle_brand_id: 3, vehicle_model_id: 8, year: 2020 };
const click = (label) => act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === label).click());
const input = (label) => document.getElementById([...host.querySelectorAll("label")].find((node) => node.textContent === label).htmlFor);
const change = (label, value) => act(async () => { const element = input(label); element.value = value; Simulate.change(element); });
const select = async (label, choice) => {
  await act(async () => {
    const element = input(label);
    element.focus();
    Simulate.mouseDown(element);
  });
  const option = [...document.querySelectorAll('[role="option"]')].find((node) => node.textContent === choice);
  await act(async () => option.click());
};
const tree = (path) => <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes>
    <Route path="/admin/services/vehicles" element={<VehicleRecordsPage />} />
    <Route path="/admin/services/vehicles/:vehicleId" element={<VehicleRecordsPage />} />
    <Route path="/admin/services/vehicles/client/:customerId" element={<VehicleRecordsPage />} />
    <Route path="/admin/services/vehicles/new" element={<VehicleRecordsPage mode="new" />} />
    <Route path="/admin/services/vehicles/:vehicleId/edit" element={<VehicleRecordsPage mode="edit" />} />
    <Route path="/admin/services/vehicles/resolve" element={<VehicleRecordsPage mode="resolve" />} />
  </Routes>
</MemoryRouter>;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  useVehicleRecordsAccess.mockReturnValue({ canRead: true, branch: { id: 12 }, storeId: 1 });
  useDynamicFormsAccess.mockReturnValue({ read: false });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("blocks a direct route before issuing a request when access is denied", async () => {
  useVehicleRecordsAccess.mockReturnValue({ canRead: false, branch: { id: 12 }, storeId: 1 });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  expect(host.textContent).toContain("No tienes acceso");
  expect(client.get).not.toHaveBeenCalled();
});

test("paginates without extra requests per vehicle", async () => {
  client.get.mockResolvedValueOnce({ data: { data: [vehicle], last_page: 2 } })
    .mockResolvedValueOnce({ data: { data: [{ ...vehicle, id: 43 }], last_page: 2 } });
  await act(async () => root.render(tree("/admin/services/vehicles")));
  expect(host.textContent).toContain("#42");
  await click("2");
  expect(host.textContent).toContain("#43");
  expect(client.get.mock.calls.map(([path, config]) => [path, config.params.page])).toEqual([["/vehicles", 1], ["/vehicles", 2]]);
});

test("uses the authorized customer vehicles endpoint", async () => {
  client.get.mockResolvedValue({ data: { data: [vehicle] } });
  await act(async () => root.render(tree("/admin/services/vehicles/client/7")));
  expect(host.textContent).toContain("Vehículos del cliente #7");
  expect(client.get).toHaveBeenCalledWith("/clients/7/vehicles", expect.objectContaining({ params: { page: 1 } }));
});

test("discards an obsolete response on branch and store change", async () => {
  let previous;
  client.get.mockImplementationOnce(() => new Promise((resolve) => { previous = resolve; }))
    .mockResolvedValueOnce({ data: { data: [{ ...vehicle, id: 43 }] } });
  await act(async () => root.render(tree("/admin/services/vehicles")));
  const signal = client.get.mock.calls[0][1].signal;
  useVehicleRecordsAccess.mockReturnValue({ canRead: true, branch: { id: 15 }, storeId: 2 });
  await act(async () => root.render(tree("/admin/services/vehicles")));
  await act(async () => previous({ data: { data: [vehicle] } }));
  expect(signal.aborted).toBe(true);
  expect(host.textContent).toContain("#43");
  expect(host.textContent).not.toContain("#42");
});

test("requests private documents under the branch using blobs and disposes the QR preview", async () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn().mockReturnValue("blob:fixture");
  URL.revokeObjectURL = jest.fn();
  try {
    client.get.mockResolvedValueOnce({ data: { data: vehicle } })
      .mockResolvedValueOnce({ data: new Blob(["<svg/>"], { type: "image/svg+xml" }) })
      .mockResolvedValueOnce({ data: new Blob(["%PDF"], { type: "application/pdf" }) });
    await act(async () => root.render(tree("/admin/services/vehicles/42")));
    await click("Identificación");
    expect(host.querySelector('img[alt="Código QR del vehículo"]').src).toBe("blob:fixture");
    expect(client.get).toHaveBeenCalledWith("/branches/12/vehicles/42/qr.svg", expect.objectContaining({ responseType: "blob", __skipSupportIncident: true }));
    await click("Ver y descargar etiqueta PDF");
    expect(client.get).toHaveBeenCalledWith("/branches/12/vehicles/42/label.pdf", expect.objectContaining({ responseType: "blob" }));
    await click("Datos generales");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fixture");
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test("rejects unrecognized data and mismatched IDs", () => {
  expect(() => readVehiclePage({ unexpected: [] })).toThrow();
  expect(() => readVehicle({ data: vehicle }, 43)).toThrow();
  expect(() => vehicleDocumentPath(12, 42, "rotate-qr")).toThrow();
});

test("loads history independently and recognizes an empty collection", async () => {
  client.get.mockResolvedValueOnce({ data: { data: vehicle } })
    .mockResolvedValueOnce({ data: { data: { vehicle_id: 42, orders: { data: [] }, bookings: { data: [] } } } });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  await click("Historial");
  expect(host.textContent).toContain("Sin atenciones");
  expect(client.get).toHaveBeenCalledWith("/vehicles/42/history", expect.objectContaining({ params: { orders_page: 1, bookings_page: 1 } }));
});

test("shows document authorization errors without rendering a QR", async () => {
  client.get.mockResolvedValueOnce({ data: { data: vehicle } })
    .mockRejectedValueOnce({ response: { status: 403 } });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  await click("Identificación");
  expect(host.textContent).toContain("No tienes acceso a esta operación vehicular");
  expect(host.querySelector('img[alt="Código QR del vehículo"]')).toBeNull();
});

const readable = { canRead: true, canWrite: true, canManageStatus: true, canReadCatalog: true, branch: { id: 12 }, storeId: 1 };
const api = (fixtures = {}) => {
  const responses = {
    "/vehicles": { data: [vehicle], last_page: 1 },
    "/vehicles/42": { data: { ...vehicle, is_active: true, plates: "ACT-42", latest_mileage: 0 } },
    "/clientes/simple": { data: [{ id: 7, nombre_alias: "Cliente ficticio" }] },
    "/vehicle-brands": { data: [{ id: 3, name: "Marca ficticia" }] },
    "/vehicle-models": { data: [{ id: 8, vehicle_brand_id: 3, name: "Modelo ficticio" }, { id: 9, vehicle_brand_id: 4, name: "Modelo ajeno" }] },
    ...fixtures,
  };
  client.get.mockImplementation((path) => Promise.resolve({ data: responses[path] }));
};

test("searches by plates, VIN and selected customer without branch filters", async () => {
  api();
  useVehicleRecordsAccess.mockReturnValue(readable);
  await act(async () => root.render(tree("/admin/services/vehicles")));
  await click("Mostrar filtros");
  await change("Buscar por placas", "ABC-1");
  await change("Buscar por VIN", "1HG");
  await select("Cliente", "Cliente ficticio");
  await click("Buscar");
  expect(client.get).toHaveBeenLastCalledWith("/vehicles", expect.objectContaining({ params: { page: 1, plates: "ABC-1", vin: "1HG", customer_id: 7 } }));
});

test("registers a vehicle with dependent selections and retains the draft after duplicate identifiers", async () => {
  api();
  useVehicleRecordsAccess.mockReturnValue(readable);
  client.post.mockRejectedValueOnce({ response: { status: 422, data: { errors: { vin: ["VIN duplicado"], plates: ["Placas duplicadas"] } } } })
    .mockResolvedValueOnce({ data: { data: vehicle } });
  await act(async () => root.render(tree("/admin/services/vehicles/new")));
  await select("Cliente", "Cliente ficticio");
  await select("Marca", "Marca ficticia");
  expect(client.get).toHaveBeenCalledWith("/vehicle-models", expect.objectContaining({ params: { brand_id: "3" } }));
  await select("Modelo", "Modelo ficticio");
  await change("Placas", "ABC-1");
  await change("VIN", "VIN-01");
  await change("Kilometraje (km)", "0");
  await act(async () => {
    const form = host.querySelector("form");
    Simulate.submit(form);
    Simulate.submit(form);
  });
  expect(client.post).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain("VIN duplicado");
  expect(host.textContent).toContain("Placas duplicadas");
  expect(input("VIN").value).toBe("VIN-01");
  await click("Guardar expediente");
  expect(client.post).toHaveBeenLastCalledWith("/vehicles", {
    customer_id: 7, vehicle_brand_id: 3, vehicle_model_id: 8, year: null, plates: "ABC-1", vin: "VIN-01", latest_mileage: 0,
  }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(host.textContent).toContain("Expediente #42");
});

test("edits a vehicle without the catalog and clears mileage without changing its relations", async () => {
  api();
  useVehicleRecordsAccess.mockReturnValue({ ...readable, canReadCatalog: false });
  client.patch.mockResolvedValue({ data: { data: vehicle } });
  await act(async () => root.render(tree("/admin/services/vehicles/42/edit")));
  expect(input("Kilometraje (km)").value).toBe("0");
  await change("Kilometraje (km)", "");
  await click("Guardar expediente");
  expect(client.patch).toHaveBeenCalledWith("/vehicles/42", { latest_mileage: null }, expect.any(Object));
  expect(client.get.mock.calls.some(([path]) => path === "/vehicle-brands")).toBe(false);
});

test("uses the status endpoint for deactivation", async () => {
  api();
  useVehicleRecordsAccess.mockReturnValue(readable);
  showConfirm.mockResolvedValue(true);
  client.patch.mockResolvedValue({});
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  await click("Desactivar vehículo");
  expect(client.patch).toHaveBeenCalledWith("/vehicles/42/status", { is_active: false }, expect.any(Object));
  expect(host.textContent).toContain("Inactivo");
});

test("displays historical snapshots and zero mileage instead of current data", async () => {
  api({ "/vehicles/42/history": { data: { vehicle_id: 42, orders: { data: [{
    id: 52, visit_mileage: 0, vehicle_snapshot: { plates: "ANTES-12", brand: "Marca histórica" },
    customer_snapshot: { name: "Cliente anterior" }, form_submissions: [{ id: 61, folio: "SF-61", status: "completed" }],
  }] }, bookings: { data: [{ id: 31, booking_code: "BK-31" }] } } } });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  await click("Historial");
  expect(host.textContent).toContain("ANTES-12");
  expect(host.textContent).not.toContain("ACT-42");
  expect(host.textContent).toContain("0 km");
  expect(host.textContent).toContain("SF-61");
  expect(host.textContent).toContain("BK-31");
});

test("links historical inspections to the order's branch only when forms are readable", async () => {
  api({ "/vehicles/42/history": { data: { vehicle_id: 42, orders: { data: [{
    id: 52, branch: { id: 15, name: "Sucursal 15" }, form_submissions: [{ id: 61, folio: "SF-61", status: "completed" }],
  }] }, bookings: { data: [] } } } });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  await click("Historial");
  expect(host.textContent).not.toContain("Ver captura histórica");
  useDynamicFormsAccess.mockReturnValue({ read: true, branch: { id: 12 } });
  await act(async () => root.render(tree("/admin/services/vehicles/42")));
  expect([...host.querySelectorAll("a")].find((node) => node.textContent === "Ver captura histórica").getAttribute("href"))
    .toBe("/admin/services/orders/52/forms/61?branch_id=15&history=1");
});

test("resolves a private QR in its branch and opens a separately authorized detail", async () => {
  api();
  client.post.mockResolvedValue({ data: { data: { vehicle_id: 42, is_active: true } } });
  await act(async () => root.render(tree("/admin/services/vehicles/resolve")));
  await change("Código QR escaneado", "inválido");
  await click("Buscar expediente");
  expect(client.post).not.toHaveBeenCalled();
  const code = `MTELMX:VEHICLE:V1:${"a".repeat(48)}`;
  await change("Código QR escaneado", code);
  await click("Buscar expediente");
  expect(client.post).toHaveBeenCalledWith("/branches/12/vehicles/resolve-qr", { code }, expect.objectContaining({ __skipSupportIncident: true }));
  expect(client.get).toHaveBeenCalledWith("/vehicles/42", expect.any(Object));
  expect(host.textContent).not.toContain(code);
});

test("requires confirmation and refreshes the QR after one authorized rotation", async () => {
  const createUrl = URL.createObjectURL;
  const revokeUrl = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn().mockReturnValue("blob:fixture");
  URL.revokeObjectURL = jest.fn();
  try {
    api({ "/branches/12/vehicles/42/qr.svg": new Blob(["<svg/>"], { type: "image/svg+xml" }) });
    useVehicleRecordsAccess.mockReturnValue(readable);
    showConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    client.post.mockResolvedValue({ data: { data: { vehicle_id: 42, regenerated: true } } });
    await act(async () => root.render(tree("/admin/services/vehicles/42")));
    await click("Identificación");
    await click("Regenerar QR");
    expect(client.post).not.toHaveBeenCalled();
    await click("Regenerar QR");
    expect(showConfirm).toHaveBeenLastCalledWith(expect.stringContaining("anterior dejará de funcionar"), "Regenerar código");
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledWith("/branches/12/vehicles/42/rotate-qr", undefined, expect.any(Object));
    expect(client.get.mock.calls.filter(([path]) => path.endsWith("qr.svg"))).toHaveLength(2);
    expect(host.textContent).toContain("Código regenerado");
    await click("Datos generales");
  } finally {
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revokeUrl;
  }
});

test("validates documented label size and distinguishes unknown from zero mileage", () => {
  expect(vehicleDocumentPath(12, 42, "label.pdf", { width_mm: 60, height_mm: 40 })).toMatch(/width_mm=60&height_mm=40$/);
  expect(() => vehicleDocumentPath(12, 42, "label.pdf", { width_mm: 34, height_mm: 40 })).toThrow();
  expect(prepareVehicleWrite(vehicleDraft({ ...vehicle, latest_mileage: 0 })).values.latest_mileage).toBe(0);
  expect(prepareVehicleWrite(vehicleDraft(vehicle)).values.latest_mileage).toBeNull();
});

test("blocks direct editing without the write permission and creation without catalog permission", async () => {
  useVehicleRecordsAccess.mockReturnValue({ ...readable, canWrite: false });
  await act(async () => root.render(tree("/admin/services/vehicles/42/edit")));
  expect(host.textContent).toContain("No tienes permiso de escritura");
  expect(client.get).not.toHaveBeenCalled();
  await act(async () => root.render(null));
  useVehicleRecordsAccess.mockReturnValue({ ...readable, canReadCatalog: false });
  await act(async () => root.render(tree("/admin/services/vehicles/new")));
  expect(host.textContent).toContain("El alta requiere acceso al catálogo");
  expect(client.get).not.toHaveBeenCalled();
});

test("registers a minimal administrative customer and selects it in the vehicle form", async () => {
  api();
  useVehicleRecordsAccess.mockReturnValue(readable);
  client.post.mockResolvedValue({ data: { ok: true, cliente: { id: 12, nombre_alias: "Cliente nuevo" } } });
  await act(async () => root.render(tree("/admin/services/vehicles/new")));
  await click("Registrar cliente");
  await change("Nombre del cliente", "Cliente nuevo");
  await change("Teléfono del cliente", "5550000123");
  await click("Guardar cliente");
  expect(client.post).toHaveBeenCalledWith("/clientes/quick-store", { nombre_alias: "Cliente nuevo", telefono: "5550000123" }, expect.any(Object));
  expect(input("Cliente").value).toBe("Cliente nuevo");
});

test("suppresses navigation when a QR resolution from the previous context returns late", async () => {
  let finish;
  client.post.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  await act(async () => root.render(tree("/admin/services/vehicles/resolve")));
  await change("Código QR escaneado", `MTELMX:VEHICLE:V1:${"a".repeat(48)}`);
  await click("Buscar expediente");
  const signal = client.post.mock.calls[0][2].signal;
  useVehicleRecordsAccess.mockReturnValue({ ...readable, branch: { id: 19 }, storeId: 2 });
  await act(async () => root.render(tree("/admin/services/vehicles/resolve")));
  await act(async () => finish({ data: { data: { vehicle_id: 42, is_active: true } } }));
  expect(signal.aborted).toBe(true);
  expect(client.get).not.toHaveBeenCalled();
});

test("rejects an invalid label dimension and requests the selected PDF size", async () => {
  const createUrl = URL.createObjectURL;
  const revokeUrl = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn().mockReturnValue("blob:fixture");
  URL.revokeObjectURL = jest.fn();
  try {
    api({
      "/branches/12/vehicles/42/qr.svg": new Blob(["<svg/>"], { type: "image/svg+xml" }),
      "/branches/12/vehicles/42/label.pdf?width_mm=60&height_mm=40": new Blob(["%PDF"], { type: "application/pdf" }),
    });
    await act(async () => root.render(tree("/admin/services/vehicles/42")));
    await click("Identificación");
    await change("Ancho (mm)", "34");
    await click("Ver y descargar etiqueta PDF");
    expect(host.textContent).toContain("35–100");
    await change("Ancho (mm)", "60");
    await change("Alto (mm)", "40");
    await click("Ver y descargar etiqueta PDF");
    expect(client.get).toHaveBeenLastCalledWith("/branches/12/vehicles/42/label.pdf?width_mm=60&height_mm=40", expect.objectContaining({ responseType: "blob" }));
    await click("Datos generales");
  } finally {
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revokeUrl;
  }
});
