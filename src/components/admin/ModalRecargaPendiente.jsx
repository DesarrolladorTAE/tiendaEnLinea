import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  Box,
  Chip
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const getStatusChip = (status) => {
  const normalized = String(status).trim().toLowerCase();

  switch (normalized) {
    case "exitosa":
    case "confirmado":
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Confirmado"
          color="success"
          variant="outlined"
        />
      );

    case "rechazado":
      return (
        <Chip
          icon={<CancelIcon />}
          label="Rechazado"
          color="error"
          variant="outlined"
        />
      );
    case "pendiente":
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Pendiente"
          color="warning"
          variant="outlined"
        />
      );
    default:
      return (
        <Chip
          icon={<InsertDriveFileIcon />}
          label={`Estado: ${normalized || "No disponible"}`}
          color="default"
          variant="outlined"
        />
      );
  }
};



const ModalRecargaPendiente = ({ open, onClose, recarga, onConfirmar, onRechazar }) => {
  if (!recarga) return null;

  const comprobanteURL = recarga.comprobante?.toLowerCase() || "";

  const esImagen = /\.(png|jpe?g|gif)$/i.test(comprobanteURL);
  const esPDF = comprobanteURL.endsWith(".pdf");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>📄 Revisión de Recarga Manual</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography><strong>👤 Usuario:</strong> {recarga.user?.name}</Typography>
          <Typography><strong>💵 Monto:</strong> ${recarga.monto}</Typography>
          <Typography><strong>🔖 Referencia:</strong> {recarga.referencia}</Typography>
          <Typography><strong>📅 Fecha:</strong> {new Date(recarga.fecha_envio).toLocaleString()}</Typography>

          <Box>
            <Typography><strong>📌 Estado:</strong></Typography>
            {getStatusChip(recarga.status)}
          </Box>


          {recarga.comprobante && (
            <Box>
              <Typography><strong>🧾 Comprobante:</strong></Typography>

              {esImagen && (
                <Box
                  component="img"
                  src={recarga.comprobante}
                  alt="Comprobante"
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 2,
                    mt: 1
                  }}
                />
              )}

              {esPDF && (
                <Box
                  component="iframe"
                  src={recarga.comprobante}
                  title="Comprobante PDF"
                  sx={{
                    width: "100%",
                    height: 500,
                    mt: 1,
                    borderRadius: 2,
                    border: "1px solid #ccc"
                  }}
                />
              )}

              {!esImagen && !esPDF && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <InsertDriveFileIcon color="disabled" />
                  <Typography variant="body2" color="text.secondary">
                    Archivo no visualizable.{" "}
                    <a href={recarga.comprobante} target="_blank" rel="noopener noreferrer">
                      Haz clic aquí para descargarlo
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => onRechazar(recarga.id)}>❌ Rechazar</Button>
        <Button color="success" onClick={() => onConfirmar(recarga.id)}>💰 Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRecargaPendiente
