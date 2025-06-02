import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const VisorComprobanteModal = ({ comprobante }) => {
  const [zoom, setZoom] = useState(1);
  const [pdfError, setPdfError] = useState(false);

  if (!comprobante) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
        No hay comprobante para mostrar.
      </Typography>
    );
  }

  const comprobanteURL = comprobante.toLowerCase();
  const esImagen = /\.(png|jpe?g|gif|webp)$/i.test(comprobanteURL);
  const esPDF = comprobanteURL.endsWith(".pdf");

  // Solo imagen
  if (esImagen) {
    return (
      <Box>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 400,
            border: "1px solid #ccc",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#f9f9f9",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            component="img"
            src={comprobante}
            alt="Comprobante"
            sx={{
              transform: `scale(${zoom})`,
              transition: "transform 0.2s ease",
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
        <Box mt={1} display="flex" alignItems="center" gap={1} justifyContent="center">
          <Typography variant="body2">🔍 Zoom:</Typography>
          <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>
            <RemoveIcon />
          </IconButton>
          <Typography variant="body2">{Math.round(zoom * 100)}%</Typography>
          <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // PDF (con fallback para error)
  if (esPDF) {
    return (
      <Box>
        {!pdfError ? (
          <Box
            component="iframe"
            src={comprobante}
            title="Comprobante PDF"
            sx={{
              width: "100%",
              height: 400,
              mt: 1,
              borderRadius: 2,
              border: "1px solid #ccc",
              bgcolor: "#fafafa",
            }}
            onError={() => setPdfError(true)}
          />
        ) : (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography color="error" sx={{ mb: 2 }}>
              ⚠️ No se puede mostrar el PDF aquí.<br />
              El navegador o el servidor lo están bloqueando.<br />
              Ábrelo en una nueva pestaña:
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              href={comprobante}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir PDF en otra pestaña
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Archivo no visualizable
  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <Typography variant="body2" color="text.secondary">
        Archivo no visualizable.<br />
        <a href={comprobante} target="_blank" rel="noopener noreferrer">
          Haz clic aquí para descargarlo
        </a>
      </Typography>
    </Box>
  );
};

export default VisorComprobanteModal;
