// src/components/auth/LoginForm.jsx
import React from "react";

const LoginForm = ({ onSubmit, phone, setPhone, password, setPassword, error, onForgot }) => (
  <form onSubmit={onSubmit}>
    <h1>Iniciar Sesión</h1>
    <input
      type="tel"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder="Teléfono"
      required
    />
    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Contraseña"
      required
    />
    <button type="submit">Iniciar Sesión</button>
    {error && <p className="error-message">{error}</p>}
    <a href="#" onClick={onForgot}>¿Olvidaste tu contraseña?</a>
  </form>
);

export default LoginForm;
