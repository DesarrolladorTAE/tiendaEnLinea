import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

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
  onClose, // <-- NUEVO: función para cerrar el modal
  error,
}) => {
  const modalRef = useRef();

  // Cerrar al presionar ESC
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  // Click fuera del modal (backdrop)
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-backdrop"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="auth-modal"
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 360,
          width: "92%",
          padding: "2.5rem 1.5rem 1.5rem 1.5rem",
          boxShadow: "0 8px 32px 0 rgba(40,60,120,.18)",
          position: "relative",
        }}
        onMouseDown={e => e.stopPropagation()} // Evita que los clicks internos cierren el modal
      >
        {/* (Opcional) Botón para cerrar arriba a la derecha */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#999",
            cursor: "pointer",
          }}
          aria-label="Cerrar modal"
          type="button"
        >
          ×
        </button>

        <h2 style={{ marginBottom: 10, textAlign: "center" }}>Verifica tu identidad</h2>
        <p style={{ textAlign: "center" }}>
          Ingresa el código enviado a <strong>{phone}</strong> y tu nueva contraseña
        </p>

        <form onSubmit={onSubmit} className="auth-modal-form" autoComplete="off" style={{ marginTop: 18 }}>
          <input
            type="text"
            placeholder="Código de verificación"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={{ marginBottom: 12, width: "100%", padding: 8, fontSize: 15 }}
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ marginBottom: 12, width: "100%", padding: 8, fontSize: 15 }}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ marginBottom: 12, width: "100%", padding: 8, fontSize: 15 }}
          />

          {error && (
            <p className="auth-modal-error" style={{ color: "#c1121f", marginBottom: 10 }}>{error}</p>
          )}
          <button type="submit" className="btn-confirm" style={{
            width: "100%",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            padding: "10px 0",
            fontWeight: "bold",
            letterSpacing: ".5px",
            cursor: "pointer"
          }}>
            Cambiar contraseña
          </button>
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
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired, // <-- Obligatorio para cerrar modal
};

export default ResetPasswordModal;
