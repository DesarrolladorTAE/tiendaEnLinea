import axios from "axios";

const CACHE_KEY = "login-public-banners-v1";
const CACHE_MS = 5 * 60 * 1000;
let pendingRequest = null;

export function getLoginBanners() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    const age = Date.now() - cached?.timestamp;
    if (age >= 0 && age < CACHE_MS && Array.isArray(cached?.data)) {
      return Promise.resolve(cached.data);
    }
  } catch {
    // Storage may be unavailable; the public request still works.
  }

  if (!pendingRequest) {
    pendingRequest = axios.get("https://mitiendaenlineamx.com.mx/api/admin/publicidad", {
      timeout: 10000,
    }).then(({ data }) => {
      const banners = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(banners)) throw new Error("Respuesta de banners inválida.");
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: banners }));
      } catch {
        // A full or disabled cache must not prevent displaying banners.
      }
      return banners;
    }).finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
}
