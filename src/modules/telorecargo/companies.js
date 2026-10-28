export function usableLogo(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? value.trim() : null;
  } catch { return null; }
}

export function companyPriority(company) {
  const name = String(company?.Nombre || "").trim().toLowerCase();
  if (/\btelcel\b/.test(name)) return 0;
  if (/\bmovistar\b/.test(name)) return 1;
  if (/\bbait\b/.test(name)) return 2;
  return 3;
}

export function companyList(response) {
  const rows = response?.data ?? response;
  if (!Array.isArray(rows)) throw new Error("No se pudo interpretar el catálogo de compañías.");
  return rows.filter((row) => row && Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0 && typeof row.Nombre === "string")
    .map((row, index) => ({ row, index }))
    .sort((a, b) => companyPriority(a.row) - companyPriority(b.row) || a.index - b.index)
    .map(({ row }) => row);
}

export const companyForProduct = (companies, product) => companies.find((company) => String(company.id) === String(product?.CarrierID));

export function retryAfterTime(error, now = Date.now()) {
  if (error.response?.status !== 429) return 0;
  const seconds = Number(error.response.headers?.["retry-after"]);
  return now + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60000);
}
