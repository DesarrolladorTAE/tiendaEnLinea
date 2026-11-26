import axios from "axios";
import { apiBase, requireIsolatedApi } from "./apiEnvironment";

const axiosClientPOS = axios.create({
  baseURL: apiBase,
  headers: {
    Accept: "application/json",
  },
});

axiosClientPOS.interceptors.request.use((config) => {
  requireIsolatedApi(config);
  const token = localStorage.getItem("POS_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClientPOS;
