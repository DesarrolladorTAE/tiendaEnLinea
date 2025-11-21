// src/components/NavidadToggle.jsx
import React, { useState } from "react";
import Snow from "../utils/Snow";

const NavidadToggle = () => {
  const [activo, setActivo] = useState(true);

  const handleClick = () => {
    setActivo((prev) => !prev);
  };

  return (
    <>
      {/* Efecto de nieve en toda la página cuando está activo */}
      {activo && <Snow />}

      {/* Botón circular flotante pegado arriba del WhatsApp */}
      <button
        onClick={handleClick}
        className={`christmas-button ${activo ? "christmas-active" : ""}`}
        title={activo ? "Desactivar Navidad" : "Activar Navidad"}
      >
        🎄
      </button>
    </>
  );
};

export default NavidadToggle;
