import React from "react";
import { Box, Typography, Grid, Paper, Avatar } from "@mui/material";

const testimonials = [
  {
    name: "María López",
    comment: "Excelente plataforma. Muy fácil de usar y confiable para mis recargas.",
    avatar: "/assets/images/testimonials/user1.jpg"
  },
  {
    name: "Juan Pérez",
    comment: "Me ahorra mucho tiempo. Ya no necesito ir a tiendas físicas.",
    avatar: "/assets/images/testimonials/user2.jpg"
  },
  {
    name: "Ana Ramírez",
    comment: "Los precios son buenos y el sistema nunca falla. 10/10.",
    avatar: "/assets/images/testimonials/user3.jpg"
  },
];

const LandingTestimonialsSection = () => {
  return (
    <Box id="testimonials" sx={{ py: 10 }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Lo que dicen nuestros usuarios
      </Typography>

      <Grid container spacing={4} justifyContent="center" mt={4}>
        {testimonials.map((t, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper sx={{ p: 4, borderRadius: 3, height: "100%" }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar src={t.avatar} alt={t.name} />
                <Typography fontWeight="bold">{t.name}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                “{t.comment}”
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LandingTestimonialsSection;
