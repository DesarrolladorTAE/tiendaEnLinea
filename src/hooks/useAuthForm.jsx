// src/hooks/useAuthForm.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/userSlice";
import authService from "../service/authService";

export const useAuthForm = () => {
  const [states, setStates] = useState({
    loginPhone: "",
    loginPassword: "",
    loginError: null,
    registerError: null,
    registerSuccess: null,
    backendFieldErrors: {},
    isVerificationModalOpen: false,
    verificationCode: "",
    verificationError: null,
    currentPhoneToVerify: "",
    isResetModalOpen: false,
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
    resetError: null,
    resetPhone: "",
    showWelcome: false,
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await authService.login(states.loginPhone, states.loginPassword);
      dispatch(setUser({ user, token }));
      setStates((s) => ({ ...s, showWelcome: true }));

      setTimeout(() => {
        setStates((s) => ({ ...s, showWelcome: false }));
        navigate(user.role === "superadmin" ? "/admin/dashboard" : "/home-fashion-three");
      }, 3000);
    } catch (err) {
      setStates((s) => ({
        ...s,
        loginError: err.response?.data?.message || "Error al iniciar sesión",
      }));
    }
  };

  const handleSendRegisterCode = async (data) => {
    try {
      await authService.sendRegisterCode(data.phone);
      setStates((s) => ({
        ...s,
        currentPhoneToVerify: data.phone,
        isVerificationModalOpen: true,
        registerError: null,
        registerSuccess: null,
        backendFieldErrors: {},
      }));
    } catch (error) {
      const res = error.response;
      const fieldErrors = {};
      if (res?.data?.errors) {
        if (res.data.errors.email) fieldErrors.email = res.data.errors.email[0];
        if (res.data.errors.phone) fieldErrors.phone = res.data.errors.phone[0];
        if (res.data.errors.password) fieldErrors.password = res.data.errors.password[0];
        setStates((s) => ({ ...s, backendFieldErrors: fieldErrors }));
      } else {
        setStates((s) => ({
          ...s,
          registerError: res?.data?.message || "Error en el registro",
        }));
      }
    }
  };

  const handleRegisterAfterVerification = async (formData) => {
    try {
      await authService.register({ ...formData, code: states.verificationCode });
      setStates((s) => ({
        ...s,
        isVerificationModalOpen: false,
        registerSuccess: "Cuenta creada exitosamente. Ahora puedes iniciar sesión.",
      }));
    } catch (error) {
      setStates((s) => ({
        ...s,
        verificationError: error.response?.data?.message || "Error al crear cuenta.",
      }));
    }
  };

  const handleVerifyCodeSubmit = async (e, formData) => {
    e.preventDefault();
    try {
      await authService.verifyCode(states.currentPhoneToVerify, states.verificationCode);
      await handleRegisterAfterVerification(formData);
    } catch (error) {
      setStates((s) => ({
        ...s,
        verificationError: error.response?.data?.error || "Código inválido o expirado",
      }));
    }
  };

  const handleSendResetCode = async () => {
    try {
      await authService.sendResetCode(states.loginPhone);
      setStates((s) => ({
        ...s,
        resetPhone: states.loginPhone,
        isResetModalOpen: true,
        resetError: null,
      }));
    } catch (error) {
      setStates((s) => ({
        ...s,
        resetError: error.response?.data?.message || "Error al enviar código",
      }));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (states.newPassword !== states.confirmPassword) {
      setStates((s) => ({
        ...s,
        resetError: "Las contraseñas no coinciden",
      }));
      return;
    }

    try {
      await authService.resetPassword({
        phone: states.resetPhone,
        code: states.resetCode,
        password: states.newPassword,
        password_confirmation: states.confirmPassword,
      });
      setStates((s) => ({ ...s, isResetModalOpen: false }));
      alert("Contraseña actualizada exitosamente.");
    } catch (error) {
      setStates((s) => ({
        ...s,
        resetError: error.response?.data?.message || "Error al cambiar contraseña",
      }));
    }
  };

  return {
    states,
    setStates,
    handleLogin,
    handleSendRegisterCode,
    handleVerifyCodeSubmit,
    handleSendResetCode,
    handleResetPasswordSubmit,
  };
};
