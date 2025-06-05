import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import axiosClient from "../../config/axiosClient";
import VerificationModal from "../../components/login/VerificationModal";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";

const LoginRegister = () => {
  const navigate = useNavigate();
  const [modo, setModo] = useState("login"); // "login" o "register"

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post("/login-store", loginData);
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      localStorage.setItem("STORE_SLUG", res.data.store.slug);
      navigate("/admin");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.response?.data?.message || "Error al iniciar sesión";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setRegisterBlocked(true);
    setTimeout(() => setRegisterBlocked(false), 15000);

    try {
      await axiosClient.post("/registro/enviar-codigo", {
        name: registerData.nombre,
        email: registerData.email,
        phone_number: registerData.telefono,
        password: registerData.password,
      });
      setShowModal(true);
      startCooldown();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitResendCode = async () => {
    try {
      await axiosClient.post("/registro/enviar-codigo", {
        name: registerData.nombre,
        email: registerData.email,
        phone_number: registerData.telefono,
        password: registerData.password,
      });
      startCooldown();
    } catch (err) {}
  };

  const handleVerificationCodeSubmit = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/registro/verificar", {
        email: registerData.email,
        code: verificationCode,
      });
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      setShowModal(false);
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        titleTemplate="Login"
        description="Página de Inicio de Sesión y Registro para el Sistema MiTiendaEnLineaMX"
      />

      <div className="container py-3" style={{ minHeight: "100vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="text-center mb-4">
              <img
                src="/assets/logoc.png"
                alt="Logo de la tienda"
                className="img-fluid"
                style={{ maxWidth: "280px", height: "auto" }}
              />
            </div>
            {modo === "login" ? (
              <div className="text-center">
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
                <div className="text-center mt-3">
                  <a
                    href="#"
                    className="text-primary fs-6"
                    onClick={(e) => {
                      e.preventDefault();
                      setModo("register");
                    }}
                  >
                    Crea una cuenta
                  </a>
                </div>
              </div>
            ) : (
              <div>
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
                  <a
                    href="#"
                    className="text-primary fs-6"
                    onClick={(e) => {
                      e.preventDefault();
                      setModo("login");
                    }}
                  >
                    ¿Ya tienes una cuenta?
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
