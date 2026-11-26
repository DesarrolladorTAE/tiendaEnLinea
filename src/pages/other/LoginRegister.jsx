// src/pages/other/LoginRegister.jsx
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHome, FiArrowLeft, FiMonitor } from "react-icons/fi";
import LandingSeo from "../home/LandingSeo";
import CompanyCertificate from "../../components/login/CompanyCertificate";
import LoginBanner, { useLoginBanner } from "../../components/login/LoginBanner";
import axiosClient from "../../config/axiosClient";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";
import { Modal, Box, Typography, TextField, Button, InputAdornment } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PasswordResetModal from "../../components/login/PasswordResetModal";
import { showError, showSuccess } from "../../utils/alerts";
import "./LoginRegister.motion.css";

const LoginRegister = () => {
  const navigate = useNavigate();
  const [modo, setModo] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register"
      : "login",
  );

  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [registerData, setRegisterData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    password_confirmation: "",
    referral: "", // código de referido (4 dígitos)
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [registerBlocked, setRegisterBlocked] = useState(false);
  const [showStoreLoginModal, setShowStoreLoginModal] = useState(false);
  const [storeLogin, setStoreLogin] = useState({ login: "", password: "" });
  const [showResetModal, setShowResetModal] = useState(false);

  const pressTimerRef = useRef(null);

  // referencia para hacer scroll al formulario de registro
  const registerFormRef = useRef(null);

  const banner = useLoginBanner(modo);

  // detectar ?ref o ?promo y pasar directo a registro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("promo");
    if (ref) {
      setModo("register");
      setRegisterData((prev) => ({ ...prev, referral: String(ref).trim() }));
      setTimeout(() => {
        registerFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 250);
    }
  }, []);

  /* ========= Login ========= */
  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await axiosClient.post(
        "/login-store",
        { login: loginData.login, password: loginData.password },
        { __skipAuthRedirect: true },
      );
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      localStorage.setItem("STORE_SLUG", res.data.store.slug);
      navigate("/admin/sucursales", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === "MTELMX_API_NOT_CONFIGURED" ? err.message :
          err.response?.status === 401 ? "Credenciales inválidas" :
          err.response ? "No se pudo iniciar sesión." : "No se pudo conectar con la API.");
      await showError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ========= Registro DIRECTO (sin verificación) ========= */
  const handleRegister = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || registerBlocked) return;

    setLoading(true);
    setErrors({});
    setRegisterBlocked(true);
    setTimeout(() => setRegisterBlocked(false), 15000);

    try {
      const cleanRef = (registerData.referral || "")
        .replace(/\D/g, "")
        .slice(0, 4);

      const payload = {
        name: registerData.nombre,
        email: registerData.email,
        phone_number: registerData.telefono,
        password: registerData.password,
        cod_ref: cleanRef || null, // 👈 lo que espera Laravel ahora
      };

      const res = await axiosClient.post("/registro/enviar-codigo", payload, {
        __skipAuthRedirect: true,
      });

      // Backend nuevo: { message, store, token }
      const { token, store } = res.data;

      localStorage.setItem("AUTH_TOKEN", token);
      if (store?.slug) {
        localStorage.setItem("STORE_SLUG", store.slug);
      }

      await showSuccess("¡Cuenta creada y sesión iniciada! 🎉");
      navigate("/admin/sucursales", { replace: true });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        const flatMsg =
          Object.values(err.response.data.errors || {})
            .flat()
            .join("\n") || "Verifica los campos del formulario.";
        await showError(flatMsg);
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "No fue posible crear tu cuenta.";
        await showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLogin = modo === "login";
  const panelClass =
    `auth-panel ${isLogin ? "grid-login img-left" : "grid-register img-right"} ` +
    (!banner.current ? "no-media" : "");

  return (
    <>
      <LandingSeo pathname="/login-register" />

      <section
        className={`auth-neo ${isLogin ? "is-login" : "is-register"}`}
        style={{ minHeight: "100vh" }}
      >
        <div className="fx fx-blob b1" aria-hidden />
        <div className="fx fx-blob b2" aria-hidden />
        <div className="fx fx-ring r1" aria-hidden />

        <div className="container">
          <div className={panelClass}>
            <LoginBanner {...banner} />

            {/* FORM */}
            <main className="col-form">
              <Link to="/" className="auth-home-link">
                <FiArrowLeft aria-hidden="true" />
                <FiHome aria-hidden="true" />
                <span>Volver al inicio</span>
              </Link>
              {/* CABECERA LOGO + CERTIFICACIÓN */}
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  mb: 3,
                  minHeight: {
                    xs: 0,
                    sm: 100,
                  },
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* LOGO PRINCIPAL */}
                <Box
                  component="img"
                  src="/assets/logoc.png"
                  alt="Logo de la tienda"
                  className="auth-logo"
                  onMouseDown={() => {
                    pressTimerRef.current = setTimeout(
                      () => setShowStoreLoginModal(true),
                      1500,
                    );
                  }}
                  onMouseUp={() => {
                    if (pressTimerRef.current) {
                      clearTimeout(pressTimerRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    if (pressTimerRef.current) {
                      clearTimeout(pressTimerRef.current);
                    }
                  }}
                  onTouchStart={() => {
                    pressTimerRef.current = setTimeout(
                      () => setShowStoreLoginModal(true),
                      1500,
                    );
                  }}
                  onTouchEnd={() => {
                    if (pressTimerRef.current) {
                      clearTimeout(pressTimerRef.current);
                    }
                  }}
                  sx={{
                    width: "100%",
                    maxWidth: {
                      xs: "220px",
                      sm: "260px",
                    },
                    height: "auto",
                    objectFit: "contain",
                    cursor: "pointer",
                    display: "block",
                  }}
                />

                <CompanyCertificate />
              </Box>

              <div className="text-center mb-3">
                <Button
                  className="auth-pos-link"
                  startIcon={<FiMonitor aria-hidden="true" />}
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/prueba/pos")}
                  sx={{
                    borderRadius: "14px",
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.2,
                    mb: 2,
                  }}
                >
                  Cambiar a Punto de Venta
                </Button>
              </div>

              {isLogin ? (
                <>
                  <h1 className="auth-heading">Acceso</h1>
                  <p className="auth-sub">Bienvenido de nuevo</p>

                  <LoginForm
                    loginData={loginData}
                    setLoginData={setLoginData}
                    onSubmit={handleLogin}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword(!showPassword)}
                    loading={loading}
                  />

                  <hr className="auth-hr" />
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      onClick={() => setShowResetModal(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-primary fs-6 p-0"
                      onClick={() => setModo("register")}
                    >
                      Crea una cuenta
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="auth-heading" ref={registerFormRef}>
                    Crear cuenta
                  </h1>
                  <p className="auth-sub">Regístrate en minutos</p>

                  <RegisterForm
                    registerData={registerData}
                    setRegisterData={setRegisterData}
                    errors={errors}
                    onSubmit={handleRegister}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword(!showPassword)}
                    loading={loading}
                    registerBlocked={registerBlocked}
                    promoFromLink={Boolean(registerData.referral)}
                    referralCode={registerData.referral}
                  />

                  <hr className="auth-hr" />
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-primary fs-6 p-0"
                      onClick={() => setModo("login")}
                    >
                      ¿Ya tienes una cuenta?
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* ===== Modales ===== */}
      <PasswordResetModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
      />

      <Modal
        open={showStoreLoginModal}
        keepMounted
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        onClose={(e, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setShowStoreLoginModal(false);
        }}
      >
        <Box
          sx={{
            width: "min(400px, calc(100vw - 32px))",
            p: 4,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            mx: "auto",
            my: "20vh",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Acceso exclusivo para SuperAdmin
          </Typography>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (loading) return;
              setLoading(true);
              try {
                const res = await axiosSuperadmin.post("/admin/login", {
                  email: storeLogin.login,
                  password: storeLogin.password,
                });
                sessionStorage.setItem("SUPERADMIN_TOKEN", res.data.token);
                setShowStoreLoginModal(false);
                await showSuccess("Bienvenido, SuperAdmin 👑");
                navigate("/panel/dashboard");
              } catch (err) {
                await showError("Credenciales de superadmin inválidas");
              } finally {
                setLoading(false);
              }
            }}
          >
            <TextField
              label="Correo o teléfono"
              fullWidth
              margin="dense"
              autoComplete="username"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineRoundedIcon /></InputAdornment> } }}
              value={storeLogin.login}
              onChange={(e) =>
                setStoreLogin({ ...storeLogin, login: e.target.value })
              }
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="dense"
              autoComplete="current-password"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment> } }}
              value={storeLogin.password}
              onChange={(e) =>
                setStoreLogin({ ...storeLogin, password: e.target.value })
              }
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Ingresar
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default LoginRegister;
