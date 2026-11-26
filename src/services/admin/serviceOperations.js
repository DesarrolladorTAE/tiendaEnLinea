import client from "../../config/axiosClient";

export const operationRoot = "/admin/services";
export const operationUrl = (page, branch) => `${operationRoot}/${page}?branch_id=${branch}`;
const scope = (branch, entity, id) => `/branches/${branch}/${entity}${id == null ? "" : `/${id}`}`;
const config = (signal, params) => ({ signal, params, __skipSupportIncident: true });
const read = (path, signal, params) => client.get(path, config(signal, params)).then(({ data }) => data);
const write = (method, path, body, signal) => client[method](path, body, config(signal)).then(({ data }) => data.data);
const booking = (branch, id) => scope(branch, "bookings", id);
const order = (branch, id) => scope(branch, "service-orders", id);
export const orderPdf = (branch, id) => `${order(branch, id)}/document.pdf`;

export const operations = {
  list: (branch, entity, params, signal) => read(scope(branch, entity), signal, params),
  booking: (branch, id, signal) => read(booking(branch, id), signal),
  order: (branch, id, signal) => read(order(branch, id), signal),
  createBooking: (branch, body, signal) => write("post", booking(branch), body, signal),
  createOrder: (branch, body, signal) => write("post", order(branch), body, signal),
  nextBooking: (branch, id, body, signal) => write("post", `${order(branch, id)}/next-booking`, body, signal),
  confirm: (branch, id, signal) => write("post", `${booking(branch, id)}/confirm`, undefined, signal),
  arrival: (branch, id, signal) => write("post", `${booking(branch, id)}/arrival`, undefined, signal),
  convert: (branch, id, signal) => write("post", `${booking(branch, id)}/service-order`, undefined, signal),
  start: (branch, id, signal) => write("post", `${order(branch, id)}/start`, undefined, signal),
  complete: (branch, id, signal) => write("post", `${order(branch, id)}/complete`, undefined, signal),
  cancelOrder: (branch, id, reason, signal) => write("post", `${order(branch, id)}/cancel`, { reason }, signal),
  editOrder: (branch, id, body, signal) => write("patch", order(branch, id), body, signal),
  resource: (branch, id, resource_id, signal) => write("patch", `${order(branch, id)}/resource`, { resource_id }, signal),
  sale: (branch, id, sale_id, signal) => write("post", `${order(branch, id)}/sale`, { sale_id }, signal),
  mileage: (vehicle, id, visit_mileage, signal) => write("patch", `/vehicles/${vehicle}/service-orders/${id}/mileage`, { visit_mileage }, signal),
  thermal: (branch, id, paper_size, signal) => read(`${order(branch, id)}/thermal`, signal, { paper_size }),
};

export const statusLabels = {
  pending: "Pendiente", confirmed: "Confirmada", arrived: "En recepción",
  in_progress: "En proceso", completed: "Finalizado", cancelled: "Cancelado",
};

export function bookingActions(status) {
  return {
    confirm: status === "pending",
    arrival: status === "confirmed",
    convert: ["confirmed", "arrived"].includes(status),
  };
}

export function orderActions(status) {
  return {
    start: status === "pending",
    complete: status === "in_progress",
    edit: ["pending", "in_progress"].includes(status),
  };
}

export function operationError(error) {
  const status = error.response?.status;
  if (status === 401) return "Inicia sesión para continuar.";
  if (status === 403) return "No tienes acceso a esta operación en la sucursal.";
  if (status === 404) return "El registro no está disponible en esta sucursal.";
  const body = error.response?.data;
  const fields = Object.values(body?.errors ?? {}).flat().join(" ");
  return fields || body?.message || error.message || "No se pudo completar la operación.";
}

export async function readOperationPeriod(branch, params, signal) {
  const rows = new Map();
  for (let page = 1; ; page += 1) {
    if (signal.aborted) throw new DOMException("Consulta cancelada.", "AbortError");
    const result = await operations.list(branch, "bookings", { ...params, per_page: 100, page }, signal);
    if (!Array.isArray(result.data) || result.current_page !== page || !Number.isSafeInteger(result.last_page) || result.last_page < page) {
      throw new Error("No se pudo comprobar la paginación del periodo.");
    }
    result.data.forEach((row) => rows.set(row.id, row));
    if (page === result.last_page) {
      if (rows.size !== result.total) throw new Error("El periodo cambió mientras se cargaba. Vuelve a consultarlo.");
      return [...rows.values()];
    }
  }
}

