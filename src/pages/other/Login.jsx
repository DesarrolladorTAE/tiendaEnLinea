import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginOverlay = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();
    navigate("/home-fashion-three");
  };

  return (
    <div className="login-container">
      <div
        className={`container ${rightPanelActive ? "right-panel-active" : ""}`}
        id="container"
      >
        <div className="form-container sign-up-container">
          <form action="#">
            <h1>
              Crea tu Cuenta
            </h1>
            <input type="text" placeholder="Nombre" />
            <input type="tel" placeholder="Teléfono" />
            <input type="password" placeholder="Contraseña" />
            <button id="lila" type="button">
              Registrar
            </button>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form action="#">
            <h1>
              Iniciar Sesión
              </h1>
            <input type="tel" placeholder="Teléfono" />
            <input type="password" placeholder="Contraseña" />
            <a href="#">¿Olvidaste tu contraseña?</a>
            <button type="button" onClick={handleLogin}>
              Iniciar sesión
            </button>
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
