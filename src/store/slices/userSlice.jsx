import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  sessionLoaded: false, // 🔄 NUEVO
  notificaciones: [] // ✅ nuevo estado
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      const { user, token } = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      }
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.notificaciones = [];
    },
    loadUserFromStorage(state) {
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
          if (storedUser && storedToken) {
            state.user = JSON.parse(storedUser);
            state.token = storedToken;
            state.isAuthenticated = true;
          }
        } catch (error) {
          console.error("Error al cargar user/token desde localStorage", error);
        }
      }
      state.sessionLoaded = true; // ✅ Indicar que terminó de cargar
    },
    updateSaldo(state, action) {
      const nuevoSaldo = action.payload;
      if (state.user) {
        state.user.saldo = nuevoSaldo;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    },
    setNotificaciones(state, action) {
      state.notificaciones = action.payload;
    },
  },
});

export const {
  setUser,
  clearUser,
  loadUserFromStorage,
  updateSaldo,
  setNotificaciones // ✅ exportar
} = userSlice.actions;


export default userSlice.reducer;
