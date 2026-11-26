import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ServiceBookingConfig from "./ServiceBookingConfig";
import ServiceFormAssociations from "./ServiceFormAssociations";
import ServiceResourceAssociations from "./ServiceResourceAssociations";
import ResourceScheduleDialog from "../resources/ResourceScheduleDialog";
import { serviceService } from "../../services/admin/serviceService";
import { resourceService } from "../../services/admin/resourceService";
import { showConfirm } from "../../utils/alerts";

jest.mock("../../services/admin/serviceService", () => ({ serviceService: {
  getBookingConfig: jest.fn(), saveBookingConfig: jest.fn(), availability: jest.fn(),
  getForms: jest.fn(), listFormTemplates: jest.fn(), saveForms: jest.fn(),
  getResources: jest.fn(), associateResource: jest.fn(), updateResource: jest.fn(), removeResource: jest.fn(),
} }));
jest.mock("../../services/admin/resourceService", () => ({ resourceService: { list: jest.fn(), getSchedule: jest.fn(), saveSchedule: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

let host;
let root;
const render = async (component) => act(async () => root.render(component));
const button = (text) => [...host.querySelectorAll("button")].find((node) => node.textContent.trim() === text);
const click = async (text) => act(async () => button(text).click());
const labelledInput = (label) => {
  const node = [...host.querySelectorAll("label")].find((item) => item.textContent.trim() === label);
  return document.getElementById(node.htmlFor);
};
const change = async (node, value) => act(async () => { node.value = value; Simulate.change(node); });

const booking = {
  id: 8, is_active: true, duration_minutes: 60, slot_interval_minutes: 30,
  capacity_per_slot: 2, capacity_per_day: 12, min_advance_minutes: 60,
  max_advance_days: 30, requires_confirmation: false, config: { buffer_minutes: 10 },
  weekly_schedules: [{ id: 1, weekday: 1, is_enabled: true, start_time: "09:00:00", end_time: "18:00:00" }],
  schedule_exceptions: [],
};
const template = { id: 7, name: "Inspección 25 puntos", is_active: true, version: 3 };
const nextTemplate = { id: 11, name: "Recepción", is_active: true, version: 2 };
const originalForms = [{ template_id: 7, required: true, sort_order: 1 }];
const resource = { id: 7, type: "employee", name: "Técnico 7", is_active: true };
const apiError = (status, message) => ({ response: { status, data: { message } } });

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  serviceService.getBookingConfig.mockResolvedValue({ data: { data: booking } });
  serviceService.getResources.mockResolvedValue({ data: { resources: [] } });
  serviceService.getForms.mockResolvedValue({ data: { data: { forms: originalForms, templates: [template] } } });
  serviceService.listFormTemplates.mockResolvedValue({ data: { data: [template, nextTemplate], last_page: 1, current_page: 1 } });
  resourceService.list.mockResolvedValue({ data: { resources: { data: [resource], last_page: 1 } } });
});

afterEach(() => { act(() => root.unmount()); host.remove(); });

test("blocks agenda save after an initial 403 and shows empty availability without a fabricated cause", async () => {
  serviceService.getBookingConfig.mockRejectedValueOnce(apiError(403, "Agenda sin permiso"));
  serviceService.availability.mockResolvedValue({ data: { data: { timezone: "America/Mexico_City", slots: [] } } });
  await render(<ServiceBookingConfig branchId={12} serviceId={45} />);
  expect(host.textContent).toContain("Agenda sin permiso");
  expect(button("Guardar agenda")).toBeUndefined();
  await change(labelledInput("Fecha de consulta"), "2026-11-30");
  await click("Consultar");
  expect(host.textContent).toContain("Sin horarios disponibles");
  expect(host.textContent).toContain("America/Mexico_City");
  expect(serviceService.saveBookingConfig).not.toHaveBeenCalled();
});

test("detects changed server configuration before overwrite and retains the attempted draft", async () => {
  serviceService.getBookingConfig.mockResolvedValueOnce({ data: { data: booking } })
    .mockResolvedValueOnce({ data: { data: { ...booking, duration_minutes: 75 } } });
  await render(<ServiceBookingConfig branchId={12} serviceId={45} />);
  await change(labelledInput("Capacidad por horario"), "3");
  await click("Guardar agenda");
  expect(host.textContent).toContain("La configuración cambió");
  expect(labelledInput("Capacidad por horario").value).toBe("3");
  expect(serviceService.saveBookingConfig).not.toHaveBeenCalled();
});

test("locks double agenda submission and retries only agenda after a validation error", async () => {
  serviceService.saveBookingConfig.mockRejectedValueOnce({
    response: { status: 422, data: { message: "Inválido", errors: { duration_minutes: ["Revisa la duración"] } } },
  }).mockResolvedValueOnce({ data: { data: { ...booking, duration_minutes: 75 } } });
  await render(<ServiceBookingConfig branchId={12} serviceId={45} />);
  await change(labelledInput("Duración (minutos)"), "75");
  await act(async () => {
    const form = button("Guardar agenda").form;
    Simulate.submit(form);
    Simulate.submit(form);
  });
  expect(serviceService.saveBookingConfig).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain("Revisa la duración");
  await click("Guardar agenda");
  expect(serviceService.saveBookingConfig).toHaveBeenCalledTimes(2);
  expect(serviceService.saveBookingConfig.mock.calls[1][2].duration_minutes).toBe(75);
  expect(host.textContent).toContain("Cambios guardados.");
  expect(serviceService.saveForms).not.toHaveBeenCalled();
});

test("associates catalog resources, edits their duration, and desassociates without deleting a resource", async () => {
  showConfirm.mockResolvedValue(true);
  await render(<ServiceResourceAssociations branchId={12} serviceId={45} />);
  await click("Seleccionar");
  await change(labelledInput("Duración particular (minutos)"), "45");
  await click("Asociar recurso");
  expect(serviceService.associateResource).toHaveBeenCalledWith(12, 45, {
    resource_id: 7, duration_override: 45, price_override: null, is_active: true,
  });
  await change(labelledInput("Duración particular (minutos)"), "30");
  await click("Guardar asociación");
  expect(serviceService.updateResource).toHaveBeenCalledWith(12, 45, 7, expect.objectContaining({ duration_override: 30 }));
  await click("Desasociar");
  expect(serviceService.removeResource).toHaveBeenCalledWith(12, 45, 7);
  expect(host.textContent).toContain("Recurso desasociado.");
});

test("clears the last form association and allows adding another template", async () => {
  serviceService.saveForms.mockResolvedValueOnce({ data: { data: { service_id: 45, forms: [] } } })
    .mockResolvedValueOnce({ data: { data: { service_id: 45, forms: [
    { template_id: 11, required: false, sort_order: 1 },
  ] } } });
  await render(<ServiceFormAssociations branchId={12} serviceId={45} />);
  expect(host.textContent).toContain("Versión 3");
  await click("Quitar");
  await click("Guardar formularios");
  expect(serviceService.saveForms).toHaveBeenCalledWith(12, 45, []);
  expect(host.textContent).toContain("Sin formularios asociados.");
  await act(async () => host.querySelector('[aria-label="Agregar Recepción"]').click());
  await click("Guardar formularios");
  expect(serviceService.saveForms).toHaveBeenCalledWith(12, 45, [{ template_id: 11, required: false, sort_order: 1 }]);
});

test("loads another page of form templates without dropping the current associations", async () => {
  serviceService.listFormTemplates.mockResolvedValueOnce({ data: { data: [template], current_page: 1, last_page: 2 } })
    .mockResolvedValueOnce({ data: { data: [nextTemplate], current_page: 2, last_page: 2 } });
  await render(<ServiceFormAssociations branchId={12} serviceId={45} />);
  const page2 = [...host.querySelectorAll("button")].find((node) => node.textContent.trim() === "2");
  await act(async () => page2.click());
  expect(serviceService.listFormTemplates).toHaveBeenLastCalledWith({ page: 2, per_page: 20 }, expect.any(AbortSignal));
  expect(host.textContent).toContain("Inspección 25 puntos");
  expect(host.textContent).toContain("Recepción");
});

test("writes the complete resource schedule and allows clearing all its shifts", async () => {
  const snapshot = { data: { data: { resource_id: 7, weekly_schedules: booking.weekly_schedules } } };
  resourceService.getSchedule.mockResolvedValue(snapshot);
  resourceService.saveSchedule.mockResolvedValueOnce(snapshot)
    .mockResolvedValueOnce({ data: { data: { resource_id: 7, weekly_schedules: [] } } });
  await render(<ResourceScheduleDialog branchId={12} resource={resource} onClose={jest.fn()} />);
  const findButton = (label) => [...document.body.querySelectorAll("button")].find((node) => node.textContent.trim() === label);
  await act(async () => findButton("Guardar horario").click());
  expect(resourceService.saveSchedule).toHaveBeenCalledWith(12, 7, [{ weekday: 1, is_enabled: true, start_time: "09:00", end_time: "18:00" }]);
  await act(async () => findButton("Quitar").click());
  await act(async () => findButton("Guardar horario").click());
  expect(document.body.textContent).toContain("Sin horario propio");
  expect(resourceService.saveSchedule).toHaveBeenLastCalledWith(12, 7, []);
});
