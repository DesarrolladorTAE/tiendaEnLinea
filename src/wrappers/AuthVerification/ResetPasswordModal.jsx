// src/wrappers/AuthVerification/ResetPasswordModal.jsx
import React from "react";
import PropTypes from "prop-types";
// import "./AuthModals.scss";

const ResetPasswordModal = ({
  isOpen,
  phone,
  code,
  setCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal">
        <h2>Verifica tu identidad</h2>
        <p>Ingresa el código enviado a <strong>{phone}</strong> y tu nueva contraseña</p>

        <form onSubmit={onSubmit} className="auth-modal-form">
          <input
            type="text"
            placeholder="Código de verificación"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="auth-modal-error">{error}</p>}
          <button type="submit" className="btn-confirm">Cambiar contraseña</button>
        </form>
      </div>
    </div>
  );
};

ResetPasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  phone: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  setCode: PropTypes.func.isRequired,
  newPassword: PropTypes.string.isRequired,
  setNewPassword: PropTypes.func.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string
};

export default ResetPasswordModal;
