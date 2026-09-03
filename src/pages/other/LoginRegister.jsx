// src/pages/other/LoginRegister.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import axios from "axios";
import axiosClient from "../../config/axiosClient";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import PasswordResetModal from "../../components/login/PasswordResetModal";
import { showError, showSuccess } from "../../utils/alerts";
import "./LoginRegister.motion.css";

const API_URL = "https://mitiendaenlineamx.com.mx/api";

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
    referral: "", // código de referido (4 dígitos)
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [registerBlocked, setRegisterBlocked] = useState(false);
  const [showStoreLoginModal, setShowStoreLoginModal] = useState(false);
  const [storeLogin, setStoreLogin] = useState({ login: "", password: "" });
  const [showResetModal, setShowResetModal] = useState(false);

  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const pressTimerRef = useRef(null);

  // referencia para hacer scroll al formulario de registro
  const registerFormRef = useRef(null);

  /* ========= BANNERS ========= */
  const [slidesLogin, setSlidesLogin] = useState([]);
  const [activeLogin, setActiveLogin] = useState(0);
  const [activeRegister, setActiveRegister] = useState(0);

  const tLoginRef = useRef(null);
  const tRegisterRef = useRef(null);

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

  useEffect(() => {
    let mounted = true;

    const urlOf = (b) =>
      b?.url || b?.imagen || b?.image_url || b?.path || b?.src || b?.img;

    const isActive = (b) => (b?.is_active ?? b?.activo ?? true) === true;

    const textTags = (b) =>
      `${b?.tipo || ""} ${b?.etiqueta || ""} ${b?.tag || ""} ${
        b?.badge || ""
      } ${b?.posicion || ""} ${b?.ubicacion || ""}`.toLowerCase();

    const listTags = (b) =>
      [...(b?.etiquetas || []), ...(b?.tags || [])].map((x) =>
        String(x || "").toLowerCase(),
      );

    const hasAny = (b, words) =>
      words.some(
        (w) =>
          textTags(b).includes(w) || listTags(b).some((t) => t.includes(w)),
      );

    (async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/publicidad`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const candidates = arr.filter((b) => isActive(b) && urlOf(b));

        const loginOnly = candidates.filter((b) =>
          hasAny(b, ["login", "signin", "acceso"]),
        );
        const principal = candidates.filter(
          (b) => String(b?.tipo || "").toLowerCase() === "principal",
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

  useEffect(() => {
    if (modo === "login") scheduleLogin(activeLogin);
    return () => clearTimeout(tLoginRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, activeLogin, slidesLogin]);

  useEffect(() => {
    if (modo === "register") scheduleRegister(activeRegister);
    return () => clearTimeout(tRegisterRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, activeRegister, slidesLogin]);

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
        "Credenciales inválidas";
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
  const slides = slidesLogin;
  const active = isLogin ? activeLogin : activeRegister;
  const setActiveIdx = isLogin ? setActiveLogin : setActiveRegister;
  const current = slides[active];
  const hasMedia = Boolean(current?.url);
  const isVid = hasMedia && isVideoUrl(current.url);
  const isImg = hasMedia && isImageUrl(current.url);

  const panelClass =
    `auth-panel ${isLogin ? "grid-login img-left" : "grid-register img-right"} ` +
    (!hasMedia ? "no-media" : "");

  return (
    <>
      <SEO titleTemplate="Login" description="Inicio de sesión y registro" />

      <section
        className={`auth-neo ${isLogin ? "is-login" : "is-register"}`}
        style={{ minHeight: "100vh" }}
      >
        <div className="fx fx-blob b1" aria-hidden />
        <div className="fx fx-blob b2" aria-hidden />
        <div className="fx fx-ring r1" aria-hidden />

        <div className="container">
          <div className={panelClass}>
            {/* MEDIA */}
            {hasMedia ? (
              <aside className="col-media">
                <div key={`${modo}-${active}`} className="auth-banner">
                  <div className="frame">
                    {isImg && (
                      <img
                        src={current.url}
                        alt={current.titulo || "banner"}
                        className="auth-img"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          borderRadius: 12,
                        }}
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

            {/* FORM */}
            <main className="col-form">
              {/* CABECERA LOGO + CERTIFICACIÓN */}
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  mb: 3,
                  minHeight: {
                    xs: 105,
                    sm: 120,
                  },
                  display: "flex",
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

                {/* CERTIFICACIÓN SUPERIOR DERECHA */}
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowCertificateModal(true)}
                  aria-label="Ver certificado de Empresa Guerrerense"
                  sx={{
                    position: "absolute",
                    top: {
                      xs: -10,
                      sm: -25,
                    },
                    right: {
                      xs: -4,
                      sm: 0,
                    },
                    p: 0,
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.7,
                      py: 0.55,
                      px: 0.8,
                      borderRadius: "999px",
                      border: "1px solid rgba(213, 0, 83, 0.20)",
                      bgcolor: "rgba(255,255,255,0.94)",
                      boxShadow: "0 5px 16px rgba(0,0,0,0.09)",
                      backdropFilter: "blur(8px)",
                      transition: "all 0.25s ease",

                      "&:hover": {
                        transform: "translateY(-2px) scale(1.02)",
                        borderColor: "rgba(213, 0, 83, 0.45)",
                        boxShadow: "0 9px 22px rgba(213, 0, 83, 0.14)",
                      },
                    }}
                  >
                    {/* MINIATURA */}
                    <Box
                      sx={{
                        width: {
                          xs: 28,
                          sm: 34,
                        },
                        height: {
                          xs: 28,
                          sm: 34,
                        },
                        borderRadius: "70%",
                        overflow: "hidden",
                        flexShrink: 0,
                        bgcolor: "#fff",
                        border: "1.5px solid #d50053",
                      }}
                    >
                      <Box
                        component="img"
                        src="/assets/images/certificado.png"
                        alt="Empresa Guerrerense Certificada"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "88% 82%",
                          display: "block",
                        }}
                      />
                    </Box>

                    {/* TEXTO */}
                    <Box
                      sx={{
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: {
                            xs: "0.48rem",
                            sm: "0.56rem",
                          },
                          fontWeight: 700,
                          color: "text.secondary",
                          lineHeight: 1,
                          textTransform: "uppercase",
                          letterSpacing: "0.2px",
                        }}
                      >
                        Empresa Guerrerense
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: {
                            xs: "0.6rem",
                            sm: "0.7rem",
                          },
                          fontWeight: 900,
                          color: "#d50053",
                          lineHeight: 1.25,
                        }}
                      >
                        Certificada
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <div className="text-center mb-3">
                <Button
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

      <Modal
        open={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: {
            xs: 1,
            md: 2,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1050,

            // En móvil permitimos que el modal use casi toda la pantalla
            maxHeight: {
              xs: "98vh",
              md: "92vh",
            },

            bgcolor: "background.paper",
            borderRadius: {
              xs: "16px",
              md: "24px",
            },
            boxShadow: 24,
            overflow: "hidden",
            outline: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* CABECERA */}
          <Box
            sx={{
              px: {
                xs: 1.5,
                md: 3,
              },
              py: {
                xs: 1,
                md: 2,
              },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: "0.9rem",
                    md: "1.2rem",
                  },
                  fontWeight: 900,
                  color: "#d50053",
                  lineHeight: 1.2,
                }}
              >
                Empresa Guerrerense Certificada
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.72rem",
                    md: "0.82rem",
                  },
                  color: "text.secondary",
                }}
              >
                Folio 2026-027
              </Typography>
            </Box>

            <Button
              type="button"
              onClick={() => setShowCertificateModal(false)}
              sx={{
                minWidth: "auto",
                px: {
                  xs: 1,
                  md: 2,
                },
                fontSize: {
                  xs: "0.75rem",
                  md: "0.875rem",
                },
                textTransform: "none",
                fontWeight: 800,
              }}
            >
              Cerrar
            </Button>
          </Box>

          {/* CONTENIDO */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* INFORMACIÓN DE CERTIFICACIÓN */}
            <Box
              sx={{
                px: {
                  xs: 2,
                  md: 5,
                },
                pt: {
                  xs: 1.5,
                  md: 2.5,
                },
                pb: {
                  xs: 1.5,
                  md: 2.5,
                },
                flexShrink: 0,
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "0.88rem",
                    md: "1.15rem",
                  },
                  fontWeight: 900,
                  color: "text.primary",
                  mb: 0.8,
                  lineHeight: 1.25,
                }}
              >
                Tecnologías Administrativas Elad, S. de R.L. de C.V.
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.76rem",
                    md: "0.9rem",
                  },
                  fontWeight: 700,
                  color: "#d50053",
                  mb: {
                    xs: 0.8,
                    md: 1.2,
                  },
                  lineHeight: 1.4,
                }}
              >
                🏢 Consultoría Tecnológica Certificada
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.72rem",
                    md: "0.88rem",
                  },
                  lineHeight: 1.5,
                  color: "text.secondary",
                  mb: 0.7,
                }}
              >
                📜 Certificado de Empresa Guerrerense | Folio: 2026-027
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.7rem",
                    md: "0.88rem",
                  },
                  lineHeight: 1.5,
                  color: "text.secondary",
                }}
              >
                ⚖️ Avalado por la Secretaría de Fomento y Desarrollo Económico
                conforme a la Ley de Fomento Económico, Inversión y Desarrollo
                del Estado de Guerrero.
              </Typography>
            </Box>

            {/* SEPARADOR */}
            <Box
              sx={{
                mx: {
                  xs: 2,
                  md: 5,
                },
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            />

            {/* CERTIFICADO */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,

                px: {
                  xs: 1.5,
                  md: 5,
                },
                pt: {
                  xs: 1.5,
                  md: 2.5,
                },
                pb: {
                  xs: 1.5,
                  md: 3,
                },

                bgcolor: "#f7f8fa",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src="/assets/images/certificado.png"
                alt="Certificado de Empresa Guerrerense"
                sx={{
                  display: "block",

                  width: {
                    xs: "100%",
                    md: "82%",
                  },

                  maxWidth: "820px",

                  height: "auto",

                  maxHeight: {
                    xs: "45vh",
                    md: "48vh",
                  },

                  objectFit: "contain",

                  borderRadius: {
                    xs: "10px",
                    md: "14px",
                  },

                  boxShadow: "0 10px 30px rgba(0,0,0,0.14)",

                  bgcolor: "#fff",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default LoginRegister;
