import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "../../axiosConfig";

const AuthModal = ({ isOpen, type, onClose, onSubmit, phone, code, setCode, error }) => {
  const [resendStatus, setResendStatus] = useState(null);
  const [resendError, setResendError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setResendStatus(null);
      setResendError(null);
      setResendCooldown(30);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    try {
      const response = await axios.post("/auth/resend-code", { phone });
      setResendStatus("Código reenviado con éxito.");
      setResendError(null);
      setResendCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.error || "Error al reenviar el código.";
      setResendError(msg);
      setResendStatus(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal">
        <h2>{type === "verify" ? "Verifica tu número" : "Verifica para cambiar contraseña"}</h2>
        <p>
          Hemos enviado un código de verificación al número: <strong>{phone}</strong>
        </p>

        <form onSubmit={onSubmit} className="auth-modal-form">
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {error && <p className="auth-modal-error">{error}</p>}
          <button type="submit" className="btn-confirm">Confirmar código</button>
        </form>

        <div className="resend-section">
          {resendStatus && <p className="resend-success">{resendStatus}</p>}
          {resendError && <p className="resend-error">{resendError}</p>}
          <button
            className="btn-resend"
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `⏱️ Reenviar en ${resendCooldown}s` : `🔄 Reenviar código`}
          </button>
        </div>
      </div>
    </div>
  );
};

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(["verify", "reset"]).isRequired,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  phone: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  setCode: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default AuthModal;
