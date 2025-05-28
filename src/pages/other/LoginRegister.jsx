import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SEO from "../../components/seo";
import axiosClient from "../../config/axiosClient";
import VerificationModal from "../../components/login/VerificationModal";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";

const LoginRegister = () => {
  const navigate = useNavigate();

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
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Error al iniciar sesión";
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
      startCooldown(); // ⬅️ Inicia cooldown correctamente
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

      // toast.success("Código reenviado con éxito");
      startCooldown(); // ⬅️ Bloquea botón nuevamente durante 60s
    } catch (err) {
      // toast.error(err.response?.data?.message || "No se pudo reenviar el código");
    }
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
    <Fragment>
      <SEO
        titleTemplate="Login"
        description="Página de Inicio de Sesión y Registro para el Sistema MiTiendaEnLineaMX"
      />
      <div className="login-register-area py-5" style={{ minHeight: "100vh" }}>
        <div className="container">
          <div className="col-lg-7 col-md-12 ms-auto me-auto">
            <div className="login-register-wrapper">
              <Tab.Container defaultActiveKey="register">
                <Nav variant="pills" className="login-register-tab-list">
                  <Nav.Item>
                    <Nav.Link eventKey="login">
                      <h4>Iniciar Sesión</h4>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="register">
                      <h4>Registrarse</h4>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey="login">
                    <div className="login-form-container">
                      <div className="login-register-form">
                        <LoginForm
                          loginData={loginData}
                          setLoginData={setLoginData}
                          onSubmit={handleLogin}
                          showPassword={showPassword}
                          togglePassword={() => setShowPassword(!showPassword)}
                          loading={loading}
                        />
                      </div>
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="register">
                    <div className="login-form-container">
                      <div className="login-register-form">
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
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
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
    </Fragment>
  );
};

export default LoginRegister;
