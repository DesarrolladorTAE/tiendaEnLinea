// src/store/slices/userSlice.jsx
import { createSlice } from '@reduxjs/toolkit';
import { FLUSH } from 'redux-persist';

const getUserFromLocalStorage = () => {
    try {
        const user = localStorage.getItem('user');
        console.log("Usuario recuperado de Local Storage:", user); // Agrega este log
        return user ? { user: JSON.parse(user), isAuthenticated: true } : { user: null, isAuthenticated: false }; // Devuelve el estado de autenticación
    } catch (error) {
        console.error("Error al leer el usuario de Local Storage:", error);
        return { user: null, isAuthenticated: false }; // Devuelve null si hay un error
    }
};

const userSlice = createSlice({
    name: 'user',
    initialState: getUserFromLocalStorage(), // Usa la función para obtener el usuario
    reducers: {
        setUser(state, action) {
            localStorage.setItem('user', JSON.stringify(action.payload)); // Guardar en Local Storage
            state.user = action.payload; // Establecer el usuario en el estado
            state.isAuthenticated = true; // Marcar como autenticado
        },
        clearUser(state) {
            localStorage.removeItem('user'); // Limpiar Local Storage
            state.user = null; // Limpiar el usuario
            state.isAuthenticated = false; // Marcar como no autenticado
        },
    },
});

export const { setUser, clearUser } = userSlice.actions; // Exportar las acciones
export default userSlice.reducer; // Exportar el reducer
