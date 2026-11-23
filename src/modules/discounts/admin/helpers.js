export const discountTypeLabel = (t) => {
  switch (t) {
    case "percentage":
      return "% Descuento";
    case "fixed":
      return "$ Descuento";
    case "special_price":
      return "Precio Especial";
    case "bulk":
      return "Mayoreo (tiers)";
    case "bxgy":
      return "2x1 / 3x2 (BxGy)";
    case "combo":
      return "Combo";
    default:
      return t || "-";
  }
};

export const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

export function toLocalInput(dt) {
  if (!dt) return "";
  return String(dt).slice(0, 16);
}

export function normalizeListResponse(res) {
  const d = res?.data;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  if (Array.isArray(d)) return d;
  return [];
}

export function imageUrlMaybe(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `/storage/${path}`;
}