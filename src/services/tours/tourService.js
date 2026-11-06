import axiosClient from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";

// Both existing clients already include /api in baseURL.
export async function getTourServices({ branchId, mode, signal }) {
  if (!Number.isSafeInteger(Number(branchId)) || Number(branchId) <= 0) {
    throw new Error("Selecciona una sucursal válida.");
  }
  const client = mode === "store" ? axiosClient : mode === "pos" ? axiosClientPOS : null;
  if (!client) throw new Error("La sesión de Tours no es válida.");
  const tours = [];
  let page = 1;
  let lastPage = 1;
  do {
    const { data } = await client.get(
      `/branches/${branchId}/services`,
      { params: { page }, signal }
    );
    if (data?.success === false || data?.ok === false) {
      throw new Error(data.message || "No se pudo consultar el cat?logo de servicios.");
    }
    const services = data?.services ?? data?.data?.services ?? data?.data ?? data;
    const rows = Array.isArray(services) ? services : services?.data;
    if (!Array.isArray(rows)) {
      throw new Error("No se pudo leer el listado de servicios de la sucursal.");
    }
    tours.push(...rows.filter((service) => service.service_type === "tour"));
    const pagination = services?.meta ?? services;
    lastPage = Number(pagination?.last_page ?? data?.meta?.last_page ?? 1);
    if (!Number.isSafeInteger(lastPage) || lastPage < page) {
      throw new Error("La paginaci?n del cat?logo de servicios no es v?lida.");
    }
    page += 1;
  } while (page <= lastPage);
  return tours;
}


function departureContext({ branchId, serviceId, mode }, write = false) {
  if (write && mode !== "store") throw new Error("No tienes permiso para realizar esta acción.");
  const client = mode === "store" ? axiosClient : mode === "pos" ? axiosClientPOS : null;
  if (!client) throw new Error("La sesión de Tours no es válida.");
  for (const id of [branchId, ...(serviceId === undefined ? [] : [serviceId])]) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("La sucursal o el tour no es válido.");
  }
  // Existing catalog, departures and booking APIs retain the client base URL.
  const prefix = /\/api\/?$/.test(client.defaults.baseURL || "") ? "" : "/api";
  const branchPath = `/branches/${branchId}`;
  return { client, branchPath, toursPath: prefix + branchPath };
}

function departurePath(context, departureId) {
  if (!Number.isSafeInteger(Number(context.serviceId)) || Number(context.serviceId) <= 0) throw new Error("Selecciona un tour válido.");
  const { toursPath } = departureContext(context);
  if (departureId !== undefined && (!Number.isSafeInteger(Number(departureId)) || Number(departureId) <= 0)) throw new Error("La salida no es válida.");
  return `${toursPath}/services/${context.serviceId}/departures${departureId === undefined ? "" : "/" + departureId}`;
}

const DEPARTURE_FIELDS = ["tour_route_id", "resource_id", "departure_date", "departure_time", "estimated_return_time", "capacity", "price", "status", "notes"];
const departurePayload = (values) => Object.fromEntries(DEPARTURE_FIELDS
  .filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));

export async function getDepartures(context, { page = 1, date, status } = {}) {
  const { client } = departureContext(context);
  return client.get(departurePath(context), {
    params: { page, per_page: 16, ...(date ? { date } : {}), ...(status ? { status } : {}) },
    signal: context.signal,
  });
}

export async function getDeparture(context, departureId) {
  const { client } = departureContext(context);
  return client.get(departurePath(context, departureId), { signal: context.signal });
}

export async function createDeparture(context, values) {
  const { client } = departureContext(context, true);
  return client.post(departurePath(context), departurePayload(values));
}

export async function updateDeparture(context, departureId, values) {
  const { client } = departureContext(context, true);
  return client.put(departurePath(context, departureId), departurePayload(values));
}

export async function cancelDeparture(context, departureId) {
  const { client } = departureContext(context, true);
  return client.delete(departurePath(context, departureId));
}

async function getCatalog(client, url, key, signal) {
  const rows = [];
  let page = 1;
  let lastPage = 1;
  do {
    const { data } = await client.get(url, { params: { page }, signal });
    const collection = data?.[key] ?? data?.data ?? data;
    const items = Array.isArray(collection) ? collection : collection?.data;
    if (!Array.isArray(items)) throw new Error("No se pudo leer el catálogo del servidor.");
    rows.push(...items);
    lastPage = Number(collection?.last_page || collection?.meta?.last_page || data?.meta?.last_page || 1);
    page += 1;
  } while (page <= lastPage);
  return rows;
}

export async function getTourRoutes(context) {
  const { client, toursPath } = departureContext(context);
  return getCatalog(client, toursPath + "/tour-routes", "routes", context.signal);
}

export async function getTourRoute(context, routeId) {
  const { client, toursPath } = departureContext(context);
  return client.get(`${toursPath}/tour-routes/${passengerEntityId(routeId)}`, { signal: context.signal });
}

const routeFields = ["name", "origin", "destination", "description", "is_active"];
const stopFields = ["name", "address", "lat", "lng", "reference", "is_active"];
const routeStopFields = ["stop_order", "default_departure_time", "boarding_minutes", "price_adjustment"];
const onlyFields = (values, fields) => Object.fromEntries(fields.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));

function tourCatalogEndpoint(context, entity, id, write = false) {
  const { client, toursPath } = departureContext(context, write);
  return { client, url: `${toursPath}/${entity}${id == null ? "" : `/${passengerEntityId(id)}`}` };
}

export function createTourRoute(context, values) {
  const { client, url } = tourCatalogEndpoint(context, "tour-routes", null, true);
  return client.post(url, onlyFields(values, routeFields));
}
export function updateTourRoute(context, id, values) {
  const { client, url } = tourCatalogEndpoint(context, "tour-routes", id, true);
  return client.put(url, onlyFields(values, routeFields));
}
export function getTourStops(context) {
  const { client, url } = tourCatalogEndpoint(context, "tour-stops");
  return getCatalog(client, url, "stops", context.signal);
}
export function getTourStop(context, id) {
  const { client, url } = tourCatalogEndpoint(context, "tour-stops", id);
  return client.get(url, { signal: context.signal });
}
export function createTourStop(context, values) {
  const { client, url } = tourCatalogEndpoint(context, "tour-stops", null, true);
  return client.post(url, onlyFields(values, stopFields));
}
export function updateTourStop(context, id, values) {
  const { client, url } = tourCatalogEndpoint(context, "tour-stops", id, true);
  return client.put(url, onlyFields(values, stopFields));
}
function routeStopEndpoint(context, routeId, stopId) {
  const { client, url } = tourCatalogEndpoint(context, "tour-routes", routeId, true);
  return { client, url: `${url}/stops${stopId == null ? "" : `/${passengerEntityId(stopId)}`}` };
}
export function addTourRouteStop(context, routeId, stopId, values) {
  const { client, url } = routeStopEndpoint(context, routeId);
  return client.post(url, { tour_stop_id: passengerEntityId(stopId), ...onlyFields(values, routeStopFields) });
}
export function updateTourRouteStop(context, routeId, stopId, values) {
  const { client, url } = routeStopEndpoint(context, routeId, stopId);
  return client.put(url, onlyFields(values, routeStopFields));
}
export function removeTourRouteStop(context, routeId, stopId) {
  const { client, url } = routeStopEndpoint(context, routeId, stopId);
  return client.delete(url);
}

export async function getTourResources(context) {
  const { client, branchPath } = departureContext(context);
  return getCatalog(client, branchPath + "/resources", "resources", context.signal);
}


function bookingPath(context, bookingId) {
  const { toursPath } = departureContext(context);
  for (const id of [context.departureId, ...(bookingId === undefined ? [] : [bookingId])]) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("La reservación o salida no es válida.");
  }
  return `${toursPath}/departures/${context.departureId}/bookings${bookingId === undefined ? "" : "/" + bookingId}`;
}
const BOOKING_EDIT_FIELDS = ["customer_id", "registered_by", "external_reference", "passenger_count", "status", "notes"];
const bookingPayload = (values, creating) => Object.fromEntries(
  [...BOOKING_EDIT_FIELDS, ...(creating ? ["subtotal", "total"] : [])]
    .filter((key) => values[key] !== undefined).map((key) => [key, values[key]])
);
export async function getBookings(context, page = 1) {
  const { client } = departureContext(context);
  return client.get(bookingPath(context), { params: { page, per_page: 16 }, signal: context.signal });
}
export async function getBooking(context, bookingId) {
  const { client } = departureContext(context);
  return client.get(bookingPath(context, bookingId), { signal: context.signal });
}
export async function createBooking(context, values) {
  const { client } = departureContext(context);
  return client.post(bookingPath(context), bookingPayload(values, true));
}
export async function updateBooking(context, bookingId, values) {
  const { client } = departureContext(context);
  return client.put(bookingPath(context, bookingId), bookingPayload(values, false));
}
export async function cancelBooking(context, bookingId) {
  const { client } = departureContext(context);
  return client.delete(bookingPath(context, bookingId));
}
export async function getBookingCustomers(context) {
  const { client } = departureContext(context);
  if (context.mode !== "pos" || !Number.isSafeInteger(Number(context.posLocationId)) || Number(context.posLocationId) <= 0) {
    throw new Error("No se pudo identificar el punto de venta para consultar clientes.");
  }
  const { data } = await client.get("/clientes/simple", { params: { pos_location_id: context.posLocationId }, signal: context.signal });
  if (!Array.isArray(data?.data)) throw new Error("No se pudo leer el catálogo de clientes.");
  return data.data;
}


function passengerEndpoint(context, suffix) {
  const { client, toursPath } = departureContext(context);
  return { client, url: toursPath + suffix };
}
function passengerEntityId(id) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("El identificador no es válido.");
  return Number(id);
}
const PASSENGER_FIELDS = ["first_name", "last_name", "phone", "email", "birth_date", "gender", "emergency_contact_name", "emergency_contact_phone", "notes"];
const ASSIGNMENT_FIELDS = ["boarding_stop_id", "trip_type", "transport_required", "seat_number", "status", "notes"];
const passengerPayload = (values, fields) => Object.fromEntries(fields.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));

export async function getPassengers(context, { search = "", page = 1 } = {}) {
  const { client, url } = passengerEndpoint(context, "/passengers");
  return client.get(url, { params: { page, ...(search.trim() ? { search: search.trim() } : {}) }, signal: context.signal });
}
export async function createPassenger(context, values) {
  const { client, url } = passengerEndpoint(context, "/passengers");
  return client.post(url, passengerPayload(values, PASSENGER_FIELDS));
}
export async function getBookingPassengers(context, bookingId) {
  const { client, url } = passengerEndpoint(context, `/bookings/${passengerEntityId(bookingId)}/passengers`);
  // Read every page so the active count is not limited to the visible page.
  return getCatalog(client, url, "passengers", context.signal);
}
export async function addBookingPassenger(context, bookingId, values) {
  const { client, url } = passengerEndpoint(context, `/bookings/${passengerEntityId(bookingId)}/passengers`);
  return client.post(url, passengerPayload(values, ["passenger_id", ...ASSIGNMENT_FIELDS]));
}
export async function updateBookingPassenger(context, bookingId, assignmentId, values) {
  // assignmentId is tour_booking_passengers.id, not passenger_id.
  const { client, url } = passengerEndpoint(context, `/bookings/${passengerEntityId(bookingId)}/passengers/${passengerEntityId(assignmentId)}`);
  // boarding_status is displayed read-only until its write contract is confirmed.
  return client.put(url, passengerPayload(values, ASSIGNMENT_FIELDS));
}
export async function removeBookingPassenger(context, bookingId, assignmentId) {
  const { client, url } = passengerEndpoint(context, `/bookings/${passengerEntityId(bookingId)}/passengers/${passengerEntityId(assignmentId)}`);
  return client.delete(url);
}
export async function getRouteStops(context, routeId) {
  const { client, url } = passengerEndpoint(context, `/tour-routes/${passengerEntityId(routeId)}/stops`);
  const { data } = await client.get(url, { signal: context.signal });
  const collection = data?.stops ?? data?.data ?? data;
  const rows = Array.isArray(collection) ? collection : collection?.data;
  if (!Array.isArray(rows)) throw new Error("No se pudieron leer las paradas de la ruta.");
  return rows;
}


function bookingPaymentEndpoint(context, bookingId, paymentId) {
  const { client, toursPath } = departureContext(context);
  for (const id of [bookingId, ...(paymentId === undefined ? [] : [paymentId])]) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("La reservación o pago no es válido.");
  }
  return { client, url: `${toursPath}/bookings/${bookingId}/payments${paymentId === undefined ? "" : "/" + paymentId}` };
}
const PAYMENT_FIELDS = ["payment_type", "payment_method", "amount", "payment_date", "status", "registered_by", "reference", "notes", "pos_location_id"];
function bookingPaymentPayload(values) {
  return Object.fromEntries(PAYMENT_FIELDS.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));
}
function checkPaymentResponse(response) {
  if (typeof response.data === "string") {
    throw new Error("El servidor devolvio una pagina en lugar de datos. Verifica la ruta de la API.");
  }
  // Business errors may use HTTP 200 with success:false.
  if (response.data?.success === false || response.data?.ok === false) {
    const error = new Error(response.data.message || "No se pudo completar la operación de pago.");
    error.response = response;
    throw error;
  }
  return response;
}
export async function getBookingPayments(context, bookingId, page = 1) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId);
  return checkPaymentResponse(await client.get(url, { params: { page }, signal: context.signal }));
}
export async function createBookingPayment(context, bookingId, values) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId);
  return checkPaymentResponse(await client.post(url, bookingPaymentPayload(values)));
}
export async function updateBookingPayment(context, bookingId, paymentId, values) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId, paymentId);
  return checkPaymentResponse(await client.put(url, bookingPaymentPayload(values)));
}
export async function cancelBookingPayment(context, bookingId, paymentId) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId, paymentId);
  return checkPaymentResponse(await client.delete(url));
}

export async function reconcileBookingPayment(context, bookingId, paymentId) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId, paymentId);
  return checkPaymentResponse(await client.post(url + "/reconcile", {}));
}

export async function downloadBookingProof(context, bookingId, paymentId) {
  const { client, url } = bookingPaymentEndpoint(context, bookingId, paymentId);
  const response = await client.get(url + "/proof", { responseType: "blob", signal: context.signal });
  const type = response.headers?.["content-type"] || response.data?.type || "";
  if (/json|text\/html/.test(type)) throw new Error("No se pudo descargar el comprobante privado.");
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl; anchor.download = `comprobante-tour-${paymentId}${type.includes("pdf") ? ".pdf" : type.includes("png") ? ".png" : type.includes("jpeg") ? ".jpg" : ""}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function getBookingTickets(context, bookingId) {
  const { client, branchPath } = departureContext(context);
  let response;
  try {
    response = await client.get(`${branchPath}/bookings/${passengerEntityId(bookingId)}/tickets.pdf`, {
      responseType: "blob", signal: context.signal,
    });
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Preserve HTTP error. */ }
    }
    throw error;
  }
  const type = response.headers?.["content-type"] || response.data?.type || "";
  if (!(response.data instanceof Blob) || !/^application\/pdf\b/i.test(type)) {
    let message = "No se pudieron generar los boletos PDF de esta reserva.";
    try { message = JSON.parse(await response.data.text()).message || message; } catch { /* Use PDF error. */ }
    throw new Error(message);
  }
  return response.data;
}

export async function getTourCollections(context, filters = {}) {
  const { client, toursPath } = departureContext(context);
  const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => ["pos_location_id", "departure_id", "date_from", "date_to", "per_page", "page"].includes(key) && value !== "" && value != null));
  return checkPaymentResponse(await client.get(`${toursPath}/tours/payments`, { params, signal: context.signal }));
}

function operationEndpoint(context) {
  const { client, toursPath } = departureContext(context);
  return { client, url: `${toursPath}/tours/departures/${passengerEntityId(context.departureId)}` };
}
export async function createAssistedSale(context, values) {
  const { client, url } = operationEndpoint(context);
  return checkPaymentResponse(await client.post(url + "/sales", values));
}
export async function getManifest(context, posLocationId) {
  const { client, url } = operationEndpoint(context);
  return checkPaymentResponse(await client.get(url + "/manifest", {
    params: posLocationId ? { pos_location_id: passengerEntityId(posLocationId) } : {}, signal: context.signal,
  }));
}
export async function downloadManifest(context, posLocationId, format = "xlsx") {
  if (!["xlsx", "pdf"].includes(format)) throw new Error("Formato de reporte inv\u00e1lido.");
  const { url } = operationEndpoint(context);
  return tourReport(context, url + "/manifest", posLocationId ? { pos_location_id: passengerEntityId(posLocationId) } : {}, format, `tour-${context.departureId}-operacion`);
}

function excelPath(branchId) {
  if (!Number.isSafeInteger(Number(branchId)) || Number(branchId) <= 0) {
    throw new Error("Selecciona una sucursal válida.");
  }
  return `branches/${branchId}/tours`;
}

export function importToursExcel(branchId, file, images = [], { onUploadProgress } = {}) {
  const path = excelPath(branchId);
  const data = new FormData();
  data.append("file", file);
  images.forEach((image) => data.append("images[]", image));
  return axiosClient.post(`${path}/import`, data, { onUploadProgress });
}

export async function exportToursExcel(branchId) {
  try {
    return await axiosClient.get(`${excelPath(branchId)}/export`, { responseType: "blob" });
  } catch (error) {
    // Error responses also arrive as blobs for this request.
    if (error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Keep the original error. */ }
    }
    throw error;
  }
}

export async function getTourHistory(context, filters = {}) {
  const { client } = departureContext(context);
  const params = onlyFields(filters, ["departure_id", "status", "payment_status", "pos_location_id", "search", "date_from", "date_to", "page", "per_page"]);
  return checkPaymentResponse(await client.get(
    `/branches/${passengerEntityId(context.branchId)}/tours/services/${passengerEntityId(context.serviceId)}/history`,
    { params, signal: context.signal }
  ));
}

// Reports use the same authenticated clients as booking operations. Export filters
// deliberately exclude pagination: the server renders every matching passenger.
async function tourReport(context, url, filters, format, filename) {
  if (!["html", "pdf", "xlsx"].includes(format)) throw new Error("Formato de reporte inválido.");
  const { client } = departureContext(context);
  const params = Object.fromEntries(Object.entries(onlyFields(filters, ["departure_id", "status", "payment_status", "pos_location_id", "search", "date_from", "date_to"])).filter(([, value]) => value !== "" && value != null));
  let response;
  try {
    response = await client.get(url, {
      params: { ...params, format }, responseType: format === "html" ? "text" : "blob", signal: context.signal,
    });
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Preserve HTTP error. */ }
    }
    throw error;
  }
  const type = response.headers?.["content-type"] || response.data?.type || "";
  if (format === "html") {
    const html = response.data;
    if (typeof html !== "string" || !/<table[\s>]/i.test(html) || /<form[\s>]/i.test(html)) {
      throw new Error("No se pudo cargar la tabla del reporte. Verifica tu sesión y vuelve a intentar.");
    }
    return html;
  }
  if (!(response.data instanceof Blob) || /json|text\/html|text\/plain/i.test(type)) {
    let message = "El servidor no generó el archivo del reporte.";
    try { message = JSON.parse(await response.data.text()).message || message; } catch { /* Use report error. */ }
    throw new Error(message);
  }
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl; link.download = `${filename}.${format}`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function getTourHistoryReport(context, filters = {}, format = "html") {
  const branch = passengerEntityId(context.branchId), service = passengerEntityId(context.serviceId);
  return tourReport(context, `/branches/${branch}/tours/services/${service}/history`, filters, format, `tour-${service}-historial`);
}

export function getManifestReport(context, posLocationId) {
  const { url } = operationEndpoint(context);
  return tourReport(context, url + "/manifest", posLocationId ? { pos_location_id: passengerEntityId(posLocationId) } : {}, "html");
}
