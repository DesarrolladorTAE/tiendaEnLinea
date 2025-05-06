import React from "react";

const AuthOverlay = ({ setRightPanelActive }) => (
  <div className="overlay-container">
    <div className="overlay">
      <div className="overlay-panel overlay-left">
        <h1>¡Bienvenido!</h1>
        <p>Inicia sesión con tu cuenta</p>
        <button className="ghost ghost-turquesa" onClick={() => setRightPanelActive(false)}>
          Inicia sesión
        </button>
      </div>
      <div className="overlay-panel overlay-right">
        <h1>Hola!</h1>
        <p>Crea tu cuenta para comenzar tu experiencia</p>
        <button className="ghost" onClick={() => setRightPanelActive(true)}>
          Registrarse
        </button>
      </div>
    </div>
  </div>
);

export default AuthOverlay;