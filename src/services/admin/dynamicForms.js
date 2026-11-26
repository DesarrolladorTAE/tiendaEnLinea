import client from "../../config/axiosClient";

export const formsPath = "/admin/services/forms";
export const orderFormsPath = "/admin/services/orders";
const templates = "/service-form-templates";
const order = (id) => `/service-orders/${id}/forms`;
const submission = (id, formId) => `${order(id)}/${formId}`;
const config = (signal) => ({ signal, __skipSupportIncident: true });
export const formLink = (path, branch) => `${path}?branch_id=${encodeURIComponent(branch)}`;
export const positiveId = (id) => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

export const dynamicForms = {
  list: (params, signal) => client.get(templates, { ...config(signal), params }).then(({ data }) => {
    if (!Array.isArray(data?.data)) throw new Error("Listado de plantillas no reconocido.");
    return data;
  }),
  template: (id, signal) => client.get(`${templates}/${id}`, config(signal)).then(({ data }) => data.data),
  create: (body, signal) => client.post(templates, body, config(signal)).then(({ data }) => data.data),
  update: (id, body, signal) => client.patch(`${templates}/${id}`, body, config(signal)).then(({ data }) => data.data),
  status: (id, is_active, signal) => client.patch(`${templates}/${id}/status`, { is_active }, config(signal)).then(({ data }) => data.data),
  duplicate: (id, body, signal) => client.post(`${templates}/${id}/duplicate`, body, config(signal)).then(({ data }) => data.data),
  install: (signal) => client.post(`${templates}/install/vehicle-inspection-25`, undefined, config(signal)).then(({ data }) => data.data),
  assignments: (id, signal) => client.get(order(id), config(signal)).then(({ data }) => data.data),
  start: (id, template_id, signal) => client.post(order(id), { template_id }, config(signal)).then(({ data }) => data.data),
  submission: (id, formId, signal) => client.get(submission(id, formId), config(signal)).then(({ data }) => data.data),
  save: (id, formId, answers, signal) => client.patch(submission(id, formId), { answers }, config(signal)).then(({ data }) => data.data),
  complete: (id, formId, signal) => client.post(`${submission(id, formId)}/complete`, undefined, config(signal)).then(({ data }) => data.data),
  cancel: (id, formId, reason, signal) => client.post(`${submission(id, formId)}/cancel`, { reason }, config(signal)).then(({ data }) => data.data),
};

export const formPdfPath = (branch, id, formId) => `/branches/${branch}${submission(id, formId)}/document.pdf`;

export function formError(error) {
  const body = error.response?.data;
  return { text: body?.message || error.message || "No se pudo completar la operación.",
    fields: Object.fromEntries(Object.entries(body?.errors ?? {}).map(([key, value]) => [key, [value].flat().join(" ")])) };
}
