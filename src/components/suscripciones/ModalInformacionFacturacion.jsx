// src/components/suscripciones/ModalInformacionFacturacion.jsx
import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const ModalInformacionFacturacion = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          maxWidth: 500,
          bgcolor: "background.paper",
          borderRadius: 2,
          mx: "auto",
          my: "10%",
          p: 3,
          outline: "none",
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <InfoOutlinedIcon color="info" sx={{ mr: 1 }} />
          <Typography variant="h6">Información para facturación</Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="body2" gutterBottom>
          Para poder facturar una compra debes cumplir con lo siguiente:
        </Typography>
        <ul style={{ marginTop: 0, paddingLeft: "1.25rem" }}>
          <li>
            Tener registrado un <b>RFC</b> y <b>Régimen Fiscal</b> en tu perfil.
          </li>
          <li>
            Tu correo electrónico de MiTiendaenlineaMX.COM debe estar activo ya que por
            ese medio recibirás la factura. Puedes actualizar tu correo en la
            sección: <b>“Mi cuenta” &gt; “Datos Personales”</b>.
          </li>
          <li>
            Sólo puedes facturar hasta antes de las <b>11:00 PM del último día</b>{" "}
            del mes en que se realizó la compra.
          </li>
        </ul>
        <Typography variant="body2" mt={2}>
          Si aún no tienes tus datos fiscales, puedes agregarlos en la sección:
        </Typography>
        <Typography variant="body2" mb={2}>
          <b>• “Mi cuenta” &gt; “Datos Fiscales”.</b>
        </Typography>

        <Box textAlign="right">
          <Button variant="contained" onClick={onClose}>
            Entendido
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalInformacionFacturacion;
