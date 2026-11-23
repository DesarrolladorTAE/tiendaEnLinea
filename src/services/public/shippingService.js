import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "https://mitiendaenlineamx.com.mx/api").replace(/\/$/, "");
// Separate client: public requests never inherit the private axiosClient token.
const client = axios.create({ baseURL: API_BASE, timeout: 15000, headers: { Accept: "application/json" } });

export const getPublicShipment = (code, signal) => client.get(`/public/shipments/${encodeURIComponent(code)}`, { signal });
export const getPublicShippingConfig = (branchId, signal) => client.get(`/public/branches/${encodeURIComponent(branchId)}/shipping-config`, { signal });
