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

const API_URL = "https://mitiendaenlineamx.com.mx/api"; // 👈 igual que en tu HeroBox

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

  // ========= NUEVO: Banners (axios puro) =========
  const [slidesLogin, setSlidesLogin] = useState([]);
  const [slidesRegister, setSlidesRegister] = useState([]);
  const [activeLogin, setActiveLogin] = useState(0);
  const [activeRegister, setActiveRegister] = useState(0);
  const tLoginRef = useRef(null);
  const tRegisterRef = useRef(null);
  const INTERVAL_MS = 5000;

  useEffect(() => {
    let mounted = true;
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/publicidad`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const isActive = (b) => (b?.is_active ?? b?.activo ?? true) === true;
        const getUrl = (b) =>
          b?.url || b?.imagen || b?.image_url || b?.path || b?.src || b?.img;
        const textTags = (b) =>
          `${b?.tipo || ""} ${b?.etiqueta || ""} ${b?.tag || ""} ${b?.badge || ""} ${b?.posicion || ""} ${b?.ubicacion || ""}`
            .toLowerCase()
            .trim();
        const listTags = (b) =>
          [...(b?.etiquetas || []), ...(b?.tags || [])]
            .map((x) => String(x || "").toLowerCase());

        const matchTag = (b, target) =>
          textTags(b).includes(target) ||
          listTags(b).some((x) => x.includes(target));

        const toSlide = (b) => ({
          url: getUrl(b),
          titulo: b?.titulo || b?.title || "",
          descripcion: b?.descripcion || b?.description || "",
        });

        const login = arr.filter((b) => isActive(b) && matchTag(b, "login"))
                         .map(toSlide).filter((s) => s.url);
        const register = arr.filter((b) => isActive(b) && matchTag(b, "register"))
                            .map(toSlide).filter((s) => s.url);

        if (mounted) {
          setSlidesLogin(login);
          setSlidesRegister(register);
          setActiveLogin(0);
          setActiveRegister(0);
        }
      } catch (e) {
        console.error("Error cargando banners (axios):", e);
      }
    };
    fetchBanners();
    return () => { mounted = false; };
  }, []);

  // Autoplay login
  useEffect(() => {
    clearInterval(tLoginRef.current);
    if (modo === "login" && slidesLogin.length > 1) {
      tLoginRef.current = setInterval(() => {
        setActiveLogin((p) => (p + 1) % slidesLogin.length);
      }, INTERVAL_MS);
    }
    return () => clearInterval(tLoginRef.current);
  }, [modo, slidesLogin]);

  // Autoplay register
  useEffect(() => {
    clearInterval(tRegisterRef.current);
    if (modo === "register" && slidesRegister.length > 1) {
      tRegisterRef.current = setInterval(() => {
        setActiveRegister((p) => (p + 1) % slidesRegister.length);
      }, INTERVAL_MS);
    }
    return () => clearInterval(tRegisterRef.current);
  }, [modo, slidesRegister]);

  // ========= Helpers =========
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

  // ========= Login =========
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

  // ========= Registro =========
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
      await showSuccess("Te enviamos un código de verificación al correo y/o WhatsApp 📩");
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

  // ========= Slides visibles según modo =========
  const slides = modo === "login" ? slidesLogin : slidesRegister;
  const active = modo === "login" ? activeLogin : activeRegister;
  const setActive = modo === "login" ? setActiveLogin : setActiveRegister;
  const current = slides[active];

  // ========= Orden de grilla (imagen derecha en login, izquierda en register) =========
  const isLogin = modo === "login";
  // En desktop: .grid -> 2 columnas. En mobile colapsa a 1 y respeta el orden DOM.

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
        <div
          className={`auth-panel ${
            isLogin ? "img-left grid-login" : "img-right grid-register"
          }`}
        >
          {/* Columna MEDIA (banner) */}
          <aside className="col-media">
            {current?.url ? (
              <div key={`${modo}-${active}`} className="auth-banner">
                <div className="frame">
                  <img src={current.url} alt={current.titulo || "banner"} />
                </div>

                { (current.titulo || current.descripcion) && (
                  <div className="banner-copy">
                    {current.titulo && <h3>{current.titulo}</h3>}
                    {current.descripcion && <p>{current.descripcion}</p>}
                  </div>
                )}

                {slides.length > 1 && (
                  <div className="auth-banner-dots">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`dot ${i === active ? "active" : ""}`}
                        aria-label={`Ir al banner ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-banner skeleton" />
            )}
          </aside>

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
                  if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                }}
                onMouseLeave={() => {
                  if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                }}
                onTouchStart={() => {
                  pressTimerRef.current = setTimeout(
                    () => setShowStoreLoginModal(true),
                    1500
                  );
                }}
                onTouchEnd={() => {
                  if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
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
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
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
