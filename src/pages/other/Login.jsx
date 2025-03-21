import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axiosConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { useForm } from "react-hook-form";

const LoginOverlay = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);

  // Login states
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);

  // Registro estado de error y éxito
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [backendFieldErrors, setBackendFieldErrors] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm();

  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      setLoginError(error.response?.data?.message || "Error en el inicio de sesión");
    }
  };

  const handleRegister = async (data) => {
    try {
      const response = await axios.post("register", {
        name: data.name,
        apellidos: data.apellidos,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      console.log('response', res)
      setRegisterSuccess("Registro exitoso");
      setRegisterError(null);
      setBackendFieldErrors({});
      reset();
      setRightPanelActive(false);
    } 
    catch (error) {
      const response = error.response;
      console.log('errores: ', response)
      if (response?.data?.errors) {
        const fieldErrors = {};
        if (response.data.errors.email) {
          fieldErrors.email = response.data.errors.email[0];
        }
        if (response.data.errors.phone) {
          fieldErrors.phone = response.data.errors.phone[0];
        }
        if (response.data.errors.password) {
          fieldErrors.password = response.data.errors.password[0];
        }
        setBackendFieldErrors(fieldErrors);
      } else {
        setRegisterError(response?.data?.message || "Error en el registro");
      }
    }
  };

  const password = watch("password");

  return (
    <div className="login-container">
      <div className={`container ${rightPanelActive ? "right-panel-active" : ""}`} id="container">
        {/* REGISTRO */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSubmit(handleRegister)}>
            <h1>Crea tu Cuenta</h1>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Nombre"
                {...register("name", { required: "Nombre requerido" })}
              />
              {errors.name && <p className="error-message">{errors.name.message}</p>}

              <input
                type="text"
                placeholder="Apellidos"
                {...register("apellidos", { required: "Apellidos requeridos" })}
              />
              {errors.apellidos && <p className="error-message">{errors.apellidos.message}</p>}

              <input
                type="email"
                placeholder="Correo electrónico"
                {...register("email", {
                  required: "Email requerido",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email no válido"
                  }
                })}
              />
              {errors.email && <p className="error-message">{errors.email.message}</p>}
              {backendFieldErrors.email && <p className="error-message">{backendFieldErrors.email}</p>}

              <input
                type="tel"
                placeholder="Teléfono"
                {...register("phone", {
                  required: "Teléfono requerido",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Debe contener 10 dígitos numéricos"
                  }
                })}
              />
              {errors.phone && <p className="error-message">{errors.phone.message}</p>}
              {backendFieldErrors.phone && <p className="error-message">{backendFieldErrors.phone}</p>}

              <input
                type="password"
                placeholder="Contraseña"
                {...register("password", {
                  required: "Contraseña requerida",
                  minLength: {
                    value: 8,
                    message: "Mínimo 8 caracteres"
                  }
                })}
              />
              {errors.password && <p className="error-message">{errors.password.message}</p>}
              {backendFieldErrors.password && <p className="error-message">{backendFieldErrors.password}</p>}

              <input
                type="password"
                placeholder="Confirmar Contraseña"
                {...register("password_confirmation", {
                  required: "Confirmación requerida",
                  validate: value => value === password || "Las contraseñas no coinciden"
                })}
              />
              {errors.password_confirmation && (
                <p className="error-message">{errors.password_confirmation.message}</p>
              )}
            </div>
            {/* <button type="submit">Registrar</button> */}
            <button className="btn-lila">Registrarme</button>
            {registerError && <p className="error-message">{registerError}</p>}
            {registerSuccess && <p className="success-message">{registerSuccess}</p>}
          </form>
        </div>

        {/* LOGIN */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Iniciar Sesión</h1>
            <input
              type="tel"
              placeholder="Teléfono"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {/* <button type="submit">Iniciar sesión</button> */}
            <button className="btn-turquesa">Iniciar Sesión</button>
            {loginError && <p className="error-message">{loginError}</p>}
          </form>
        </div>

        {/* OVERLAY */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>¡Bienvenido!</h1>
              <p>Inicia sesión con tu cuenta</p>
              <button className="ghost" onClick={() => setRightPanelActive(false)}>Inicia sesión</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hola!</h1>
              <p>Crea tu cuenta para comenzar tu experiencia</p>
              <button className="ghost" onClick={() => setRightPanelActive(true)}>Registrarse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginOverlay;
