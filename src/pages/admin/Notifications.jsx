// src/pages/admin/Notifications.jsx
import React, { useEffect } from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import NotificacionesForm from "../../components/admin/NotificacionesForm";
import NotificacionesHistorial from "../../components/admin/NotificacionesHistorial";
import EnviarWhatsappDocumentos from "../../components/admin/EnviarWhatsappDocumentos"; // 👈 nuevo import

const Notifications = () => {
  useEffect(() => {
    document.title = "Panel de Notificaciones";
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" mb={3} textAlign="center" color="primary">
        Gestión de Solicitudes de Saldo y Notificaciones
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
        <NotificacionesHistorial soloSolicitudes={true} />
      </Paper>

      <Divider sx={{ mb: 5 }} />

      <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" mb={2}>
          Enviar Notificación Manual
        </Typography>
        <NotificacionesForm />
      </Paper>

      <Divider sx={{ mb: 5 }} />

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Enviar Documentos por WhatsApp
        </Typography>
        <EnviarWhatsappDocumentos />
      </Paper>
    </Box>
  );
};

export default Notifications;
