import axios from "axios";
import { apiBase, requireIsolatedApi } from "./apiEnvironment";

const axiosSuperadmin = axios.create({
  baseURL: apiBase,
  headers: {
    Accept: "application/json",
  },
});

axiosSuperadmin.interceptors.request.use((config) => {
  requireIsolatedApi(config);
  const token = sessionStorage.getItem("SUPERADMIN_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosSuperadmin.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      // Redirige a login de panel si el token del superadmin expira
      window.location.href = "/panel";
    }

    return Promise.reject(err);
  }
);

export default axiosSuperadmin;
