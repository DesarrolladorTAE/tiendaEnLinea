import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axiosConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { useForm } from "react-hook-form";
import AuthModal from "../../wrappers/AuthVerification/AuthModals";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";

const LoginOverlay = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [activeForm, setActiveForm] = useState("login");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);

  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [backendFieldErrors, setBackendFieldErrors] = useState({});

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState(null);
  const [currentPhoneToVerify, setCurrentPhoneToVerify] = useState("");

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState(null);
  const [resetPhone, setResetPhone] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      if (isNowMobile) {
        setRightPanelActive(false); // desactiva animación
      }
    };

    handleResize(); // Inicial
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("login", {
        phone: loginPhone,
        password: loginPassword,
      });
      const { token, user } = response.data;
      dispatch(setUser({ user, token }));
      navigate("/home-fashion-three");
    } catch (error) {
      setLoginError(
        error.response?.data?.message || "Error en el inicio de sesión"
      );
    }
  };

  const handleRegister = async (data) => {
    try {
      await axios.post("auth/send-code", { phone: data.phone });
      setCurrentPhoneToVerify(data.phone);
      setIsVerificationModalOpen(true);
      setRegisterSuccess(null);
      setRegisterError(null);
      setBackendFieldErrors({});
    } catch (error) {
      const res = error.response;
      const fieldErrors = {};
      if (res?.data?.errors) {
        if (res.data.errors.email) fieldErrors.email = res.data.errors.email[0];
        if (res.data.errors.phone) fieldErrors.phone = res.data.errors.phone[0];
        if (res.data.errors.password)
          fieldErrors.password = res.data.errors.password[0];
        setBackendFieldErrors(fieldErrors);
      } else {
        setRegisterError(res?.data?.message || "Error en el registro");
      }
    }
  };

  const handleRegisterAfterVerification = async () => {
    const formData = getValues();
    try {
      await axios.post("/register", {
        ...formData,
        code: verificationCode,
      });
      setIsVerificationModalOpen(false);
      setRegisterSuccess(
        "Cuenta creada exitosamente. Ahora puedes iniciar sesión."
      );
      reset();
      setRightPanelActive(false);
    } catch (error) {
      setVerificationError(
        error.response?.data?.message || "Error al crear cuenta."
      );
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/auth/verify-code", {
        phone: currentPhoneToVerify,
        code: verificationCode,
      });
      await handleRegisterAfterVerification();
    } catch (error) {
      setVerificationError(
        error.response?.data?.error || "Código inválido o expirado"
      );
    }
  };

  const handleSendResetCode = async () => {
    try {
      await axios.post("auth/reset-password/send-code", { phone: loginPhone });
      setResetPhone(loginPhone);
      setIsResetModalOpen(true);
      setResetError(null);
    } catch (error) {
      setResetError(error.response?.data?.message || "Error al enviar código");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError("Las contraseñas no coinciden");
      return;
    }
    try {
      await axios.post("/auth/reset-password", {
        phone: resetPhone,
        code: resetCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setIsResetModalOpen(false);
      alert("Contraseña actualizada exitosamente.");
    } catch (error) {
      setResetError(
        error.response?.data?.message || "Error al cambiar contraseña"
      );
    }
  };

  const scrollToForm = (ref) => {
    if (ref.current && isMobile) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="login-container">
      <div
        className={`container ${
          !isMobile && rightPanelActive ? "right-panel-active" : ""
        }`}
      >
        {/* Registro */}
        <div
          className={`form-container sign-up-container ${
            isMobile
              ? activeForm === "register"
                ? "show-mobile-form"
                : "hide-mobile-form"
              : ""
          }`}
          ref={registerFormRef}
        >
          <form onSubmit={handleSubmit(handleRegister)}>
            <h1>Crea tu Cuenta</h1>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Nombre"
                {...register("name", { required: "Nombre requerido" })}
              />
              {errors.name && (
                <p className="error-message">{errors.name.message}</p>
              )}
              <input
                type="text"
                placeholder="Apellidos"
                {...register("apellidos", { required: "Apellidos requeridos" })}
              />
              {errors.apellidos && (
                <p className="error-message">{errors.apellidos.message}</p>
              )}
              <input
                type="email"
                placeholder="Correo electrónico"
                {...register("email", {
                  required: "Email requerido",
                  pattern: { value: /^\S+@\S+$/i, message: "Email no válido" },
                })}
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
              {backendFieldErrors.email && (
                <p className="error-message">{backendFieldErrors.email}</p>
              )}
              <input
                type="tel"
                placeholder="Teléfono"
                {...register("phone", {
                  required: "Teléfono requerido",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Debe contener 10 dígitos",
                  },
                })}
              />
              {errors.phone && (
                <p className="error-message">{errors.phone.message}</p>
              )}
              {backendFieldErrors.phone && (
                <p className="error-message">{backendFieldErrors.phone}</p>
              )}
              <input
                type="password"
                placeholder="Contraseña"
                {...register("password", {
                  required: "Contraseña requerida",
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                })}
              />
              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
              {backendFieldErrors.password && (
                <p className="error-message">{backendFieldErrors.password}</p>
              )}
              <input
                type="password"
                placeholder="Confirmar Contraseña"
                {...register("password_confirmation", {
                  required: "Confirmación requerida",
                  validate: (value) =>
                    value === password || "Las contraseñas no coinciden",
                })}
              />
              {errors.password_confirmation && (
                <p className="error-message">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>
            <button className="btn-lila">Registrarme</button>
            {registerError && <p className="error-message">{registerError}</p>}
            {registerSuccess && (
              <p className="success-message">{registerSuccess}</p>
            )}
          </form>
        </div>

        {/* Login */}
        <div
          className={`form-container sign-in-container ${
            isMobile
              ? activeForm === "login"
                ? "show-mobile-form"
                : "hide-mobile-form"
              : ""
          }`}
          ref={loginFormRef}
        > 
          <form onSubmit={handleLogin}>
            <h1>Iniciar Sesión</h1>
            <input
              type="tel"
              name="phone"
              placeholder="Teléfono"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-turquesa">
              Iniciar Sesión
            </button>
            {loginError && <p className="error-message">{loginError}</p>}
            <div className="forgot-password-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSendResetCode();
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </div>

        {/* Overlay solo si NO es móvil */}
        {!isMobile && (
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>¡Bienvenido!</h1>
                <p>Inicia sesión con tu cuenta</p>
                <button
                  className="ghost ghost-turquesa"
                  onClick={() => setRightPanelActive(false)}
                >
                  Inicia sesión
                </button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hola!</h1>
                <p>Crea tu cuenta para comenzar tu experiencia</p>
                <button
                  className="ghost"
                  onClick={() => setRightPanelActive(true)}
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Switch de formularios solo si ES móvil */}
        {isMobile && (
          <div className="switch-mobile">
            <button
              className={`ghost ghost-turquesa ${
                activeForm === "login" ? "active" : ""
              }`}
              onClick={() => {
                setActiveForm("login");
                scrollToForm(loginFormRef);
              }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`ghost ghost-lila ${
                activeForm === "register" ? "active" : ""
              }`}
              onClick={() => {
                setActiveForm("register");
                scrollToForm(registerFormRef);
              }}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Modals */}
        <AuthModal
          isOpen={isVerificationModalOpen}
          type="verify"
          onSubmit={handleVerifyCodeSubmit}
          phone={currentPhoneToVerify}
          code={verificationCode}
          setCode={setVerificationCode}
          error={verificationError}
        />

        <ResetPasswordModal
          isOpen={isResetModalOpen}
          phone={resetPhone}
          code={resetCode}
          setCode={setResetCode}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onSubmit={handleResetPasswordSubmit}
          error={resetError}
        />
      </div>
    </div>
  );
};

export default LoginOverlay;
