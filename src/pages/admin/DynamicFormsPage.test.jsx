import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { readFileSync } from "fs";
import DynamicFormsPage from "./DynamicFormsPage";
import useDynamicFormsAccess from "../../hooks/useDynamicFormsAccess";
import client from "../../config/axiosClient";
import { showConfirm } from "../../utils/alerts";
import { answerIssue, inspectionProgress, moveRow, validateSchema } from "../../components/services/formSchema";

jest.mock("../../hooks/useDynamicFormsAccess", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

const document32 = readFileSync("docs/frontend-integration/32-fixtures-formularios-dinamicos.md", "utf8");
const inspection = JSON.parse(document32.split("## Fixture JSON completo del schema de inspección")[1].split("```json")[1].split("```")[0]);
const field = { id: "result", label: "Resultado guardado", type: "short_text", required: true, sort_order: 1 };
const schema = { title: "Recepción histórica", sections: [{ id: "general", title: "General", sort_order: 1, fields: [field] }] };
const template = { id: 7, key: "recepcion", name: "Recepción", is_active: true, version: 2, schema };
const capture = { id: 901, service_order_id: 501, service_form_template_id: 7, template_version: 1, folio: "SF-901",
  status: "draft", schema_snapshot: schema, answers: {}, context_snapshot: { customer: { name: "Cliente anterior" }, vehicle: { plates: "ANT-7" }, visit_mileage: 0 } };
const context = { read: true, configure: true, capture: true, branch: { id: 12, name: "Centro" }, storeId: 3 };
const ok = (value) => ({ data: { data: value } });
let root;
let host;
const click = (label) => act(async () => [...host.querySelectorAll("button")].find((node) => node.textContent === label).click());
const change = (label, value) => act(async () => {
  const node = [...host.querySelectorAll("label")].find((item) => item.textContent.replace(/\s*\*$/, "") === label);
  const element = document.getElementById(node.htmlFor);
  element.value = value;
  Simulate.change(element);
});
const tree = (path) => <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes>
    <Route path="/admin/services/forms" element={<DynamicFormsPage />} />
    <Route path="/admin/services/forms/new" element={<DynamicFormsPage mode="new" />} />
    <Route path="/admin/services/forms/:templateId" element={<DynamicFormsPage />} />
    <Route path="/admin/services/forms/:templateId/edit" element={<DynamicFormsPage mode="edit" />} />
    <Route path="/admin/services/orders/:orderId/forms" element={<DynamicFormsPage />} />
    <Route path="/admin/services/orders/:orderId/forms/:submissionId" element={<DynamicFormsPage />} />
  </Routes>
</MemoryRouter>;
const mount = (path) => act(async () => root.render(tree(path)));
const captureUrl = "/admin/services/orders/501/forms/901";
const captureApi = "/service-orders/501/forms/901";
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  useDynamicFormsAccess.mockReturnValue(context);
  showConfirm.mockResolvedValue(true);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("blocks direct edit without configure and avoids requests", async () => {
  useDynamicFormsAccess.mockReturnValue({ ...context, configure: false });
  await mount("/admin/services/forms/7/edit");
  expect(host.textContent).toContain("No tienes permiso");
  expect(client.get).not.toHaveBeenCalled();
});

test("paginates and searches by name/key using Laravel parameters", async () => {
  client.get.mockResolvedValue({ data: { data: [template], last_page: 2 } });
  await mount("/admin/services/forms");
  await click("2");
  await change("Buscar por nombre o clave", "recepcion");
  await click("Buscar");
  expect(client.get.mock.calls.map(([, options]) => options.params)).toEqual([{ page: 1 }, { page: 2 }, { search: "recepcion", page: 1 }]);
});

test("creates a generic template with a stable field ID and a local preview", async () => {
  client.post.mockResolvedValue(ok(template));
  client.get.mockResolvedValue(ok(template));
  await mount("/admin/services/forms/new");
  await change("Nombre de la plantilla", "Recepción");
  await change("Clave", "recepcion");
  await change("Título del formulario", "Recepción de equipo");
  await change("Título de sección", "General");
  await change("Pregunta", "Hallazgos");
  await click("Vista previa");
  expect(host.textContent).toContain("Las respuestas de esta vista no se guardan.");
  expect(client.post).not.toHaveBeenCalled();
  await click("Guardar plantilla");
  expect(client.post).toHaveBeenCalledWith("/service-form-templates", expect.objectContaining({ key: "recepcion", schema: expect.objectContaining({
    sections: [expect.objectContaining({ fields: [expect.objectContaining({ id: "field_2", label: "Hallazgos" })] })],
  }) }), expect.any(Object));
});

test("metadata edit omits schema, while a schema edit confirms a new version", async () => {
  client.get.mockResolvedValue(ok(template));
  client.patch.mockResolvedValue(ok(template));
  await mount("/admin/services/forms/7/edit");
  await change("Nombre de la plantilla", "Recepción técnica");
  await click("Guardar plantilla");
  expect(client.patch).toHaveBeenLastCalledWith("/service-form-templates/7", { name: "Recepción técnica", description: null }, expect.any(Object));
  expect(showConfirm).not.toHaveBeenCalled();
  await act(async () => root.render(null));
  await mount("/admin/services/forms/7/edit");
  await change("Pregunta", "Resultado nuevo");
  await click("Guardar plantilla");
  expect(showConfirm).toHaveBeenCalledWith(expect.stringContaining("incrementará la versión"), "Guardar versión");
  expect(client.patch.mock.calls.at(-1)[1].schema.sections[0].fields[0]).toMatchObject({ id: field.id, label: "Resultado nuevo" });
});

test("installs the inspection by endpoint and reads its returned scheme", async () => {
  client.get.mockResolvedValueOnce({ data: { data: [], last_page: 1 } }).mockResolvedValueOnce(ok({ ...template, schema: inspection }));
  client.post.mockResolvedValue(ok({ ...template, schema: inspection }));
  await mount("/admin/services/forms");
  await click("Instalar inspección de 25 puntos");
  expect(client.post).toHaveBeenCalledWith("/service-form-templates/install/vehicle-inspection-25", undefined, expect.any(Object));
  await click("Vista previa");
  expect(host.textContent).toContain("0 de 25 puntos contestados");
  expect(host.querySelector('button[aria-pressed="true"]')).toBeNull();
});

test("starts an assigned draft once and can recover the snapshot", async () => {
  let resolve;
  client.get.mockResolvedValueOnce(ok({ order_id: 501, forms: [{ template_id: 7, required: true }], submissions: [] }))
    .mockResolvedValueOnce(ok(capture));
  client.post.mockImplementationOnce(() => new Promise((callback) => { resolve = callback; }));
  await mount("/admin/services/orders/501/forms");
  await act(async () => {
    const button = [...host.querySelectorAll("button")].find((item) => item.textContent === "Iniciar captura");
    button.click(); button.click();
  });
  expect(client.post).toHaveBeenCalledTimes(1);
  await act(async () => resolve(ok(capture)));
  expect(client.post).toHaveBeenCalledWith("/service-orders/501/forms", { template_id: 7 }, expect.any(Object));
  expect(client.get).toHaveBeenLastCalledWith(captureApi, expect.any(Object));
  expect(host.textContent).toContain("Recepción histórica");
});

test("keeps draft answers after a 422 and completes only after saving dirty answers", async () => {
  client.get.mockResolvedValue(ok(capture));
  client.patch.mockRejectedValueOnce({ response: { status: 422, data: { errors: { "answers.result": ["Corrige la respuesta"] } } } })
    .mockResolvedValueOnce(ok({ ...capture, answers: { result: "Hallazgo" } }));
  client.post.mockResolvedValue(ok({ ...capture, status: "completed", answers: { result: "Hallazgo" } }));
  await mount(captureUrl);
  await click("Completar captura");
  expect(host.textContent).toContain("Esta respuesta es obligatoria.");
  expect(client.post).not.toHaveBeenCalled();
  await change("Resultado guardado", "Hallazgo");
  await click("Guardar borrador");
  expect(host.textContent).toContain("Corrige la respuesta");
  expect(host.textContent).toContain("Hay cambios sin guardar.");
  await click("Completar captura");
  expect(client.patch).toHaveBeenLastCalledWith(captureApi, { answers: { result: "Hallazgo" } }, expect.any(Object));
  expect(client.post).toHaveBeenCalledWith(captureApi + "/complete", undefined, expect.any(Object));
  expect(host.textContent).toContain("Captura completada.");
  expect(host.textContent).not.toContain("Guardar borrador");
});

test("uses snapshot, historical context and version and prevents edits from history", async () => {
  client.get.mockResolvedValue(ok({ ...capture, status: "completed", answers: { result: "Dato conservado" } }));
  await mount(captureUrl + "?history=1");
  expect(host.textContent).toContain("Cliente anterior");
  expect(host.textContent).toContain("0 km");
  expect(host.textContent).toContain("Dato conservado");
  expect(host.textContent).toContain("Versión 1");
  expect(host.textContent).not.toContain("Cancelar captura");
  expect(client.get).toHaveBeenCalledTimes(1);
});

test("requires a reason to cancel and writes the authorized transition", async () => {
  client.get.mockResolvedValue(ok({ ...capture, status: "completed" }));
  client.post.mockResolvedValue(ok({ ...capture, status: "cancelled", cancellation_reason: "Motivo válido" }));
  await mount(captureUrl);
  await click("Cancelar captura");
  await click("Confirmar cancelación");
  expect(client.post).not.toHaveBeenCalled();
  await change("Motivo de cancelación", "Motivo válido");
  await click("Confirmar cancelación");
  expect(client.post).toHaveBeenCalledWith(captureApi + "/cancel", { reason: "Motivo válido" }, expect.any(Object));
  expect(host.textContent).toContain("Captura cancelada.");
});

test("loads the private PDF under the branch and revokes its URL at unmount", async () => {
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn().mockReturnValue("blob:fixture");
  URL.revokeObjectURL = jest.fn();
  try {
    client.get.mockResolvedValueOnce(ok(capture)).mockResolvedValueOnce({ data: new Blob(["%PDF"], { type: "application/pdf" }) });
    await mount(captureUrl);
    await click("Vista previa y descarga PDF");
    expect(client.get).toHaveBeenLastCalledWith("/branches/12/service-orders/501/forms/901/document.pdf", expect.objectContaining({ responseType: "blob", __skipSupportIncident: true }));
    await act(async () => root.render(null));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fixture");
  } finally {
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
  }
});

test("discards an obsolete order response after changing branch and store", async () => {
  let resolve;
  client.get.mockImplementationOnce(() => new Promise((callback) => { resolve = callback; }))
    .mockResolvedValueOnce(ok({ ...capture, context_snapshot: { customer: { name: "Cliente vigente" } } }));
  await mount(captureUrl);
  const signal = client.get.mock.calls[0][1].signal;
  useDynamicFormsAccess.mockReturnValue({ ...context, storeId: 4, branch: { id: 19 } });
  await mount(captureUrl);
  await act(async () => resolve(ok(capture)));
  expect(signal.aborted).toBe(true);
  expect(host.textContent).toContain("Cliente vigente");
  expect(host.textContent).not.toContain("Cliente anterior");
});

test("shows Laravel authorization failures without exposing capture actions", async () => {
  client.get.mockRejectedValue({ response: { status: 403, data: { message: "Acceso denegado por Laravel" } } });
  await mount(captureUrl);
  expect(host.textContent).toContain("Acceso denegado por Laravel");
  expect(host.textContent).not.toContain("Completar captura");
});

test("read access without capture permission renders a draft without write actions", async () => {
  useDynamicFormsAccess.mockReturnValue({ ...context, capture: false });
  client.get.mockResolvedValue(ok({ ...capture, answers: { result: "Lectura de borrador" } }));
  await mount(captureUrl);
  expect(host.textContent).toContain("Lectura de borrador");
  expect(host.textContent).not.toContain("Guardar borrador");
  expect(host.textContent).not.toContain("Cancelar captura");
});

test("distinguishes a private PDF denial returned as a JSON blob from a document", async () => {
  client.get.mockResolvedValueOnce(ok(capture)).mockRejectedValueOnce({ response: {
    status: 403, data: new Blob(['{"message":"Denegado"}'], { type: "application/json" }),
  } });
  await mount(captureUrl);
  await click("Vista previa y descarga PDF");
  expect(document.body.textContent).toContain("No tienes permiso para consultar este documento.");
  expect(document.body.querySelector("iframe")).toBeNull();
});

test("validates documented inspection fixture and NR and reorders stable field IDs", async () => {
  expect(validateSchema(inspection)).toEqual({});
  const first = inspection.sections[0].fields[0];
  expect(answerIssue(first, { status: "nr", explanation: " " })).toContain("Explica");
  expect(inspectionProgress(inspection, { [first.id]: { status: "nr", explanation: "No aplica" } })).toMatchObject({ total: 25, answered: 1, counts: { nr: 1 } });
  const rows = moveRow(inspection.sections[0].fields, 0, 1);
  expect(rows[1]).toMatchObject({ id: first.id, sort_order: 2 });
});

test.each([
  ["short_text", "hola"], ["long_text", "nota"], ["integer", 0], ["decimal", 1.25], ["date", "2026-11-26"],
  ["time", "14:25"], ["single_select", "ok"], ["multi_select", ["ok"]], ["checkbox", false], ["boolean", true],
])("accepts a typed value for %s including explicit false and zero", (type, value) => {
  expect(answerIssue({ type, required: true, options: [{ value: "ok", label: "Bien" }] }, value, true)).toBe("");
});
