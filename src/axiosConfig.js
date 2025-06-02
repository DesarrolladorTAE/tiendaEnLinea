import axios from 'axios';
import Swal from 'sweetalert2';

let sessionAlertActive = false;

const axiosInstance = axios.create({
  baseURL: 'https://telorecargo.com/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ⬇️ Interceptor de REQUEST - agrega token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const IGNORE_401_URLS = [
  '/login',
  '/register',
  '/auth/reset-password/send-code',
  '/auth/reset-password',
  '/auth/send-code',
  '/auth/resend-code',
  '/auth/verify-code',
  '/pos/login',
  '/agent/login',
  // '/usuario/token', // Solo si aplica (puedes agregarlo o no)
];


// ⬇️ Interceptor de RESPONSE - maneja expiración de sesión
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Detecta si el error es 401 y la url NO está en la lista de excepciones
    const url = error.config?.url || '';
    const isIgnored = IGNORE_401_URLS.some(endpoint => url.endsWith(endpoint));

    if (error.response?.status === 401 && !isIgnored && !sessionAlertActive) {
      sessionAlertActive = true;
      await Swal.fire({
        icon: 'info',
        title: 'Sesión expirada',
        text: 'Tu sesión ha caducado.',
        confirmButtonText: 'Iniciar sesión nuevamente',
        confirmButtonColor: '#3085d6',
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionAlertActive = false;
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;