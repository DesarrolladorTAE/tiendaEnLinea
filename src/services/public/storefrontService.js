import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://mitiendaenlineamx.com.mx/api"
).replace(/\/$/, "");

export const getStorefrontBranches = (storeSlug, config = {}) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(storeSlug)}/branches`,
    config,
  );

export const getStorefrontCapabilities = (storeSlug) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(storeSlug)}/capabilities`,
  );

export const getPublicStorefront = (branchSlug, config = {}) =>
  axios.get(
    `${API_BASE}/public/storefront/${encodeURIComponent(branchSlug)}`,
    config,
  );

export const getPublicStoreProducts = (storeSlug) =>
  axios.get(`${API_BASE}/tienda/${encodeURIComponent(storeSlug)}/products`);
