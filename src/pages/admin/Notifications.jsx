// src/pages/admin/Notifications.jsx
import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import NotificacionesForm from "../../components/admin/NotificacionesForm";
import NotificacionesHistorial from "../../components/admin/NotificacionesHistorial";


const Notifications = () => {
  useEffect(() => {
    document.title = "Panel de Notificaciones";
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Gestión de Notificaciones y Recargas</Typography>
      <NotificacionesHistorial soloSolicitudes={true} />
      <NotificacionesForm />
    </Box>
  );
};

export default Notifications;
