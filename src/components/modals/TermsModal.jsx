// src/components/modals/TermsModal.jsx
import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

const TermsModal = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          bgcolor: "white",
          width: 500,
          mx: "auto",
          my: "10%",
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Términos y Condiciones
        </Typography>
        <Typography variant="body2" paragraph>
          Aquí irán los términos y condiciones que el usuario debe aceptar para registrarse.
        </Typography>
        <Typography variant="body2">
          Este es un ejemplo básico. Puedes modificarlo más adelante para incluir enlaces, listas u otros contenidos.
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ mt: 3, bgcolor: "#be4bdb" }}
        >
          Cerrar
        </Button>
      </Box>
    </Modal>
  );
};

export default TermsModal;
