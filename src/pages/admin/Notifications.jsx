// src/pages/admin/Notifications.jsx
import React, { useEffect } from "react";
import { Box, Typography, Divider, Paper, Stack, Chip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

import NotificacionesForm from "../../components/admin/NotificacionesForm";
import NotificacionesHistorial from "../../components/admin/NotificacionesHistorial";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const Notifications = () => {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Panel de Notificaciones";
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(1000px 600px at 20% 0%, ${alpha(
                theme.palette.primary.main,
                0.25
              )} 0%, transparent 55%),
               radial-gradient(900px 600px at 90% 10%, ${alpha(
                 theme.palette.secondary.main,
                 0.18
               )} 0%, transparent 60%),
               ${theme.palette.background.default}`
            : `radial-gradient(1000px 600px at 20% 0%, ${alpha(
                theme.palette.primary.main,
                0.14
              )} 0%, transparent 55%),
               radial-gradient(900px 600px at 90% 10%, ${alpha(
                 theme.palette.secondary.main,
                 0.10
               )} 0%, transparent 60%),
               linear-gradient(180deg, ${alpha("#F7FAFF", 1)} 0%, ${alpha(
                "#FFFFFF",
                1
              )} 60%, ${alpha("#F6F8FC", 1)} 100%)`,
      }}
    >
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        sx={{ mb: 3 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.75
            )} 0%, ${alpha(theme.palette.background.paper, 0.55)} 100%)`,
            backdropFilter: "blur(10px)",
            boxShadow: `0 18px 60px ${alpha("#000", 0.08)}`,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: -0.6,
                lineHeight: 1.1,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Panel de Notificaciones
            </Typography>

            <Typography
              sx={{ color: "text.secondary", mt: 0.5, maxWidth: 820 }}
            >
              Gestión de solicitudes de saldo y envío manual de notificaciones.
              Interfaz optimizada para evitar doble envío y con feedback visual.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="Admin"
              sx={{
                fontWeight: 800,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            />
            <Chip
              label="Seguro"
              sx={{
                fontWeight: 800,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.main,
              }}
            />
            <Chip
              label="Responsive"
              sx={{
                fontWeight: 800,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.info.main, 0.12),
                color: theme.palette.info.main,
              }}
            />
          </Stack>
        </Stack>
      </MotionBox>

      {/* Solicitudes */}
      <MotionPaper
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.9
          )} 0%, ${alpha(theme.palette.background.paper, 0.65)} 100%)`,
          backdropFilter: "blur(10px)",
          boxShadow: `0 16px 50px ${alpha("#000", 0.08)}`,
        }}
      >
        <NotificacionesHistorial soloSolicitudes={true} />
      </MotionPaper>

      <Divider sx={{ mb: 4, opacity: 0.7 }} />

      {/* Manual */}
      <MotionPaper
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.92
          )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
          backdropFilter: "blur(10px)",
          boxShadow: `0 16px 50px ${alpha("#000", 0.08)}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
          Enviar Notificación Manual
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 2 }}>
          Envía mensajes con imagen, emojis o masivo a usuarios.
        </Typography>

        <NotificacionesForm />
      </MotionPaper>
    </Box>
  );
};

export default Notifications;