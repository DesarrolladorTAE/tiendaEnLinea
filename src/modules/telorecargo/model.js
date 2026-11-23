export const money = (value) => Number(value || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
export const entity = (response) => response?.data ?? response;
export function catalogPage(response, perPage = 20) {
  let value = response;
  let metadata = response?.meta || response;
  for (let depth = 0; depth < 5 && value && !Array.isArray(value); depth++) {
    if (value.current_page || value.last_page || value.total != null) metadata = value;
    value = value.productos ?? value.Productos ?? value.products ?? value.data;
  }
  if (!Array.isArray(value)) throw new Error("No se pudo interpretar el catálogo de Telorecargo.");
  return { rows: value, hasMore: metadata?.last_page ? Number(metadata.current_page || 1) < Number(metadata.last_page) : metadata?.total != null ? Number(metadata.current_page || 1) * perPage < Number(metadata.total) : value.length === perPage };
}
export const complete = (operation) => operation?.status === "confirmada" && operation?.sale_id != null;
export const terminal = (operation, funding = false) => funding
  ? Boolean(operation?.id) && ["pendiente", "confirmado", "rechazada"].includes(operation?.status)
  : complete(operation) || operation?.status === "rechazada";
export const newKey = (funding = false) => `mtelmx:${funding ? "deposito" : "recarga"}:${crypto.randomUUID()}`;
export function cents(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error("Usa importes positivos con máximo dos decimales.");
  const [whole, fraction = ""] = String(value).split(".");
  const total = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(total)) throw new Error("El importe no es válido.");
  return total;
}
export const decimal = (value) => (value / 100).toFixed(2);
export function paymentPayload(payments, total) {
  if (!payments.length || payments.length > 10) throw new Error("Captura entre uno y diez pagos.");
  const rows = payments.map((payment) => {
    if (!["efectivo", "td", "tc", "transferencia"].includes(payment.method)) throw new Error("Método de pago inválido.");
    const amount = cents(payment.amount);
    if (!amount) throw new Error("Cada pago debe ser mayor a cero.");
    if (payment.method !== "efectivo" && (!payment.referencia?.trim() || !/^\d{4}$/.test(payment.ultimos_4 || ""))) throw new Error("Tarjetas y transferencias requieren referencia y cuatro dígitos.");
    return { method: payment.method, amount: decimal(amount), ...(payment.method !== "efectivo" ? { referencia: payment.referencia.trim(), ultimos_4: payment.ultimos_4 } : {}) };
  });
  if (rows.reduce((sum, row) => sum + cents(row.amount), 0) !== cents(total)) throw new Error("Los pagos aplicados deben sumar exactamente el total a cobrar.");
  return rows;
}
export function rechargeBody(quote, phone, payments, worker, customer, now = Date.now()) {
  if (!quote?.cotizacion || !Number.isFinite(Date.parse(quote.expires_at)) || Date.parse(quote.expires_at) <= now) throw new Error("La cotización venció. Cotiza nuevamente y revisa el total antes de confirmar.");
  if (!/^\d{10}$/.test(phone)) throw new Error("El teléfono debe contener exactamente 10 dígitos.");
  return { cotizacion: quote.cotizacion, referencia: phone, pagos: paymentPayload(payments, quote.total_cobrar), ...(worker ? { worker_id: Number(worker) } : {}), ...(customer ? { client_id: Number(customer) } : {}) };
}
export function fundingBody(amount, reference, file) {
  const value = cents(amount);
  if (value < 100 || value > 9999999999) throw new Error("El abono debe ser de $1.00 a $99,999,999.99.");
  if (!reference?.trim() || reference.trim().length > 100) throw new Error("Captura una referencia bancaria de hasta 100 caracteres.");
  if (!file || !["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Adjunta un JPG, PNG o PDF de máximo 2 MB.");
  return { monto: decimal(value), referencia: reference.trim() };
}
export function filtersValid(filters) {
  const from = Date.parse(`${filters.desde}T00:00:00Z`), to = Date.parse(`${filters.hasta}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.desde) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.hasta)
    || !Number.isFinite(from) || !Number.isFinite(to) || new Date(from).toISOString().slice(0, 10) !== filters.desde || new Date(to).toISOString().slice(0, 10) !== filters.hasta
    || to < from || to - from > 365 * 86400000) throw new Error("Selecciona un periodo válido de máximo 366 días.");
}
export function initialDates() {
  const date = new Date();
  const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, "0");
  return { desde: `${year}-${month}-01`, hasta: `${year}-${month}-${String(date.getDate()).padStart(2, "0")}`, status: "" };
}
export function errorMessage(error) {
  if (error.response?.status === 401) return "La sesión venció. Inicia sesión nuevamente; el pedido original permanece guardado.";
  if (error.response?.status === 403) return "Tu sesión no tiene permiso o el acceso de la tienda venció.";
  if (error.response?.status === 429) return "Se alcanzó el límite de solicitudes. Espera antes de reintentar con el mismo pedido.";
  const data = error.response?.data;
  if (data instanceof Blob) return "No se pudo descargar el comprobante. Revisa la sesión y el estado de la operación.";
  return Object.values(data?.errors || {}).flat().join(" ") || data?.message || error.message || "No se pudo completar la solicitud.";
}
export function operationFromError(error) {
  const value = error.response?.data?.data;
  return value && typeof value === "object" && value.id ? value : null;
}
// Only a field-level quote rejection before any operation was returned is a
// definitive preflight rejection. All ambiguous results retain the original key.
export const quoteRejectedBeforeSend = (error) => error.response?.status === 422
  && Boolean(error.response?.data?.errors?.cotizacion) && !operationFromError(error);
export const statusMeta = (operation) => {
  if (operation?.status === "confirmada" && !complete(operation)) return ["Venta local pendiente", "warning"];
  return ({ confirmada: ["Confirmada", "success"], procesando: ["Procesando", "info"], en_revision: ["En revisión", "warning"], reintentable: ["Reintentable", "warning"], rechazada: ["Rechazada", "error"], pendiente: ["Pendiente de aprobación", "warning"], confirmado: ["Saldo aprobado", "success"] })[operation?.status] || ["Resultado por verificar", "warning"];
};
