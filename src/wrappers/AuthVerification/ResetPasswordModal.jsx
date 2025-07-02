import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { IconButton, LinearProgress } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { CircularProgress } from "@mui/material";


const ResetPasswordModal = ({
  isOpen,
  onClose,
  onSendCode,
  onResetPassword,
  initialPhone = "",
}) => {
  const modalRef = useRef();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPhone("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleNextStep = async () => {
    setError("");
    setIsLoading(true);
    try {
      if (step === 1) {
        if (phone.length !== 10) {
          setError("Ingresa un número válido de 10 dígitos.");
          return;
        }
        const ok = await onSendCode(phone);
        if (ok) setStep(2);
      } else if (step === 2) {
        if (!/^\d{6}$/.test(code)) {
          setError("El código debe tener 6 dígitos.");
          return;
        }
        setStep(3);
      } else if (step === 3) {
        if (newPassword.length < 8) {
          setError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }
        const success = await onResetPassword({ phone, code, newPassword });
        setStep(success ? 4 : 3);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const progressValue = [25, 50, 75, 100][step - 1];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "90%",
          maxWidth: 420,
          padding: "1.8rem 1.5rem 1.2rem",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          position: "relative",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{ mb: 1.5, height: 4, borderRadius: 2 }}
        />

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
        >
          ×
        </button>

        <h2 style={{ marginBottom: 8 }}>Recuperar contraseña</h2>
        <p style={{ marginBottom: 18, fontWeight: 500 }}>
          Paso {step} de 4:{" "}
          {step === 1 ? "Número" : step === 2 ? "Código" : step === 3 ? "Nueva contraseña" : "¡Hecho!"}
        </p>

        {step === 1 && (
          <input
            type="tel"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("Text").replace(/\D/g, "").slice(-10);
              setPhone(text);
            }}
            inputMode="numeric"
            maxLength={10}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "16px",
              marginBottom: 12,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        )}

        {step === 2 && (
          <input
            type="text"
            placeholder="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "16px",
              marginBottom: 12,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        )}

        {step === 3 && (
          <>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "16px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  paddingRight: 40,
                }}
              />
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 6,
                  transform: "translateY(-50%)",
                }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: 6,
                marginBottom: 12,
              }}
            />
          </>
        )}

        {step === 4 && (
          <>
            <p style={{ fontWeight: 500, textAlign: "center" }}>
              ✅ Tu contraseña se actualizó correctamente.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 18,
                width: "100%",
                background: "#00bfa5",
                color: "#fff",
                padding: "10px 0",
                borderRadius: 6,
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </>
        )}

        {error && (
          <p style={{ color: "#c1121f", marginBottom: 10, fontSize: 14 }}>{error}</p>
        )}

        {step < 4 && (
          <button
            onClick={handleNextStep}
            disabled={isLoading}
            style={{
              width: "100%",
              background: isLoading ? "#1565c0" : "#1976d2",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "15px",
              padding: "10px 0",
              borderRadius: 6,
              border: "none",
              cursor: isLoading ? "default" : "pointer",
              marginTop: 6,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              step === 3 ? "Cambiar contraseña" : "Enviar código"
            )}
          </button>
        )}

      </div>
    </div>
  );
};

ResetPasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSendCode: PropTypes.func.isRequired,
  onResetPassword: PropTypes.func.isRequired,
  initialPhone: PropTypes.string,
};

export default ResetPasswordModal;
