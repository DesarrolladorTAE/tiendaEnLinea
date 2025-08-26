// src/pages/other/LoginRegister.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import axiosClient from "../../config/axiosClient";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import VerificationModal from "../../components/login/VerificationModal";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import PasswordResetModal from "../../components/login/PasswordResetModal";
import { showError, showSuccess } from "../../utils/alerts";

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

  // ⏱ Cooldown para reenvío de código
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

  // 🟢 Login tienda
  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      const res = await axiosClient.post(
        "/login-store",
        {
          login: loginData.login,
          password: loginData.password,
        },
        {
          __skipAuthRedirect: true,                  // 👈 bandera interna
         // 👈 respaldo por header
          // validateStatus: (s) => s >= 200 && s < 500, // opcional
        }
      );

      localStorage.setItem("AUTH_TOKEN", res.data.token);
      localStorage.setItem("STORE_SLUG", res.data.store.slug);

      // await showSuccess("¡Inicio de sesión exitoso! ✅");
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

  // 🟠 Registro de nueva tienda
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
        {
          email: registerData.email,
          code: verificationCode,
        },
        {
          __skipAuthRedirect: true,
          headers: { "x-skip-auth-redirect": "1" },
        }
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

  return (
    <>
      <SEO titleTemplate="Login" description="Inicio de sesión y registro" />

      <div className="container py-3" style={{ minHeight: "100vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="text-center mb-4">
              <img
                src="/assets/logoc.png"
                alt="Logo de la tienda"
                className="img-fluid"
                style={{ maxWidth: "280px", cursor: "pointer" }}
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

            {modo === "login" ? (
              <>
                <h2 className="text-center mb-2">Iniciar sesión</h2>
                <LoginForm
                  loginData={loginData}
                  setLoginData={setLoginData}
                  onSubmit={handleLogin}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword(!showPassword)}
                  loading={loading}
                />
                <hr />
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
                <h2 className="text-center mb-2">Crear una cuenta</h2>
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
                <hr />
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
          </div>
        </div>
      </div>

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
