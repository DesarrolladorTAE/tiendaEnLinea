import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://mitiendaenlineamx.com.mx/api"
).replace(/\/$/, "");

export const getStorefrontBranches = (storeSlug) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(storeSlug)}/branches`,
  );

export const getStorefrontCapabilities = (storeSlug) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(storeSlug)}/capabilities`,
  );

export const getPublicStorefront = (branchSlug) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(branchSlug)}`,
  );
