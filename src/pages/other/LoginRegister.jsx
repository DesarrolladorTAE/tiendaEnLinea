// src/pages/other/LoginRegister.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import axios from "axios"; // 👈 axios puro SOLO para banners
import axiosClient from "../../config/axiosClient";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import VerificationModal from "../../components/login/VerificationModal";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import PasswordResetModal from "../../components/login/PasswordResetModal";
import { showError, showSuccess } from "../../utils/alerts";
import "./LoginRegister.motion.css"; // 👈 CSS separado

const API_URL = "https://mitiendaenlineamx.com.mx/api";

// Helpers para media
const getExt = (u = "") => {
  try {
    const clean = u.split("?")[0].split("#")[0];
    return clean.substring(clean.lastIndexOf(".") + 1).toLowerCase();
  } catch {
    return "";
  }
};
const isImageUrl = (u) =>
  ["png", "jpg", "jpeg", "gif", "webp", "avif"].includes(getExt(u));
const isVideoUrl = (u) => ["mp4", "webm", "ogg"].includes(getExt(u));

// Duraciones (solo videos a 15s; imágenes normales a 5s)
const IMAGE_MS = 5000;
const VIDEO_MS = 15000;

const LoginRegister = () => {
  const navigate = useNavigate();
  const [modo, setModo] = useState("login");

  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [registerData, setRegisterData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    password_confirmation: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendDisabled, setResendDisabled] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [registerBlocked, setRegisterBlocked] = useState(false);
  const [showStoreLoginModal, setShowStoreLoginModal] = useState(false);
  const [storeLogin, setStoreLogin] = useState({ login: "", password: "" });
  const [showResetModal, setShowResetModal] = useState(false);

  // ⏲️ Long-press del logo
  const pressTimerRef = useRef(null);

  /* ========= BANNERS (SOLO LOGIN PARA AMBOS) ========= */
  const [slidesLogin, setSlidesLogin] = useState([]);
  const [activeLogin, setActiveLogin] = useState(0);
  const [activeRegister, setActiveRegister] = useState(0);

  // Timers por modo (timeouts dependientes del tipo de slide)
  const tLoginRef = useRef(null);
  const tRegisterRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const urlOf = (b) =>
      b?.url || b?.imagen || b?.image_url || b?.path || b?.src || b?.img;

    const isActive = (b) => (b?.is_active ?? b?.activo ?? true) === true;

    const textTags = (b) =>
      `${b?.tipo || ""} ${b?.etiqueta || ""} ${b?.tag || ""} ${b?.badge || ""} ${b?.posicion || ""} ${b?.ubicacion || ""}`.toLowerCase();

    const listTags = (b) =>
      [...(b?.etiquetas || []), ...(b?.tags || [])].map((x) =>
        String(x || "").toLowerCase()
      );

    const hasAny = (b, words) =>
      words.some(
        (w) => textTags(b).includes(w) || listTags(b).some((t) => t.includes(w))
      );

    (async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/publicidad`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const candidates = arr.filter((b) => isActive(b) && urlOf(b));

        // Preferimos banners etiquetados para login; si no, "Principal"; si no, cualquiera activo
        const loginOnly = candidates.filter((b) =>
          hasAny(b, ["login", "signin", "acceso"])
        );
        const principal = candidates.filter(
          (b) => String(b?.tipo || "").toLowerCase() === "principal"
        );

        const pool =
          loginOnly.length > 0
            ? loginOnly
            : principal.length > 0
            ? principal
            : candidates;

        const slides = pool.map((b) => ({
          url: urlOf(b),
          titulo: b?.titulo || b?.title || "",
          descripcion: b?.descripcion || b?.description || "",
        }));

        if (mounted) {
          setSlidesLogin(slides);
          setActiveLogin(0);
          setActiveRegister(0);
        }
      } catch (e) {
        console.error("Error cargando banners (login):", e);
        if (mounted) setSlidesLogin([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Helpers de programación por modo
  const scheduleLogin = (idx) => {
    clearTimeout(tLoginRef.current);
    if (modo !== "login" || slidesLogin.length < 2) return;
    const slide = slidesLogin[idx];
    const dur = slide && isVideoUrl(slide.url) ? VIDEO_MS : IMAGE_MS;
    tLoginRef.current = setTimeout(() => {
      setActiveLogin((p) => (p + 1) % slidesLogin.length);
    }, dur);
  };

  const scheduleRegister = (idx) => {
    clearTimeout(tRegisterRef.current);
    if (modo !== "register" || slidesLogin.length < 2) return;
    const slide = slidesLogin[idx];
    const dur = slide && isVideoUrl(slide.url) ? VIDEO_MS : IMAGE_MS;
    tRegisterRef.current = setTimeout(() => {
      setActiveRegister((p) => (p + 1) % slidesLogin.length);
    }, dur);
  };

  // Programar avance cuando cambia modo o índice (LOGIN)
  useEffect(() => {
    if (modo === "login") scheduleLogin(activeLogin);
    return () => clearTimeout(tLoginRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, activeLogin, slidesLogin]);

  // Programar avance cuando cambia modo o índice (REGISTER)
  useEffect(() => {
    if (modo === "register") scheduleRegister(activeRegister);
    return () => clearTimeout(tRegisterRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, activeRegister, slidesLogin]);

  /* ========= Helpers ========= */
  const startCooldown = () => {
    let seconds = 60;
    setCooldown(seconds);
    setResendDisabled(true);
    const interval = setInterval(() => {
      seconds -= 1;
      setCooldown(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        setResendDisabled(false);
      }
    }, 1000);
  };

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
        { __skipAuthRedirect: true }
      );
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      localStorage.setItem("STORE_SLUG", res.data.store.slug);
      navigate("/admin");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales inválidas";
      await showError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ========= Registro ========= */
  const handleRegister = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || registerBlocked) return;

    setLoading(true);
    setErrors({});
    setRegisterBlocked(true);
    setTimeout(() => setRegisterBlocked(false), 15000);

    try {
      const payload = {
        name: registerData.nombre,
        email: registerData.email,
        phone_number: registerData.telefono,
        password: registerData.password,
      };

      await axiosClient.post("/registro/enviar-codigo", payload, {
        __skipAuthRedirect: true,
      });
      setShowModal(true);
      startCooldown();
      await showSuccess(
        "Te enviamos un código de verificación al correo y/o WhatsApp 📩"
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        const flatMsg =
          Object.values(err.response.data.errors || {}).flat().join("\n") ||
          "Verifica los campos del formulario.";
        await showError(flatMsg);
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "No fue posible enviar el código de verificación.";
        await showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitResendCode = async () => {
    if (resendDisabled) return;
    try {
      const payload = {
        name: registerData.nombre,
        email: registerData.email,
        phone_number: registerData.telefono,
        password: registerData.password,
      };
      await axiosClient.post("/registro/enviar-codigo", payload, {
        __skipAuthRedirect: true,
      });
      startCooldown();
      await showSuccess("Código reenviado ✅");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "No fue posible reenviar el código.";
      await showError(msg);
    }
  };

  const handleVerificationCodeSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axiosClient.post(
        "/registro/verificar",
        { email: registerData.email, code: verificationCode },
        { __skipAuthRedirect: true, headers: { "x-skip-auth-redirect": "1" } }
      );
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      setShowModal(false);
      await showSuccess("¡Cuenta verificada y creada! 🎉");
      navigate("/admin");
    } catch (err) {
      const msg = err.response?.data?.message || "Código inválido o expirado";
      await showError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ========= Slides visibles y layout ========= */
  const isLogin = modo === "login";
  const slides = slidesLogin; // 👉 mismos banners para ambos
  const active = isLogin ? activeLogin : activeRegister;
  const setActiveIdx = isLogin ? setActiveLogin : setActiveRegister;
  const current = slides[active];
  const hasMedia = Boolean(current?.url);
  const isVid = hasMedia && isVideoUrl(current.url);
  const isImg = hasMedia && isImageUrl(current.url);

  const panelClass =
    `auth-panel ${isLogin ? "grid-login img-left" : "grid-register img-right"} ` +
    (!hasMedia ? "no-media" : "");

  /* ========= Render ========= */
  return (
    <>
      <SEO titleTemplate="Login" description="Inicio de sesión y registro" />

      <section
        className={`auth-neo ${isLogin ? "is-login" : "is-register"}`}
        style={{ minHeight: "100vh" }}
      >
        {/* Figuras decorativas */}
        <div className="fx fx-blob b1" aria-hidden />
        <div className="fx fx-blob b2" aria-hidden />
        <div className="fx fx-ring r1" aria-hidden />

        {/* ===== Panel grande con dos columnas ===== */}
        <div className="container">
          <div className={panelClass}>
            {/* Columna MEDIA (banner) */}
            {hasMedia ? (
              <aside className="col-media">
                <div key={`${modo}-${active}`} className="auth-banner">
                  <div className="frame">
                    {isImg && (
                      <img
                        src={current.url}
                        alt={current.titulo || "banner"}
                        className="auth-img"
                        style={{ width: "100%", height: "auto", display: "block", borderRadius: 12 }}
                      />
                    )}

                    {isVid && (
                      <video
                        key={current.url}
                        className="auth-video"
                        src={current.url}
                        autoPlay
                        muted
                        playsInline
                        loop={false}
                        controls={false}
                        // Para que se vea “normal” sin agrandar más de lo que permita el frame:
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          borderRadius: 12,
                          background: "#000",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </div>

                  {slides.length > 1 && (
                    <div className="auth-banner-dots">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            // Al cambiar manualmente, reseteamos el timeout del modo actual
                            if (isLogin) {
                              clearTimeout(tLoginRef.current);
                              setActiveIdx(i);
                            } else {
                              clearTimeout(tRegisterRef.current);
                              setActiveIdx(i);
                            }
                          }}
                          className={`dot ${i === active ? "active" : ""}`}
                          aria-label={`Ir al banner ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            ) : null}

            {/* Columna FORM */}
            <main className="col-form">
              <div className="text-center mb-3">
                <img
                  src="/assets/logoc.png"
                  alt="Logo de la tienda"
                  className="img-fluid auth-logo"
                  style={{ maxWidth: "260px", cursor: "pointer" }}
                  onMouseDown={() => {
                    pressTimerRef.current = setTimeout(
                      () => setShowStoreLoginModal(true),
                      1500
                    );
                  }}
                  onMouseUp={() => {
                    if (pressTimerRef.current)
                      clearTimeout(pressTimerRef.current);
                  }}
                  onMouseLeave={() => {
                    if (pressTimerRef.current)
                      clearTimeout(pressTimerRef.current);
                  }}
                  onTouchStart={() => {
                    pressTimerRef.current = setTimeout(
                      () => setShowStoreLoginModal(true),
                      1500
                    );
                  }}
                  onTouchEnd={() => {
                    if (pressTimerRef.current)
                      clearTimeout(pressTimerRef.current);
                  }}
                />
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
                  <h1 className="auth-heading">Crear cuenta</h1>
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
            width: 400,
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

      <VerificationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onVerify={handleVerificationCodeSubmit}
        onSubmitResendCode={onSubmitResendCode}
        code={verificationCode}
        setCode={setVerificationCode}
        loading={loading}
        resendDisabled={resendDisabled}
        cooldown={cooldown}
      />
    </>
  );
};

export default LoginRegister;
