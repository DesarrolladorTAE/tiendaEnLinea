// src/components/TiendaInactiva.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import StoreOffIcon from "@mui/icons-material/StoreOff";

const TiendaInactiva = () => {
  return (
    <Box
      display="flex"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      textAlign="center"
      sx={{ px: 2 }}
    >
      <StoreOffIcon sx={{ fontSize: 80, color: "#9e9e9e" }} />
      <Typography variant="h5" mt={2}>
        Tienda no disponible por el momento
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Esta tienda se encuentra inactiva o ha expirado su periodo de prueba o suscripción.
      </Typography>
    </Box>
  );
};

export default TiendaInactiva;
