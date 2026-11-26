import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ServiceFormPage from "./ServiceFormPage";
import { serviceService } from "../../services/admin/serviceService";
import useServiceSetupModules from "../../hooks/useServiceSetupModules";

jest.mock("../../services/admin/serviceService", () => ({ serviceService: { get: jest.fn(), create: jest.fn(), update: jest.fn() } }));
jest.mock("../../hooks/useServiceSetupModules", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../utils/alerts", () => ({ showSuccess: jest.fn(), alertFromAxiosError: jest.fn() }));
jest.mock("../../components/tours/ServiceTourSection", () => () => <div>Configuración de tour existente</div>);
jest.mock("../../components/services/ServiceBookingConfig", () => ({ branchId, serviceId }) => <div>Agenda {branchId}/{serviceId}</div>);
jest.mock("../../components/services/ServiceResourceAssociations", () => () => null);
jest.mock("../../components/services/ServiceFormAssociations", () => () => null);
jest.mock("../../components/services/ServiceFormFields", () => ({
  ServiceGeneralStep: ({ form, setField }) => <input aria-label="Nombre" value={form.name} onChange={setField("name")} />,
  ServicePriceStep: ({ form, setField }) => <input aria-label="Precio" value={form.base_price} onChange={setField("base_price")} />,
  ServiceOperationStep: ({ form, setField, showVehicleRequirement }) => showVehicleRequirement &&
    <select aria-label="Requisito vehicular" value={form.vehicle_requirement} onChange={setField("vehicle_requirement")}>
      <option value="none">Ninguno</option><option value="optional">Opcional</option><option value="required">Requerido</option>
    </select>,
  ServiceBookingStep: ({ form, setChecked }) => <input type="checkbox" aria-label="Requiere reservación" checked={form.requires_booking} onChange={setChecked("requires_booking")} />,
  ServiceResourcesStep: () => null,
  ServiceFinalStep: () => null,
}));

let root;
let host;
let navigate;
const service = {
  id: 45, name: "Afinación", service_type: "repair", base_price: "850.00", requires_booking: true,
  config: { vehicle_requirement: "optional", forms: [{ template_id: 7, required: true, sort_order: 1 }] },
  images: [],
};
const adminGet = (record = service) => ({ data: { service: record, branch_config: null } });
const button = (label) => [...host.querySelectorAll("button")].find((node) => node.textContent.trim() === label);
const change = async (label, value) => act(async () => {
  const input = host.querySelector(`[aria-label="${label}"]`);
  if (input.type === "checkbox") input.checked = value;
  else input.value = value;
  Simulate.change(input);
});
const click = async (label) => act(async () => button(label).click());
const advance = async (times) => {
  for (let i = 0; i < times; i += 1) await click("Siguiente");
};
function Location() {
  navigate = useNavigate();
  const location = useLocation();
  return <output>{location.pathname}{location.search}</output>;
}
const mount = (entry) => act(async () => root.render(
  <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Location />
    <Routes>
      <Route path="/admin/services/new" element={<ServiceFormPage />} />
      <Route path="/admin/services/edit/:id" element={<ServiceFormPage />} />
      <Route path="/admin/services" element={<p>Lista</p>} />
    </Routes>
  </MemoryRouter>,
));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  useServiceSetupModules.mockReturnValue({ vehicleRecords: true, serviceForms: true });
  serviceService.get.mockResolvedValue(adminGet());
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("creates once and opens the persisted service ID on Agenda", async () => {
  serviceService.create.mockResolvedValue(adminGet());
  await mount("/admin/services/new?branch_id=12");
  await change("Nombre", "Afinación");
  await advance(1);
  await change("Precio", "850");
  await advance(1);
  await change("Requisito vehicular", "required");
  await advance(1);
  await change("Requiere reservación", true);
  await advance(2);
  await act(async () => {
    const submitter = button("Guardar y configurar agenda");
    const event = { nativeEvent: { submitter } };
    Simulate.submit(submitter.form, event);
    Simulate.submit(submitter.form, event);
  });
  expect(serviceService.create).toHaveBeenCalledTimes(1);
  expect(serviceService.create).toHaveBeenCalledWith(12, expect.objectContaining({ vehicle_requirement: "required" }));
  expect(host.querySelector("output").textContent).toBe("/admin/services/edit/45?branch_id=12&section=agenda");
  expect(host.textContent).toContain("Agenda 12/45");
});

test("loads the stored requirement, edits it to none and excludes config from the update", async () => {
  serviceService.update.mockResolvedValue(adminGet({ ...service, config: { ...service.config, vehicle_requirement: "none" } }));
  await mount("/admin/services/edit/45?branch_id=12");
  await advance(2);
  expect(host.querySelector('[aria-label="Requisito vehicular"]').value).toBe("optional");
  await change("Requisito vehicular", "none");
  await advance(3);
  await click("Guardar cambios");
  expect(serviceService.update).toHaveBeenCalledWith(12, "45", expect.objectContaining({ vehicle_requirement: "none" }));
  expect(serviceService.update.mock.calls[0][2]).not.toHaveProperty("config");
});

test("a traditional service saves with no automotive or forms capability", async () => {
  useServiceSetupModules.mockReturnValue({});
  serviceService.update.mockResolvedValue(adminGet({ ...service, service_type: "general", config: null }));
  serviceService.get.mockResolvedValue(adminGet({ ...service, service_type: "general", config: null }));
  await mount("/admin/services/edit/45?branch_id=12");
  await advance(2);
  expect(host.querySelector('[aria-label="Requisito vehicular"]')).toBeNull();
  expect(button("Formularios")).toBeUndefined();
  await advance(3);
  await click("Guardar cambios");
  expect(serviceService.update.mock.calls[0][2].vehicle_requirement).toBeUndefined();
});

test("cancels the previous branch read and only displays data for the current branch", async () => {
  let resolvePrevious;
  serviceService.get.mockImplementation((branchId) => branchId === 12 ?
    new Promise((resolve) => { resolvePrevious = resolve; }) :
    Promise.resolve(adminGet({ ...service, name: "Sucursal 18" })));
  await mount("/admin/services/edit/45?branch_id=12");
  const previousSignal = serviceService.get.mock.calls[0][2];
  await act(async () => navigate("/admin/services/edit/45?branch_id=18"));
  expect(previousSignal.aborted).toBe(true);
  await act(async () => resolvePrevious(adminGet({ ...service, name: "Sucursal 12" })));
  expect(host.querySelector('[aria-label="Nombre"]').value).toBe("Sucursal 18");
});
