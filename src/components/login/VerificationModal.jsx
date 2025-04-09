import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const VerificationModal = ({
  show,
  onClose,
  onVerify,
  code,
  setCode,
  loading,
}) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Verificación de WhatsApp</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">Ingresa el código que recibiste por WhatsApp:</p>
        <input
          type="text"
          className="form-control"
          placeholder="Código de 6 dígitos"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ height: "42px", fontSize: "15px", textAlign: "center" }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onVerify} disabled={loading}>
          {loading ? "Verificando..." : "Verificar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VerificationModal;
