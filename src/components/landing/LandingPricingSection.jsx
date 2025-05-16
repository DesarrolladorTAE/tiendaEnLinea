import React from "react";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";

const plans = [
  { name: "Gratis", price: "0", description: "14 días de prueba", button: "Empezar", highlight: false },
  { name: "Negocio", price: "199", description: "Funciones esenciales", button: "Elegir plan", highlight: true },
  { name: "Avanzado", price: "899", description: "Todo incluido + dominio", button: "Elegir plan", highlight: false },
];

const LandingPricingSection = () => {
  return (
    <Box id="pricing" sx={{ py: 10, backgroundColor: "#f0f8ff" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Planes para todos
      </Typography>

      <Grid container spacing={4} justifyContent="center" mt={4}>
        {plans.map((plan, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper elevation={plan.highlight ? 6 : 1} sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: plan.highlight ? "#00C2FF" : "#fff",
              color: plan.highlight ? "#fff" : "inherit",
              textAlign: "center"
            }}>
              <Typography variant="h6" fontWeight="bold">{plan.name}</Typography>
              <Typography variant="h3" fontWeight="bold" my={1}>${plan.price}</Typography>
              <Typography variant="body2" mb={2}>{plan.description}</Typography>
              <Button variant={plan.highlight ? "contained" : "outlined"} color="inherit">
                {plan.button}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LandingPricingSection;
