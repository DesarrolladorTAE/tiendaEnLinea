import { saveAs } from "file-saver";

export const cashTimeZone = "America/Mexico_City";
export const cashPath = (posId) => `/pos/${posId}/cash`;
export const canSellWithCash = (status) =>
  status?.cash_control_enabled === false || status?.can_sell === true;
export const canOpenCashWithoutPrompt = (status) =>
  status?.cash_control_enabled === true &&
  status.opening_amount_required === false &&
  status.session === null;

const dateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: cashTimeZone,
});
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: cashTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function cashBusinessDate() {
  const parts = Object.fromEntries(day.formatToParts().map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const cashAlreadyCutMessage = "La caja ya fue cortada hoy. Podrás abrirla de nuevo el siguiente día.";
export const cashMoney = (amount) => amount == null ? "—" : money.format(Number(amount));
export const cashDateTime = (value) => value && Number.isFinite(Date.parse(value))
  ? dateTime.format(new Date(value))
  : "—";

export function cashBlockMessage(status) {
  if (!status?.session) return "Abre la caja para cobrar.";
  const businessDate = status.session.business_date?.slice(0, 10);
  if (businessDate && businessDate !== cashBusinessDate()) {
    return "La caja es de un día anterior. Haz el corte y abre la caja de hoy.";
  }
  return "La caja está fuera del horario de venta. Haz el corte o solicita tiempo extra a la tienda.";
}

export function cashError(error, fallback) {
  const data = error?.response?.data;
  const validation = Object.values(data?.errors ?? {}).flat().filter(Boolean).join(" ");
  return validation || data?.message || fallback;
}

export function parseCashAmount(value) {
  const input = value.trim().replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(input) && Number.isFinite(Number(input))
    ? Number(input)
    : null;
}

export async function downloadCashReport(client, path, id, format, opening) {
  const { data } = await client.get(`${path}/history/${id}/export/${format}`, {
    responseType: "blob",
    params: opening ? { phase: "opening" } : undefined,
  });
  saveAs(data, `${opening ? "inventario-inicial" : "corte"}-${id}.${format}`);
}
