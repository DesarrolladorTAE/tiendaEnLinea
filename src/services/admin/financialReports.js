import client from "../../config/axiosClient";
import { blobHasSignature, readBlob } from "../../utils/readBlob";

export const financialReportRoot = "/admin/reportes/financieros";
const base = "/reports/admin";
const options = (signal) => ({ signal, __skipSupportIncident: true, __skipAuthRedirect: true });
export const reportSettings = (signal) => client.get(`${base}/settings`, options(signal)).then(({ data }) => data.data);
export const saveReportSettings = (body, signal) => client.put(`${base}/settings`, body, options(signal)).then(({ data }) => data.data);
export const fetchFinancialReport = (period, params, signal) =>
  client.get(`${base}/${period}`, { ...options(signal), params }).then(({ data }) => data);

export function financialExportPath(period, format, params) {
  const { page, per_page, ...filters } = params;
  return `${base}/${period}/${format}?${new URLSearchParams(filters)}`;
}

export function financialExportName(period, format, params) {
  if (format === "excel") return period === "weekly" ? "reporte-semanal.xlsx" : "reporte-mensual.xlsx";
  const { branch_id = "ALL", year, month } = params;
  if (period === "weekly") return `WEEK-${branch_id}-${params.from.replaceAll("-", "")}-${params.to.replaceAll("-", "")}.pdf`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}${String(month).padStart(2, "0")}`;
  return `MONTH-${branch_id}-${prefix}01-${prefix}${last}.pdf`;
}

export async function fetchFinancialExcel(period, params, signal) {
  const { data } = await client.get(financialExportPath(period, "excel", params), { ...options(signal), responseType: "blob" });
  if (!(data instanceof Blob)) throw new Error("El servidor no devolvió un archivo Excel válido.");
  if (/json/i.test(data.type)) {
    const error = new Error("El servidor devolvió un error al generar Excel.");
    error.response = { data };
    throw error;
  }
  if (!await blobHasSignature(data, [80, 75, 3, 4])) throw new Error("El servidor no devolvió un archivo Excel válido.");
  return data;
}

export async function reportError(error) {
  const status = error.response?.status;
  if (status === 401) return "Tu sesión venció. Inicia sesión de nuevo.";
  if (status === 403) return "La cuenta actual no tiene acceso a los reportes financieros.";
  if (status === 404) return "El reporte o uno de sus filtros no está disponible en esta tienda.";
  let body = error.response?.data;
  if (body instanceof Blob) {
    try { body = JSON.parse(await readBlob(body, "text")); } catch { body = null; }
  }
  return Object.values(body?.errors ?? {}).flat().join(" ") || body?.message || error.message || "No se pudo cargar el reporte.";
}

export const moneyMXN = (value) => {
  if (value == null) return "No disponible";
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(String(value));
  if (!match) return "No disponible";
  const [, sign, whole, decimal = ""] = match;
  const fraction = decimal.padEnd(2, "0");
  return `${sign}$${BigInt(whole).toLocaleString("es-MX")}.${fraction} MXN`;
};

export function localReportDate(timezone, instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export const reportDayOffset = (day, offset) => {
  const when = new Date(`${day}T00:00:00Z`);
  when.setUTCDate(when.getUTCDate() + offset);
  return when.toISOString().slice(0, 10);
};

export function validReportFilters(period, params) {
  if (["branch_id", "product_id", "category_id"].some((field) => params[field] && !/^[1-9]\d*$/.test(params[field]))) return false;
  if (period === "monthly") return /^\d{4}$/.test(params.year) && Number(params.year) >= 2000 && Number(params.year) <= 2200 &&
    /^\d{1,2}$/.test(params.month) && Number(params.month) >= 1 && Number(params.month) <= 12;
  const validDate = (day) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && reportDayOffset(day, 0) === day;
  return validDate(params.from) && validDate(params.to) && params.from <= params.to && params.to <= reportDayOffset(params.from, 6);
}

export function validDistribution(expenses, savings) {
  const exact = (value) => {
    if (!/^\d{1,3}(?:\.\d{1,6})?$/.test(String(value))) return null;
    const [whole, fraction = ""] = String(value).split(".");
    return BigInt(whole + fraction.padEnd(6, "0"));
  };
  const a = exact(expenses), b = exact(savings);
  return a != null && b != null && a + b === 100000000n;
}

