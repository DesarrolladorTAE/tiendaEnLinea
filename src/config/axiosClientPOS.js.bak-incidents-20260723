import axios from "axios";

const axiosClientPOS = axios.create({
  baseURL: "https://mitiendaenlineamx.com.mx/api/",
  headers: {
    Accept: "application/json",
  },
});

axiosClientPOS.interceptors.request.use((config) => {
  const token = localStorage.getItem("POS_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClientPOS;
