import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const getStatusChip = (status) => {
  const normalized = String(status).trim().toLowerCase();

  switch (normalized) {
    case "exitosa":
    case "confirmado":
      return (
        <Chip icon={<CheckCircleIcon />} label="Confirmado" color="success" variant="outlined" />
      );
    case "rechazado":
      return (
        <Chip icon={<CancelIcon />} label="Rechazado" color="error" variant="outlined" />
      );
    case "pendiente":
      return (
        <Chip icon={<HourglassEmptyIcon />} label="Pendiente" color="warning" variant="outlined" />
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [zoom, setZoom] = useState(1);

  if (!recarga) return null;

  const comprobanteURL = recarga.comprobante?.toLowerCase() || "";
  const esImagen = /\.(png|jpe?g|gif|webp)$/i.test(comprobanteURL);
  const esPDF = comprobanteURL.endsWith(".pdf");

  const fechaValida =
    recarga.fecha_envio && !isNaN(Date.parse(recarga.fecha_envio))
      ? new Date(recarga.fecha_envio).toLocaleString()
      : "Fecha no disponible";

  const aumentarZoom = () => setZoom((z) => Math.min(z + 0.1, 2));
  const disminuirZoom = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>📄 Revisión de Recarga Manual</DialogTitle>
      <DialogContent sx={{ px: 2, py: 2 }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={3}
          divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
        >
          {/* Información */}
          <Box flex={1}>
            <Stack spacing={2}>
              <Typography><strong>👤 Usuario:</strong> {recarga.user?.name} {recarga.user?.apellidos}</Typography>
              <Typography><strong>💵 Monto:</strong> ${parseFloat(recarga.monto).toFixed(2)}</Typography>
              <Typography><strong>🔖 Referencia:</strong> {recarga.referencia}</Typography>
              <Typography><strong>📅 Fecha:</strong> {fechaValida}</Typography>
              <Box>
                <Typography><strong>📌 Estado:</strong></Typography>
                {getStatusChip(recarga.status)}
              </Box>
            </Stack>
          </Box>

          {/* Comprobante */}
          <Box flex={1} minWidth={250}>
            <Typography fontWeight="bold" mb={1}>🧾 Comprobante</Typography>

            {esImagen && (
              <>
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
                    alignItems: "center"
                  }}
                >
                  <Box
                    component="img"
                    src={recarga.comprobante}
                    alt="Comprobante"
                    sx={{
                      transform: `scale(${zoom})`,
                      transition: "transform 0.2s ease",
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "contain"
                    }}
                  />
                </Box>

                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">🔍 Zoom:</Typography>
                  <IconButton size="small" onClick={disminuirZoom}><RemoveIcon /></IconButton>
                  <Typography variant="body2">{Math.round(zoom * 100)}%</Typography>
                  <IconButton size="small" onClick={aumentarZoom}><AddIcon /></IconButton>
                </Box>
              </>
            )}

            {esPDF && (
              <Box
                component="iframe"
                src={recarga.comprobante}
                title="Comprobante PDF"
                sx={{
                  width: "100%",
                  height: 400,
                  mt: 1,
                  borderRadius: 2,
                  border: "1px solid #ccc"
                }}
              />
            )}

            {!esImagen && !esPDF && recarga.comprobante && (
              <Box sx={{ mt: 2 }}>
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
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="error" onClick={() => onRechazar(recarga.id)}>
          ❌ Rechazar
        </Button>
        <Button variant="contained" color="success" onClick={() => onConfirmar(recarga.id)}>
          💰 Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRecargaPendiente;
