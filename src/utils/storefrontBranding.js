export const asStorefrontObject = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
};

export const storefrontAssetUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const clean = value.trim().replace(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i, "$1");
  try {
    const origin = new URL(import.meta.env.VITE_API_URL || "https://mitiendaenlineamx.com.mx/api").origin;
    const url = new URL(clean, `${origin}/`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};

export const getStorefrontBrand = (payload = {}) => {
  const site = asStorefrontObject(payload.sitio || payload.site);
  const branding = asStorefrontObject(site.branding);
  const store = payload.store || {};
  const identity = asStorefrontObject(site.identity);
  return {
    name: store.name || identity.title || site.titulo_1 || "Tienda",
    logo: storefrontAssetUrl(branding.logo || site.logo || payload.logo || store.logo),
  };
};

export const readStorefrontBrand = (slug, branch = "") => {
  try {
    const initial = JSON.parse(document.getElementById("storefront-brand")?.textContent || "null");
    if (initial?.slug === slug && initial.branch === branch) return initial;
  } catch { /* The static build has no server-provided branding. */ }
  try { return JSON.parse(sessionStorage.getItem(`storefront-brand:${slug}:${branch}`) || "null"); }
  catch { return null; }
};

export const rememberStorefrontBrand = (slug, branch, payload) => {
  const brand = getStorefrontBrand(payload);
  try { sessionStorage.setItem(`storefront-brand:${slug}:${branch || ""}`, JSON.stringify(brand)); }
  catch { /* Storage may be disabled. */ }
  return brand;
};
