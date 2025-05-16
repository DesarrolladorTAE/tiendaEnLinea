import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { Bolt, PhoneAndroid, Payment } from "@mui/icons-material";

const features = [
  { icon: <Bolt />, title: "Recargas al instante", desc: "Conectamos con todos los operadores de México." },
  { icon: <PhoneAndroid />, title: "Compatible con cualquier equipo", desc: "Funciona desde navegador o celular." },
  { icon: <Payment />, title: "Pagos seguros", desc: "Integración con métodos de pago nacionales." },
];

const LandingFeaturesSection = () => {
  return (
    <Box id="features" sx={{ py: 10, backgroundColor: "#f9f9f9" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        ¿Por qué usar Telorecargo?
      </Typography>

      <Grid container spacing={4} justifyContent="center" mt={4}>
        {features.map((item, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3, height: "100%" }}>
              <Box sx={{ fontSize: 48, color: "#00C2FF", mb: 2 }}>{item.icon}</Box>
              <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
              <Typography variant="body2" mt={1}>{item.desc}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LandingFeaturesSection;
