import { beginViewRequest } from './utils/viewRequests.mjs';
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
    if ((config.method || 'get').toLowerCase() === 'get' && config.viewLoading !== false) config.finishViewRequest = beginViewRequest();
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
  (response) => { response.config?.finishViewRequest?.(); return response; },
  (error) => {
    error.config?.finishViewRequest?.();
    // Detecta si el error es 401 y la url NO está en la lista de excepciones
    const url = error.config?.url || '';
    const isIgnored = IGNORE_401_URLS.some(endpoint => url.endsWith(endpoint));

    if (error.response?.status === 401 && !isIgnored && !sessionAlertActive) {
      sessionAlertActive = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const redirectToLogin = () => window.location.replace("/iniciar-sesion");
      // No retener la petición mientras el usuario responde al aviso.
      // El cargador usa z-index 1300 y los diálogos MUI pueden usar 1500.
      try {
        Promise.resolve(Swal.fire({
        icon: 'info',
        title: 'Sesión expirada',
        text: 'Tu sesión ha caducado.',
        confirmButtonText: 'Iniciar sesión nuevamente',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          const container = Swal.getContainer();
          if (container) container.style.zIndex = '20000';
        },
        })).then(redirectToLogin, redirectToLogin);
      } catch {
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
