import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { Flash, ShieldCheck } from "mdi-material-ui";
import Devices from "@mui/icons-material/Devices";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const features = [
  {
    icon: <Flash fontSize="inherit" />,
    title: "Compra inmediata de saldo",
    desc: `Realiza recargas de tiempo aire en tiempo real con comprobantes 
    electrónicos.`,
  },
  {
    icon: <Devices fontSize="inherit" />,
    title: "Acceso multiplataforma",
    desc: `  Disponible desde cualquier dispositivo. Ideal para operadores muy
    exigentes.`,
  },
  {
    icon: <ShieldCheck fontSize="inherit" />,
    title: "Gestión segura y confiable",
    desc: "Con Roles Personalizados (Agentes) y Autenticación por WhatsApp.",
  },
  {
    icon: <AssessmentIcon fontSize="inherit" />,
    title: "Tickets automáticos",
    desc: "Generación de tickets de recargas y paquetes al alcance de un clic.",
  },
  {
    icon: <CloudDoneIcon fontSize="inherit" />,
    title: "Respaldos en la nube",
    desc: `Tu información siempre segura y disponible gracias al Desarrollo 
    profesional.`,
  },
  {
    icon: <SupportAgentIcon fontSize="inherit" />,
    title: "Soporte técnico dedicado",
    desc: "Asistencia rápida y personalizada ante cualquier inconveniente.",
  },
];

const LandingFeaturesSection = () => {
  return (
    <Box id="features" sx={{ py: 20, backgroundColor: "#f9f9f9" }}>
      
      {/* Logo encima del título */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Box
          component="img"
          src="/assets/img/logo1.png"
          alt="Telorecargo logo"
          sx={{ maxWidth: 280, width: "100%" }}
        />
      </Box>

      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        gutterBottom
        sx={{ animation: "riseIn 0.8s ease-out forwards", opacity: 0 }}
      >
        ¿Qué me ofrece este Servicio?
      </Typography>

      <Grid container spacing={6} justifyContent="center" mt={6}>
        {features.map((item, i) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={i}
            sx={{ display: "flex" }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 3,
                width: "100%",
                minHeight: 300,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                animation: "fadeInUp 0.6s ease-out forwards",
                animationDelay: `${i * 0.2}s`,
                opacity: 0,
                cursor: "pointer",
                "&:hover": {
                  background: "linear-gradient(to bottom right, #00B4D8, #0077B6)",
                  color: "white",
                  transform: "scale(1.03)",
                },
              }}
            >
              <Box
                sx={{
                  fontSize: 48,
                  color: "#00B4D8",
                  mb: 2,
                  width: 80,
                  height: 80,
                  mx: "auto",
                  borderRadius: "50%",
                  backgroundColor: "#e0f7fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "0.3s ease",
                  "&:hover": {
                    backgroundColor: "white",
                    animation: "shake 0.3s ease",
                  },
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-line",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(-3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </Box>
  );
};


export default LandingFeaturesSection;
