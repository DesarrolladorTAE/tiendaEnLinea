import client from "../../config/axiosClient";

export const validVehicleId = (id) => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
export const vehicleRecordsPath = "/admin/services/vehicles";

export function vehicleRecordsUrl(branchId, suffix = "") {
  return `${vehicleRecordsPath}${suffix}?branch_id=${encodeURIComponent(branchId)}`;
}

export function vehicleDocumentPath(branchId, vehicleId, file, size) {
  if (!validVehicleId(branchId) || !validVehicleId(vehicleId) || !["qr.svg", "label.pdf"].includes(file)) {
    throw new Error("Identificación vehicular inválida.");
  }
  const path = `/branches/${branchId}/vehicles/${vehicleId}/${file}`;
  if (!size) return path;
  const { width_mm, height_mm } = size;
  if (file !== "label.pdf" || !integerRange(width_mm, 35, 100) || !integerRange(height_mm, 25, 80)) {
    throw new Error("Selecciona dimensiones válidas para la etiqueta.");
  }
  return `${path}?width_mm=${width_mm}&height_mm=${height_mm}`;
}

export const integerRange = (value, min, max) => /^\d+$/.test(String(value)) && Number(value) >= min && Number(value) <= max;
export const qrCodePattern = /^MTELMX:VEHICLE:V1:[A-Za-z0-9]{48}$/;
const privateConfig = { __skipSupportIncident: true };

export const vehicleRecords = {
  list: (page, signal, filters = {}) => client.get("/vehicles", { params: { page, ...filters }, signal, ...privateConfig }),
  get: (id, signal) => client.get(`/vehicles/${id}`, { signal, __skipSupportIncident: true }),
  forCustomer: (id, page, signal) => client.get(`/clients/${id}/vehicles`, { params: { page }, signal, __skipSupportIncident: true }),
  history: (id, params, signal) => client.get(`/vehicles/${id}/history`, { params, signal, ...privateConfig }),
  customers: (signal) => client.get("/clientes/simple", { signal, ...privateConfig }),
  createCustomer: (values, signal) => client.post("/clientes/quick-store", values, { signal, ...privateConfig }),
  brands: (signal) => client.get("/vehicle-brands", { signal, ...privateConfig }),
  models: (brandId, signal) => client.get("/vehicle-models", { params: { brand_id: brandId }, signal, ...privateConfig }),
  create: (values, signal) => client.post("/vehicles", values, { signal, ...privateConfig }),
  update: (id, values, signal) => client.patch(`/vehicles/${id}`, values, { signal, ...privateConfig }),
  status: (id, is_active, signal) => client.patch(`/vehicles/${id}/status`, { is_active }, { signal, ...privateConfig }),
  rotate: (branchId, id, signal) => client.post(`/branches/${branchId}/vehicles/${id}/rotate-qr`, undefined, { signal, ...privateConfig }),
  resolve: (branchId, code, signal) => client.post(`/branches/${branchId}/vehicles/resolve-qr`, { code }, { signal, ...privateConfig }),
  qr: (branchId, id, signal) => client.get(vehicleDocumentPath(branchId, id, "qr.svg"), {
    responseType: "blob", signal, __skipSupportIncident: true,
  }),
};

export function readVehicleHistory(body, id) {
  const history = body?.data;
  if (!validVehicleId(history?.vehicle_id) || Number(history.vehicle_id) !== Number(id) ||
      !Array.isArray(history.orders?.data) || !Array.isArray(history.bookings?.data)) {
    throw new Error("El servidor devolvió un historial en un formato no reconocido.");
  }
  return { orders: readVehiclePage(history.orders), bookings: readVehiclePage(history.bookings) };
}

// Accept Laravel's standard paginator, directly or inside the usual data envelope.
export function readVehiclePage(body) {
  const page = Array.isArray(body) || Array.isArray(body?.data) ? body : body?.data;
  if (Array.isArray(page)) return { rows: page, pages: 1 };
  if (!Array.isArray(page?.data)) throw new Error("El servidor devolvió un formato de lista no reconocido.");
  const pages = Number.isSafeInteger(page.last_page) && page.last_page > 0 ? page.last_page :
    page.per_page > 0 && page.total >= 0 ? Math.max(1, Math.ceil(page.total / page.per_page)) : 1;
  return { rows: page.data, pages };
}

export function readVehicle(body, id) {
  const vehicle = body?.data ?? body;
  if (!validVehicleId(vehicle?.id) || Number(vehicle.id) !== Number(id)) {
    throw new Error("El servidor no devolvió el expediente solicitado en un formato reconocido.");
  }
  return vehicle;
}
