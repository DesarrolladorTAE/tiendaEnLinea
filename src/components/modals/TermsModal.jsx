// src/components/modals/TermsModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import terminos from "../../utils/terminos";

const TermsModal = ({ open, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleClose = () => {
    setAccepted(false);
    onClose();
  };

  const handleAccept = () => {
    if (accepted && typeof onAccept === "function") {
      onAccept(); // solo ejecuta la acción externa
    }
  };

  // Detecta si el contenido contiene HTML
  const renderContenido = (contenido) => {
    const contieneHTML = /<\/?[a-z][\s\S]*>/i.test(contenido);
    if (contieneHTML) {
      return (
        <Box
          sx={{ color: "#333", fontSize: "0.9rem", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      );
    } else {
      return (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-line", color: "#333" }}
        >
          {contenido}
        </Typography>
      );
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          bgcolor: "white",
          width: "90%",
          maxWidth: 800,
          mx: "auto",
          my: "5%",
          p: 0,
          borderRadius: 2,
          boxShadow: 24,
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        {/* Contenido scrollable */}
        <Box sx={{ p: 4, overflowY: "auto", flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {terminos.titulo}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            {terminos.subtitulo}
          </Typography>

          {terminos.secciones.map((seccion, index) => (
            <Box key={index} sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {seccion.titulo}
              </Typography>
              {renderContenido(seccion.contenido)}
            </Box>
          ))}
        </Box>

        {/* Divider visual */}
        <Divider />

        {/* Footer con checkbox y botones */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
            }
            label="He leído y acepto los términos"
          />
          <Box display="flex" gap={1}>
            <Button onClick={handleClose} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
              variant="contained"
              color="primary"
              disabled={!accepted}
            >
              Aceptar términos
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default TermsModal;
