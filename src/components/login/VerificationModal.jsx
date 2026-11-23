import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const VerificationModal = ({
  show,
  onClose,
  onVerify,
  onSubmitResendCode,
  code,
  setCode,
  loading,
  resendDisabled,
  cooldown,
}) => {
  return (
    <Modal
  show={show}
  onHide={onClose}
  dialogClassName="verification-modal"   // 👈 clase propia
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Verificación de WhatsApp</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <p className="mb-2">Ingresa el código que recibiste por WhatsApp:</p>
    <input
      type="text"
      className="form-control"
      placeholder="Código de 6 dígitos"
      value={code ?? ""}                     // 👈 evita undefined
      onChange={(e) => setCode(e.target.value.replace(/\D+/g, "").slice(0,6))}
      inputMode="numeric"                    // 👈 teclado numérico en móvil
      autoComplete="one-time-code"           // 👈 iOS/Android OTP
      maxLength={6}
      autoFocus
      style={{
        height: "42px",
        fontSize: "18px",
        textAlign: "center",
        backgroundColor: "#fff",
        color: "#0f172a",
        WebkitTextFillColor: "#0f172a",      // 👈 corrige autofill WebKit
        caretColor: "#0f172a",
        opacity: 1,
      }}
    />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
    <Button variant="primary" onClick={onVerify} disabled={loading}>
      {loading ? "Verificando..." : "Verificar"}
    </Button>
    <Button variant="outline-secondary" onClick={onSubmitResendCode} disabled={resendDisabled}>
      {resendDisabled ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
    </Button>
  </Modal.Footer>
</Modal>

  );
};

export default VerificationModal;
