export const DEPARTURE_STATUSES = [
  ["scheduled", "Programada"], ["boarding", "Abordando"], ["departed", "En ruta"],
  ["completed", "Finalizada"], ["cancelled", "Cancelada"],
];
export const departureMoney = (value) => value == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));
export function departureDate(value) {
  if (!value) return "—";
  const date = new Date(String(value).slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
export function departureError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message = status === 403 ? "No tienes permiso para realizar esta acción."
    : status === 404 ? "La salida no está disponible para esta sucursal."
    : status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión."
    : data?.message || error.message || "No se pudo completar la operación.";
  return [message, ...Object.values(data?.errors || {}).flat()].join("\n");
}
export function departureCollection(data) {
  const collection = data?.departures ?? data;
  const rows = Array.isArray(collection) ? collection : collection?.data;
  if (!Array.isArray(rows)) throw new Error("No se pudo leer el listado de salidas del servidor.");
  return { rows, lastPage: Number(collection?.last_page || collection?.meta?.last_page || data?.meta?.last_page || 1) };
}
export function departureRecord(data) {
  const record = data?.departure ?? data?.data ?? data;
  if (!record?.id) throw new Error("El servidor no devolvió el detalle de la salida.");
  return record;
}
