import axios from "axios";

// Public requests must never inherit the panel's token or incident logging.
const api = axios.create({ headers: { Accept: "application/json" }, withCredentials: false });
const base = (import.meta.env.VITE_PUBLIC_SALES_API_URL || import.meta.env.VITE_API_URL || "https://mitiendaenlineamx.com.mx/api").replace(/\/$/, "");

export const searchCustomerSales = (slug, body) => api.post(`${base}/public/tiendas/${encodeURIComponent(slug)}/compras/buscar`, body);
export const submitCustomerInvoice = (signedUrl, body) => api.post(signedUrl, body);

export function customerSalesError(error) {
  const status = error.response?.status;
  if (status === 403) return "El enlace venció o la autofacturación no está disponible. Repite la búsqueda para actualizar los enlaces.";
  if (status === 409) return "Esta venta ya se está facturando. Espera un momento y vuelve a consultar tus compras.";
  if (status === 429) return "Has realizado demasiadas solicitudes. Espera un minuto antes de intentar de nuevo.";
  if (status === 404) return "La tienda, compra o comprobante ya no está disponible.";
  const data = error.response?.data;
  return Object.values(data?.errors || {}).flat().join(" ") || data?.message || "No se pudo completar la solicitud. Intenta nuevamente.";
}
