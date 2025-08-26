import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://mitiendaenlineamx.com.mx/api/",
  headers: { Accept: "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;

    // ✅ SOLO usamos la bandera interna (no header)
    const skipAuthRedirect = err?.config?.__skipAuthRedirect === true;

    // URLs de flujo de auth que no deben redirigir
    const url = (err?.config?.url || "").toString();
    const isAuthFlow =
      url.includes("/login-store") ||
      url.includes("/registro/enviar-codigo") ||
      url.includes("/registro/verificar");

    if (status === 403 && data?.access_valid === false && !skipAuthRedirect && !isAuthFlow) {
      window.location.href = "/renovar";
    }

    if (status === 401 && !skipAuthRedirect && !isAuthFlow) {
      window.location.href = "/login-register";
    }

    return Promise.reject(err);
  }
);

export default axiosClient;
