export const PAYMENT_TYPES = [["deposit", "Anticipo"], ["partial", "Abono"], ["final", "Liquidación"], ["full", "Pago completo"], ["refund", "Devolución"]];
export const PAYMENT_METHODS = [["cash", "Efectivo"], ["transfer", "Transferencia"], ["debit_card", "Tarjeta de débito"], ["credit_card", "Tarjeta de crédito"], ["online", "Pago en línea"], ["other", "Otro"]];
export const PAYMENT_RECORD_STATUSES = [["pending", "Pendiente"], ["confirmed", "Confirmado"], ["rejected", "Rechazado"], ["cancelled", "Cancelado"], ["refunded", "Reembolsado"]];
export const BOOKING_PAYMENT_LABELS = { pending: "Pendiente", partial: "Parcial", paid: "Pagado", refunded: "Reembolsado" };
export const paymentLabel = (options, value) => options.find(([key]) => key === value)?.[1] || value || "Sin información";
export const paymentMoney = (value) => value == null || value === "" ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));

// Decimal parsing only for form validation. Server balances are never derived here.
export function paymentCents(value) {
  if (value == null || !/^\d+(?:\.\d{1,2})?$/.test(String(value).trim())) return null;
  const [whole, decimal = ""] = String(value).trim().split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
export function paymentLimit(booking, type, editingPayment) {
  const refund = type === "refund";
  const balance = paymentCents(refund ? booking.paid_amount : booking.remaining_amount);
  if (balance == null) return null;
  // An edit replaces this confirmed record. Allow its existing amount as well;
  // this is a form bound, never a computed booking balance.
  const replacesSameKind = editingPayment?.status === "confirmed" && (editingPayment.payment_type === "refund") === refund;
  const allowance = replacesSameKind ? paymentCents(editingPayment.amount) : 0;
  return allowance == null ? null : balance + allowance;
}
export function localPaymentDate(now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + "T" + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
}
export function paymentDateInput(value) {
  if (!value) return "";
  // A timestamp with an explicit offset represents an instant; display locally.
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : localPaymentDate(date);
  }
  return String(value).replace(" ", "T").slice(0, 19);
}
export function serializePaymentDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value || "");
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day) || date.getHours() !== Number(hour) || date.getMinutes() !== Number(minute) || date.getSeconds() !== Number(second)) return null;
  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}
export function paymentDateLabel(value) {
  const local = paymentDateInput(value);
  const date = local && new Date(local);
  return !date || Number.isNaN(date.getTime()) ? "Sin fecha" : date.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function paymentError(error) {
  const status = error?.response?.status, body = error?.response?.data;
  const message = status === 403 ? "No tienes permiso para registrar este pago."
    : status === 404 ? "La reservación o pago no está disponible para esta sucursal."
    : status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión."
    : body?.message || error?.message || "No se pudo completar la operación de pago.";
  return [message, ...Object.values(body?.errors || {}).flat()].join("\n");
}
export function paymentCollection(body) {
  const collection = Array.isArray(body?.data) ? body : body?.data;
  if (!Array.isArray(collection?.data)) throw new Error("No se pudo leer el historial paginado de pagos.");
  return { rows: collection.data, page: Number(collection.current_page || 1), lastPage: Number(collection.last_page || 1), perPage: collection.per_page, total: collection.total };
}
export function paymentBooking(record, bookingId) {
  return record && String(record.id) === String(bookingId) && ["total", "paid_amount", "remaining_amount", "payment_status"].every((key) => record[key] != null) ? record : null;
}
export function validatePayment(form, booking, editingPayment) {
  const errors = {};
  if (!PAYMENT_TYPES.some(([key]) => key === form.payment_type)) errors.payment_type = "Selecciona un tipo de pago.";
  if (!PAYMENT_METHODS.some(([key]) => key === form.payment_method)) errors.payment_method = "Selecciona un método de pago.";
  if (!PAYMENT_RECORD_STATUSES.some(([key]) => key === form.status)) errors.status = "Selecciona un estado válido.";
  const cents = paymentCents(form.amount), limit = paymentLimit(booking, form.payment_type, editingPayment);
  if (cents == null || cents <= 0) errors.amount = "Ingresa un monto positivo con máximo dos decimales.";
  else if (limit == null) errors.amount = "Actualiza el saldo de la reservación antes de continuar.";
  else if (cents > limit) errors.amount = form.payment_type === "refund" ? "La devolución supera el neto confirmado disponible." : "El monto supera el saldo disponible para este registro.";
  if (!serializePaymentDate(form.payment_date)) errors.payment_date = "Ingresa una fecha y hora válidas.";
  return errors;
}
