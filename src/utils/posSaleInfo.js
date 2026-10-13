// Date-only and timezone-less API dates are Mexico City calendar values.
export const posDateValue = (value) => {
  if (!value) return null;
  const raw = String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const normalized = dateOnly ? `${raw}T12:00:00-06:00`
    : /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw)
      ? `${raw.replace(" ", "T")}-06:00` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const posDate = (value, detailed = false) => {
  const date = posDateValue(value);
  if (!date) return "No disponible";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City", day: "2-digit",
    month: detailed ? "long" : "short", year: "numeric",
    ...(detailed && !dateOnly ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
  }).format(date) + (detailed && !dateOnly ? " h" : "");
};

export const saleInfo = (sale = {}) => {
  const movements = Array.isArray(sale.credit_movements) ? sale.credit_movements : [];
  const creditStatuses = ["paid", "settled", "pending", "unpaid", "active", "liquidado", "saldado"];
  // A paid sale can still originate from credit; credit evidence takes priority.
  const credit = sale.is_credit === true || sale.credit?.is_credit === true ||
    sale.credit_account_id != null || sale.credit?.credit_account_id != null ||
    creditStatuses.includes(sale.credit_status) || !!sale.credit_paid_at ||
    ["credit", "credit_paid"].includes(sale.status) || movements.length > 0;
  const settled = credit && (sale.status === "credit_paid" || sale.status === "paid" ||
    !!sale.credit_paid_at || sale.credit?.is_credit_paid === true ||
    ["paid", "settled", "liquidado", "saldado"].includes(sale.credit_status));
  // Only an explicitly returned null account (or explicit cash flag) proves no credit.
  // An omitted field and an empty movement history do not establish the sale type.
  const explicitNoCredit = Object.prototype.hasOwnProperty.call(sale, "credit_account_id") && sale.credit_account_id === null;
  const cash = !credit && (explicitNoCredit || sale.credit?.is_credit === false ||
    ["cash", "contado"].includes(sale.sale_type) || sale.is_credit === false);
  const type = settled ? "credit_paid" : credit ? "credit" : cash ? "cash" : "unknown";
  const invoiced = sale.invoice_status === "timbrada" || sale.invoice?.status === "timbrada";
  return {
    type, invoiced,
    label: { credit_paid: "CRÉDITO LIQUIDADO", credit: "CRÉDITO PENDIENTE", cash: "CONTADO", unknown: "Tipo no disponible" }[type],
    color: settled || credit ? "info" : cash ? "success" : "default",
    paymentDate: settled ? sale.credit_paid_at || null
      : cash && sale.status === "paid" ? sale.paid_at || sale.created_at : null,
    invoiceLabel: invoiced ? "FACTURADA" : sale.fuera_de_rango ? "FUERA DE PERIODO"
      : sale.invoice_status === "error" || sale.error_message ? "ERROR DE FACTURACIÓN" : "PENDIENTE DE FACTURAR",
    invoiceColor: invoiced ? "success" : sale.fuera_de_rango ? "default"
      : sale.invoice_status === "error" || sale.error_message ? "error" : "warning",
  };
};

export const uniqueSales = (sales = []) => {
  const seen = new Set();
  return sales.filter(sale => {
    if (sale.id == null) return true;
    const key = String(sale.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Missing, blank, boolean and non-finite amounts are not zero.
export const validAmount = value => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};
const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const saleAmounts = (sale = {}) => {
  sale = sale || {};
  const gross = validAmount(sale.total_amount);
  const iva = validAmount(sale.iva_total);
  const retention = validAmount(sale.isr_retention_total);
  const suppliedNet = validAmount(sale.net_total_amount);
  // The API net already accounts for withholding. Never subtract ISR from it.
  const net = suppliedNet ?? (gross !== null && retention !== null ? roundMoney(gross - retention) : null);
  const subtotal = validAmount(sale.subtotal_amount) ?? validAmount(sale.subtotal) ??
    (gross !== null && iva !== null ? roundMoney(gross - iva) : null);
  return { gross, iva, retention, net, subtotal, hasRetention: (retention !== null && retention > 0) || sale.isr_retention_applied === true };
};
export const posMoney = value => value === null || value === undefined ? "No disponible" :
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const sumSaleAmounts = (sales = [], field = "net") => {
  let amount = 0, missing = 0;
  uniqueSales(sales).forEach(sale => {
    const value = saleAmounts(sale)[field];
    if (value === null || value === undefined) missing += 1;
    else amount += Math.round(value * 100);
  });
  return { amount: amount / 100, missing };
};
export const summarizeSales = (sales = []) => {
  const records = uniqueSales(sales);
  const groups = { cash: [], credit_paid: [], invoiced: [], facturable: [], unknown: [] };
  records.forEach(sale => {
    const info = saleInfo(sale);
    if (groups[info.type]) groups[info.type].push(sale);
    if (info.invoiced) groups.invoiced.push(sale);
    if (sale.facturable === true && !info.invoiced && !sale.fuera_de_rango) groups.facturable.push(sale);
  });
  const summary = Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, { count: group.length, ...sumSaleAmounts(group) }]));
  summary.retention = sumSaleAmounts(records, "retention");
  return summary;
};

export const saleDayKey = (sale) => {
  const date = posDateValue(sale.invoice_period_date);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type).value).join("-");
};

