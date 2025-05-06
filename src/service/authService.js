// services/authService.js
import axios from "../axiosConfig";

const login = async (phone, password) => {
  const res = await axios.post("login", { phone, password });
  return res.data;
};

const sendRegisterCode = (phone) => axios.post("auth/send-code", { phone });
const verifyCode = (phone, code) => axios.post("auth/verify-code", { phone, code });
const register = (data) => axios.post("/register", data);
const sendResetCode = (phone) => axios.post("auth/reset-password/send-code", { phone });
const resetPassword = (data) => axios.post("/auth/reset-password", data);

export default {
  login,
  sendRegisterCode,
  verifyCode,
  register,
  sendResetCode,
  resetPassword
};
