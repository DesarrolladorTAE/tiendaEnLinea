import React from "react";
import { Box, Grid, Typography } from "@mui/material";

const steps = [
  { emoji: "🔐", title: "Inicia sesión", desc: "Accede a tu cuenta o crea una en segundos." },
  { emoji: "🎁", title: "Selecciona un paquete", desc: "Escoge entre muchas opciones de recarga." },
  { emoji: "📇", title: "Elige un contacto", desc: "Selecciona un número o crea uno nuevo." },
  { emoji: "💳", title: "Verifica tu saldo", desc: "Asegurate que cuentes con suficiente saldo." },
  { emoji: "✅", title: "Recarga completada", desc: "El saldo se aplica en tiempo real." },
  { emoji: "🧾", title: "Descarga tu comprobante", desc: "Obtén un ticket digital en Ventas." },
  { emoji: "🛟", title: "Soporte disponible", desc: "¿Dudas? Te apoyamos de inmediato." },
];

const HowToRechargeSpaced = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, md: 10 },
        py: 10,
        bgcolor: "#fff",
      }}
    >
      <Grid container spacing={10} alignItems="center">
        {/* PASOS */}
        <Grid item xs={12} md={6}>
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              ¿Cómo hacer una recarga? 🚀
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={6}>
              Con nuestra plataforma el proceso es rápido, sencillo y totalmente seguro. Sigue estos pasos:
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 4, // más espacio entre tarjetas
              mt: 4,
            }}
          >
            {steps.map((step, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  p: 3, // más padding interno
                  bgcolor: "#f9f9f9",
                  borderRadius: 2,
                  borderLeft: "4px solid #1976d2",
                  boxShadow: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "linear-gradient(90deg, #1976d2, #00bcd4)",
                    color: "white",
                  },
                }}
              >
                <Typography fontSize={26}>{step.emoji}</Typography>
                <Box>
                  <Typography fontWeight="bold">{step.title}</Typography>
                  <Typography fontSize={14}>{step.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Grid>

        {/* IMAGEN */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="/assets/img/recargaabout.gif"
            alt="Mockup recarga"
            style={{
              maxWidth: "100%",
              width: "400px",
              height: "auto",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HowToRechargeSpaced;
