import React from "react";
import { Box, Typography, Grid } from "@mui/material";

const LandingAboutSection = () => {
  return (
    <Box id="about" sx={{ py: 10 }}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box component="img"
            src="/assets/images/app/about-image.png"
            alt="Nosotros"
            sx={{ width: "100%", maxWidth: 500 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tu aliado para todas tus recargas
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Automatiza tus procesos, gana tiempo y ofrece el mejor servicio con nuestra plataforma de recargas multioperador.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Integra tu negocio a Telorecargo y empieza a gestionar tus clientes, saldos y pagos desde una sola interfaz web.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandingAboutSection;
