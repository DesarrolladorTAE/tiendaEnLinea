import axios from "axios";

// Dedicated clients: never send credentials, phone numbers or signed quotes to
// the panel's automatic incident reporter. Only MiTiendaEnLinea is contacted.
const baseURL = (import.meta.env.VITE_API_URL || "https://mitiendaenlineamx.com.mx/api").replace(/\/$/, "");
const client = (storageKey) => {
  const api = axios.create({ baseURL, timeout: 30000, headers: { Accept: "application/json" } });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(storageKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return api;
};
const store = client("AUTH_TOKEN");
const pos = client("POS_TOKEN");
const adminPath = "/integraciones/telorecargo";
const posPath = "/pos/telorecargo";
const unwrap = async (request) => (await request).data;

export const telorecargoStore = {
  config: () => unwrap(store.get(adminPath)),
  credential: (token) => unwrap(store.put(adminPath, { token })),
  disconnect: () => unwrap(store.delete(adminPath)),
  commission: (comision) => unwrap(store.put(`${adminPath}/comision`, { comision })),
  history: (params) => unwrap(store.get(`${adminPath}/operaciones`, { params })),
  report: (params) => unwrap(store.get(`${adminPath}/reporte`, { params })),
  reconcile: (id, external_id) => unwrap(store.post(`${adminPath}/recargas/${id}/conciliar`, { external_id })),
  resolvePayment: (id, resolucion, nota) => unwrap(store.post(`${adminPath}/recargas/${id}/resolver-cobro`, { resolucion, nota })),
};
export const telorecargoPOS = {
  state: () => unwrap(pos.get(`${posPath}/estado`)),
  balance: () => unwrap(pos.get(`${posPath}/saldo`)),
  companies: () => unwrap(pos.get(`${posPath}/companias`)),
  products: (params) => unwrap(pos.get(`${posPath}/productos`, { params })),
  quote: (producto) => unwrap(pos.post(`${posPath}/cotizaciones`, { producto })),
  recharge: (draft) => unwrap(pos.post(`${posPath}/recargas`, draft.body, { headers: { "Idempotency-Key": draft.key } })),
  history: (params) => unwrap(pos.get(`${posPath}/recargas`, { params })),
  detail: (id) => unwrap(pos.get(`${posPath}/recargas/${id}`)),
  fundingHistory: (params) => unwrap(pos.get(`${posPath}/solicitudes-saldo`, { params })),
  fundingDetail: (id) => unwrap(pos.get(`${posPath}/solicitudes-saldo/${id}`)),
  funding: (draft) => {
    const body = new FormData();
    body.append("monto", draft.body.monto);
    body.append("referencia", draft.body.referencia);
    body.append("comprobante", draft.file, draft.fileName);
    return unwrap(pos.post(`${posPath}/solicitudes-saldo`, body, { headers: { "Idempotency-Key": draft.key } }));
  },
  // Construct the authenticated local route, never forward a token to a URL
  // supplied by the external provider.
  ticket: async (id) => (await pos.get(`${posPath}/recargas/${id}/ticket.pdf`, { responseType: "blob" })).data,
  workers: (id) => unwrap(pos.get("/workers/simple-by-pos", { params: { pos_location_id: id } })),
  customers: (id) => unwrap(pos.get("/clientes/simple", { params: { pos_location_id: id } })),
};

export async function downloadRechargeTicket(id) {
  const blob = await telorecargoPOS.ticket(id);
  if (!(blob instanceof Blob) || !blob.size) throw new Error("El ticket no está disponible.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `recarga-${id}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
