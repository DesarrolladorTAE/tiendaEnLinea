// src/pages/LegalTerms.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import terminos from "../../utils/terminos";
import LandingFooterSection from "../../components/landing/LandingFooterSection";

const LegalTerms = () => {
  return (
    <Box
      sx={{
        bgcolor: "#f9f9f9",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar fijo */}
      <AppBar position="fixed" sx={{ bgcolor: "#0077B6" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#fff" }}>
            TeLoRecargo
          </Typography>
          <Box>
            <Button
              component={RouterLink}
              to="/"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                textTransform: "none",
                mr: 2,
              }}
            >
              Inicio
            </Button>
            <Button
              component={RouterLink}
              to="/loginmui"
              variant="contained"
              sx={{
                bgcolor: "#00B4D8",
                color: "#fff",
                borderRadius: 9999,
                textTransform: "none",
                "&:hover": { bgcolor: "#009ec1" },
              }}
            >
              Iniciar sesión / Registrarme
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Espaciador para el navbar fijo */}
      <Toolbar />

      {/* Contenido legal */}
      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {terminos.titulo}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {terminos.subtitulo}
        </Typography>

        {terminos.secciones.map((seccion, index) => (
          <Box key={index} sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {seccion.titulo}
            </Typography>
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-line", color: "#333" }}
            >
              {seccion.contenido}
            </Typography>
          </Box>
        ))}
      </Container>

      {/* Footer sin enlaces */}
      <LandingFooterSection showLinks={false} />
    </Box>
  );
};

export default LegalTerms;
