import React, { Fragment, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SEO from "../../components/seo";
import LayoutTEL from "../../layouts/LayoutTEL";
import axiosClient from "../../config/axiosClient";
import VerificationModal from "../../components/login/VerificationModal";

const LoginRegister = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
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

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post("/login-store", loginData);
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // REGISTRO PASO 1: enviar código
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await axiosClient.post("/registro/enviar-codigo", {
        nombre: registerData.nombre,
        email: registerData.email,
        telefono: registerData.telefono,
        password: registerData.password,
      });
      setShowModal(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // REGISTRO PASO 2: verificar código
  const handleVerificationCodeSubmit = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/registro/verificar", {
        email: registerData.email,
        code: verificationCode,
      });
      localStorage.setItem("AUTH_TOKEN", res.data.token);
      setShowModal(false);
      navigate("/contact");
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
      <LayoutTEL>
        <div className="login-register-area pt-30 pb-100">
          <div className="container">
            <div className="row">
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
                      {/* LOGIN */}
                      <Tab.Pane eventKey="login">
                        <div className="login-form-container">
                          <div className="login-register-form">
                            <form onSubmit={handleLogin}>
                              <div className="form-group ">
                                <input
                                  type="email"
                                  className="form-control"
                                  placeholder="Correo electrónico"
                                  value={loginData.email}
                                  onChange={(e) =>
                                    setLoginData({
                                      ...loginData,
                                      email: e.target.value,
                                    })
                                  }
                                  required
                                  style={{ height: "45px" }}
                                />
                              </div>

                              <div className="form-group mb-4 position-relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  className="form-control"
                                  placeholder="Contraseña"
                                  value={loginData.password}
                                  onChange={(e) =>
                                    setLoginData({
                                      ...loginData,
                                      password: e.target.value,
                                    })
                                  }
                                  required
                                  style={{
                                    height: "45px",
                                    paddingRight: "40px",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={
                                    showPassword
                                      ? "Ocultar contraseña"
                                      : "Mostrar contraseña"
                                  }
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    right: "10px",
                                    transform: "translateY(-50%)",
                                    fontSize: "18px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    outline: "none",
                                  }}
                                >
                                  {showPassword ? "🙈" : "👁️"}
                                </button>
                              </div>

                              <div className="button-box">
                                <button
                                  type="submit"
                                  className="btn btn-primary w-100"
                                  disabled={loading}
                                  style={{
                                    height: "45px",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                  }}
                                >
                                  {loading ? "Cargando..." : "INICIAR SESIÓN"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </Tab.Pane>

                      {/* REGISTRO */}
                      <Tab.Pane eventKey="register">
                        <div className="login-form-container p-">
                          <div className="login-register-form">
                            <form onSubmit={handleRegister}>
                              {/* NOMBRE */}
                              <input
                                type="text"
                                className="form-control mb-4"
                                placeholder="Nombre de la Tienda"
                                value={registerData.nombre}
                                onChange={(e) =>
                                  setRegisterData({
                                    ...registerData,
                                    nombre: e.target.value,
                                  })
                                }
                                required
                              />
                              {errors.nombre && (
                                <small
                                  style={{
                                    color: "#dc3545",
                                    fontSize: "13px",
                                  }}
                                >
                                  {errors.nombre[0]}
                                </small>
                              )}

                              {/* EMAIL */}
                              <input
                                type="email"
                                className="form-control mb-4"
                                placeholder="Correo electrónico"
                                value={registerData.email}
                                onChange={(e) =>
                                  setRegisterData({
                                    ...registerData,
                                    email: e.target.value,
                                  })
                                }
                                required
                              />

                              {/* TELÉFONO */}
                              <input
                                type="tel"
                                name="telefono"
                                inputMode="numeric"
                                pattern="\d{10}"
                                maxLength={10}
                                autoComplete="off"
                                className="form-control mb-4"
                                placeholder="Número de teléfono (10 dígitos)"
                                value={registerData.telefono}
                                onChange={(e) =>
                                  setRegisterData({
                                    ...registerData,
                                    telefono: e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 10),
                                  })
                                }
                                required
                              />

                              <div className="form-group mb-4 d-flex gap-2">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  className="form-control mb-0"
                                  placeholder="Contraseña"
                                  value={registerData.password}
                                  onChange={(e) =>
                                    setRegisterData({
                                      ...registerData,
                                      password: e.target.value,
                                    })
                                  }
                                  required
                                  style={{ flex: 1, height: "45px" }}
                                />

                                <input
                                  type={showPassword ? "text" : "password"}
                                  className="form-control mb-0"
                                  placeholder="Confirmar contraseña"
                                  value={registerData.password_confirmation}
                                  onChange={(e) =>
                                    setRegisterData({
                                      ...registerData,
                                      password_confirmation: e.target.value,
                                    })
                                  }
                                  required
                                  style={{ flex: 1, height: "45px" }}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={
                                    showPassword
                                      ? "Ocultar contraseña"
                                      : "Mostrar contraseña"
                                  }
                                  title={
                                    showPassword
                                      ? "Ocultar contraseña"
                                      : "Mostrar contraseña"
                                  }
                                  style={{
                                    fontSize: "22px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    border: "none",
                                    background: "transparent",
                                    padding: "0px",
                                    height: "45px",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {showPassword ? "🙈" : "👁️"}
                                </button>
                              </div>

                              {/* BOTÓN DE REGISTRO */}
                              <div className="button-box">
                                <button
                                  type="submit"
                                  className="btn btn-primary w-100"
                                  disabled={loading}
                                  style={{
                                    height: "45px",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                  }}
                                >
                                  {loading ? "Cargando..." : "REGISTRARME"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL DE VERIFICACIÓN */}
        <VerificationModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onVerify={handleVerificationCodeSubmit}
          code={verificationCode}
          setCode={setVerificationCode}
          loading={loading}
        />
      </LayoutTEL>
    </Fragment>
  );
};

export default LoginRegister;
