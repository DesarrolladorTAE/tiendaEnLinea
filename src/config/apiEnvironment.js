const productionHost = "mitiendaenlineamx.com.mx";
const productionBase = `https://${productionHost}/api/`;

export const isProductionApiBuild =
  typeof __MTELMX_PRODUCTION__ !== "undefined" && __MTELMX_PRODUCTION__;

export function resolveApiBase(value, production = false) {
  if (production) return productionBase;
  if (!value) return null;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || isProductionHost(url.hostname)) {
    throw new Error("Configura VITE_API_URL con una API aislada sin credenciales.");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "").replace(/\/api$/, "")}/api/`;
  return url.href;
}

function isProductionHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === productionHost || host.endsWith(`.${productionHost}`);
}

export const apiBase = resolveApiBase(
  typeof __MTELMX_API_URL__ === "undefined" ? "" : __MTELMX_API_URL__,
  isProductionApiBuild,
);

export function requireIsolatedApi(config) {
  if (isProductionApiBuild) return;
  if (!apiBase || !config.baseURL) {
    const error = new Error("Configura VITE_API_URL con la URL de la API de desarrollo y reinicia Vite.");
    error.code = "MTELMX_API_NOT_CONFIGURED";
    throw error;
  }
  const target = new URL(config.url, config.baseURL);
  if (target.origin !== new URL(apiBase).origin) {
    throw new Error("La petición está fuera de la API aislada configurada.");
  }
}
