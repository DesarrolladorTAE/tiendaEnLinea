export const PASSENGER_STATUSES = [["reserved", "Reservado"], ["confirmed", "Confirmado"], ["checked_in", "Check-in"], ["boarded", "Abordó"], ["no_show", "No se presentó"], ["cancelled", "Cancelado"], ["completed", "Finalizado"]];
export const BOARDING_STATUSES = [["pending", "Pendiente"], ["checked_in", "Check-in"], ["boarded", "Abordó"], ["no_show", "No se presentó"]];
export const TRIP_TYPES = [["one_way", "Solo ida"], ["return_only", "Solo regreso"], ["round_trip", "Ida y vuelta"]];
export const passengerName = (passenger) => [passenger?.first_name, passenger?.last_name].filter(Boolean).join(" ") || (passenger?.id ? "Pasajero #" + passenger.id : "Pasajero");
export const activeAssignment = (assignment) => assignment.status !== "cancelled" && !assignment.deleted_at;
export const activePassengerCount = (rows) => rows.filter(activeAssignment).length;
export const assignmentLimitReached = (rows, count) => !Number.isInteger(Number(count)) || Number(count) < 1 || activePassengerCount(rows) >= Number(count);
export function passengerError(error) {
  const status = error?.response?.status, data = error?.response?.data;
  const message = status === 404 ? "No disponible para esta sucursal." : status === 403 ? "No tienes permiso para realizar esta acción."
    : status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : data?.message || error?.message || "No se pudo completar la operación.";
  return [message, ...Object.values(data?.errors || {}).flat()].join("\n");
}
export function passengerCollection(data) {
  const collection = data?.passengers ?? data;
  const rows = Array.isArray(collection) ? collection : collection?.data;
  if (!Array.isArray(rows)) throw new Error("No se pudo leer el catálogo de pasajeros.");
  return { rows, lastPage: Number(collection?.last_page || collection?.meta?.last_page || data?.meta?.last_page || 1) };
}
export function routeStop(row) {
  const stop = row.stop || row.tour_stop || row;
  const config = row.pivot || row;
  return { id: row.tour_stop_id ?? stop.id, name: stop.name,
    default_departure_time: config.default_departure_time,
    boarding_minutes: config.boarding_minutes, price_adjustment: config.price_adjustment };
}
