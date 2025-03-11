// src/pages/other/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axiosConfig"; // Ajusta la ruta según la ubicación de Login.jsx
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/userSlice'; // Importa la acción setUser

const LoginOverlay = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Inicializa el dispatch

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
        const response = await axios.post("login", {
            phone,
            password,
        });

        // Manejar la respuesta de inicio de sesión
        console.log(response.data);
        
        // Almacenar el token en localStorage
        localStorage.setItem("token", response.data.token); // Asegúrate de que el token esté en la respuesta

        dispatch(setUser(response.data.user)); // Establecer el usuario en Redux
        navigate("/home-fashion-three");
    } catch (error) {
        setError(error.response ? error.response.data.message : "Error en el inicio de sesión");
        console.error("Error:", error);
    }
};

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("register", {
        name,
        phone,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Manejar la respuesta de registro
      console.log(response.data);
      setSuccess("Registro exitoso");
      setError(null);
      setRightPanelActive(false);

      // Limpiar campos después del registro
      setName("");
      setPhone("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      setError(error.response ? error.response.data.message : "Error en el registro");
      console.error("Error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className={`container ${rightPanelActive ? "right-panel-active" : ""}`} id="container">
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegister}>
            <h1>Crea tu Cuenta</h1>
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirmar Contraseña"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
            <button id="lila" type="submit">
              Registrar
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Iniciar Sesión</h1>
            <input
              type="tel"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="#">¿Olvidaste tu contraseña?</a>
            <button type="submit">
              Iniciar sesión
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>¡Bienvenido!</h1>
              <p>Inicia sesión con tu cuenta</p>
              <button
                className="ghost"
                id="signIn"
                onClick={() => setRightPanelActive(false)}
                type="button"
              >
                Inicia sesión
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hola!!!</h1>
              <p>Crear tu cuenta</p>
              <button
                className="ghost"
                id="signUp"
                onClick={() => setRightPanelActive(true)}
                type="button"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginOverlay;
