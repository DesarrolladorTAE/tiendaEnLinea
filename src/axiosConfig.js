// src/axiosConfig.js
import axios from 'axios';
import Swal from 'sweetalert2';

const axiosInstance = axios.create({
  baseURL: 'https://telorecargo.com/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición para incluir el token
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

// Interceptor de respuesta para detectar token expirado (401)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Mostrar alerta de sesión expirada
      await Swal.fire({
        icon: 'info',
        title: 'Sesión expirada',
        text: 'Tu sesión ha caducado.',
        confirmButtonText: 'Iniciar sesión nuevamente',
        confirmButtonColor: '#3085d6',
      });

      // Limpiar sesión
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirigir al login
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
