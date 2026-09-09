export const BOOKING_STATUSES = [["pending", "Pendiente"], ["confirmed", "Confirmada"], ["cancelled", "Cancelada"]];
export const PAYMENT_STATUSES = [["pending", "Pendiente"], ["partial", "Parcial"], ["paid", "Pagado"], ["refunded", "Reembolsado"]];
export const customerLabel = (booking) => booking.customer?.nombre_alias || booking.customer?.name || booking.customer?.nombre || (booking.customer_id ? "Cliente #" + booking.customer_id : "Sin cliente");
export function bookingError(error) {
  const status = error?.response?.status, data = error?.response?.data;
  const message = status === 403 ? "No tienes permiso para modificar esta reservación."
    : status === 404 ? "La reservación no está disponible para esta sucursal."
    : status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión."
    : data?.message || error?.message || "No se pudo completar la operación.";
  return [message, ...Object.values(data?.errors || {}).flat()].join("\n");
}
export function bookingRecord(data) {
  const record = data?.booking ?? data?.data ?? data;
  if (!record?.id) throw new Error("El servidor no devolvió el detalle de la reservación.");
  return record;
}
export function bookingCollection(data) {
  const collection = data?.bookings ?? data;
  const rows = Array.isArray(collection) ? collection : collection?.data;
  if (!Array.isArray(rows)) throw new Error("No se pudo leer el listado de reservaciones.");
  return { rows, lastPage: Number(collection?.last_page || collection?.meta?.last_page || data?.meta?.last_page || 1) };
}
export function bookingLimit(departure, booking) {
  if (departure?.available_capacity == null) return null;
  const available = Number(departure.available_capacity);
  if (!Number.isInteger(available) || available < 0) return null;
  // Existing active bookings already occupy their own seats.
  return available + (booking && booking.status !== "cancelled" ? Number(booking.passenger_count || 0) : 0);
}
export function bookingEstimate(price, count) {
  if (price == null || price === "" || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(count)) || Number(count) < 1) return null;
  const cents = Math.round(Number(price) * 100) * Number(count);
  return Number.isSafeInteger(cents) ? (cents / 100).toFixed(2) : null;
}
