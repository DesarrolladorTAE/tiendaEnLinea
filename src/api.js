// src/api.js
import axiosInstance from './axiosConfig';

export const loginUser = async (credentials) => {
    const response = await axiosInstance.post('/login', credentials);
    return response.data; // Devuelve los datos del usuario
};

// Puedes agregar más funciones para otras peticiones
export const fetchUserData = async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
};

// Función para cerrar sesión
export const logoutUser = async () => {
    const response = await axiosInstance.post('/logout', {}, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}` // Asegúrate de que el token esté almacenado en Local Storage
        }
    });
    return response.data; // Devuelve la respuesta del servidor
};
