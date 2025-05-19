// src/pages/admin/Notifications.jsx
import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import NotificacionesForm from "../../components/admin/NotificacionesForm";
import NotificacionesHistorial from "../../components/admin/NotificacionesHistorial";
import RecargasPendientes from "../../components/admin/RecargasPendientes";

const Notifications = () => {
  useEffect(() => {
    document.title = "Panel de Notificaciones";
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Gestión de Notificaciones y Recargas</Typography>
      <RecargasPendientes />
      <NotificacionesHistorial soloSolicitudes={true} />
      <NotificacionesForm />
    </Box>
  );
};

export default Notifications;
