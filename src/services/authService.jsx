// src/services/authService.js

import axiosInstance from '../config/axiosInstance'; // tu archivo de arriba

// --- Login (usuario normal)
export const login = (credentials) => 
  axiosInstance.post('/login', credentials);

// --- Logout (requiere token, solo usuarios autenticados)
export const logout = () =>
  axiosInstance.post('/logout'); // El token lo pone el interceptor

// --- Registro
export const register = (datos) =>
  axiosInstance.post('/register', datos);

// --- Envío de código para reset de contraseña
export const sendResetCode = (phone) =>
  axiosInstance.post('/auth/reset-password/send-code', { phone });

// --- Resetear contraseña
export const resetPassword = (data) =>
  axiosInstance.post('/auth/reset-password', data);

// --- Envío de código de verificación (por teléfono)
export const sendCode = (data) =>
  axiosInstance.post('/auth/send-code', data);

// --- Reenvío de código
export const resendCode = (data) =>
  axiosInstance.post('/auth/resend-code', data);

// --- Validar código recibido
export const verifyCode = (data) =>
  axiosInstance.post('/auth/verify-code', data);

// --- Login de agente POS
export const loginAgentePOS = (data) =>
  axiosInstance.post('/pos/login', data);

// --- Login de agente (otro endpoint)
export const loginAgent = (data) =>
  axiosInstance.post('/agent/login', data);

// --- Token info (solo autenticado)
export const userToken = () =>
  axiosInstance.post('/usuario/token');
