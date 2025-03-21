import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
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
    },
  },
});

export const { setUser, clearUser, loadUserFromStorage } = userSlice.actions;
export default userSlice.reducer;
