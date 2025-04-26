// src/axiosConfig.js
import axios from 'axios';



const axiosInstance = axios.create({
  baseURL: 'https://telorecargo.com/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No se encontró token al hacer request");
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// axiosInstance.interceptors.request.use((config) => {
//   if (typeof window !== 'undefined') {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

export default axiosInstance;

