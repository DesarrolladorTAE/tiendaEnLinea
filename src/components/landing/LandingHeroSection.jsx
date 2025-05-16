import React from "react";
import { Box, Typography, Button, Grid } from "@mui/material";

const LandingHeroSection = () => {
  return (
    <Box sx={{ backgroundColor: "#2d3e50", color: "#fff", py: 10 }}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            RECARGA <br />
            <Box component="span" color="#00C2FF">Tu saldo</Box> fácil y rápido.
          </Typography>
          <Typography variant="body1" color="#cfcfcf" maxWidth={480} gutterBottom>
            Telorecargo te permite enviar saldo a múltiples operadores desde un solo lugar. ¡Hazlo al instante!
          </Typography>
          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" color="success">Empezar ahora</Button>
            <Button variant="outlined" color="inherit" href="/loginmui">Iniciar sesión</Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box component="img"
            src="/assets/images/app/banner-mobile.png"
            alt="App"
            sx={{ width: "100%", maxWidth: 400 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandingHeroSection;
