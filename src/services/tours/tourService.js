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
    const services = data?.services;
    if (!Array.isArray(services?.data)) {
      throw new Error("No se pudo leer el listado de servicios de la sucursal.");
    }
    tours.push(...services.data.filter((service) => service.service_type === "tour"));
    lastPage = Number(services.last_page || 1);
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
  // Existing Axios baseURL ends in /api/: never prefix /api a second time.
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
    const collection = data?.[key] ?? data;
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
  return getCatalog(client, url, "stops", context.signal);
}


function bookingPaymentEndpoint(context, bookingId, paymentId) {
  const { client, toursPath } = departureContext(context);
  for (const id of [bookingId, ...(paymentId === undefined ? [] : [paymentId])]) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("La reservación o pago no es válido.");
  }
  return { client, url: `${toursPath}/bookings/${bookingId}/payments${paymentId === undefined ? "" : "/" + paymentId}` };
}
const PAYMENT_FIELDS = ["payment_type", "payment_method", "amount", "payment_date", "status", "registered_by", "reference", "notes"];
function bookingPaymentPayload(values) {
  return Object.fromEntries(PAYMENT_FIELDS.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));
}
function checkPaymentResponse(response) {
  // Business errors may use HTTP 200 with success:false.
  if (response.data?.success === false) {
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
