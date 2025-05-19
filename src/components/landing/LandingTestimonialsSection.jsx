import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Rating,
  IconButton,
  Paper,
  Stack,
  Fade
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

const testimonials = [
  {
    name: "Ana Ramírez",
    comment: "💸 Precios geniales y el sistema nunca falla. 10/10 ⭐",
    avatar: "/assets/images/testimonials/user1.jpg",
    rating: 5
  },
  {
    name: "María López",
    comment: "😊 ¡Excelente plataforma! Muy fácil de usar y súper confiable.",
    avatar: "/assets/images/testimonials/user2.jpg",
    rating: 5
  },
  {
    name: "Juan Pérez",
    comment: "🚀 Me ahorra mucho tiempo. ¡Ya no voy a tiendas físicas!",
    avatar: "/assets/images/testimonials/user3.jpg",
    rating: 4
  },
  {
    name: "Luis Hernández",
    comment: "📱 Muy buena interfaz, intuitiva y rápida.",
    avatar: "/assets/images/testimonials/user4.jpg",
    rating: 5
  },
  {
    name: "Diana Torres",
    comment: "🔒 Me gusta lo seguro que se siente el sistema.",
    avatar: "/assets/images/testimonials/user5.jpg",
    rating: 4
  },
  {
    name: "Carlos Mendoza",
    comment: "💬 Siempre disponible. Nunca falla cuando más lo necesito.",
    avatar: "/assets/images/testimonials/user6.jpg",
    rating: 5
  },
  {
    name: "Fernanda Ruiz",
    comment: "🎯 Sencillo, directo, sin complicaciones. Recomendado.",
    avatar: "/assets/images/testimonials/user7.jpg",
    rating: 5
  }
];

const LandingTestimonialsCarousel = () => {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;

  const next = () => setIndex((index + 1) % total);
  const prev = () => setIndex((index - 1 + total) % total);

  const current = testimonials[index];
  const left = testimonials[(index - 1 + total) % total];
  const right = testimonials[(index + 1) % total];

  return (
    <Box id="testimonials" sx={{ py: 10, px: 2, backgroundColor: "#f8fafd" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Lo que dicen nuestros usuarios 🗣️
      </Typography>
      <Typography variant="subtitle1" textAlign="center" color="text.secondary" mb={5}>
        Valoraciones reales de nuestros clientes satisfechos.
      </Typography>

      {/* Avatares centrales */}
      <Stack direction="row" spacing={4} justifyContent="center" alignItems="center" mb={3}>
        <Avatar
          src={left.avatar}
          alt={left.name}
          sx={{ width: 60, height: 60, opacity: 0.5 }}
        />
        <Avatar
          src={current.avatar}
          alt={current.name}
          sx={{
            width: 100,
            height: 100,
            border: "4px solid #00C2FF",
            zIndex: 1
          }}
        />
        <Avatar
          src={right.avatar}
          alt={right.name}
          sx={{ width: 60, height: 60, opacity: 0.5 }}
        />
      </Stack>

      {/* Testimonio */}
      <Box position="relative" maxWidth={600} mx="auto">
        <IconButton
          onClick={prev}
          sx={{ position: "absolute", left: -30, top: "40%" }}
        >
          <ArrowBackIos />
        </IconButton>

        <IconButton
          onClick={next}
          sx={{ position: "absolute", right: -30, top: "40%" }}
        >
          <ArrowForwardIos />
        </IconButton>

        <Fade in key={index} timeout={500}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
            <Typography fontWeight="bold" gutterBottom>
              {current.name}
            </Typography>
            <Rating value={current.rating} readOnly sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              “{current.comment}”
            </Typography>
          </Paper>
        </Fade>
      </Box>
    </Box>
  );
};

export default LandingTestimonialsCarousel;
