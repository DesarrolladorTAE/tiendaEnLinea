import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://mitiendaenlineamx.com.mx/api/",
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;

    if (status === 403 && data?.access_valid === false) {
      // ⚠️ Redirigir a una pantalla de renovación
      // alert("Tu acceso ha expirado. Serás redirigido para renovarlo.");
      window.location.href = "/renovar";
    }

    if (status === 401) {
      // ⚠️ Token inválido o no autenticado
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default axiosClient;
