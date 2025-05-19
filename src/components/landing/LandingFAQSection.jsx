import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grow
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    question: "📱 ¿Qué es TeLoRecargo?",
    answer:
      "Es una plataforma digital para enviar recargas electrónicas a cualquier operador móvil en México de forma fácil, rápida y segura."
  },
  {
    question: "📲 ¿Puedo usarlo desde el celular?",
    answer:
      "¡Claro! Puedes acceder desde cualquier navegador móvil sin necesidad de instalar ninguna app. Es totalmente responsive."
  },
  {
    question: "💳 ¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de crédito, débito y monederos electrónicos como Conekta para una experiencia sin fricciones."
  },
  {
    question: "⏱️ ¿Las recargas son instantáneas?",
    answer:
      "Sí, las recargas se procesan en tiempo real y recibirás un comprobante electrónico al instante."
  },
  {
    question: "🔐 ¿Es seguro usar la plataforma?",
    answer:
      "Totalmente. Utilizamos conexiones cifradas, autenticación y validaciones de seguridad modernas."
  },
  {
    question: "👥 ¿Puedo administrar mis clientes o contactos?",
    answer:
      "Sí. Puedes guardar contactos frecuentes, organizarlos y realizar recargas sin volver a escribir sus datos."
  },
  {
    question: "📊 ¿La plataforma incluye reportes?",
    answer:
      "¡Sí! Podrás consultar reportes de ventas, historial de recargas y más desde tu panel de usuario o administrador."
  },
  {
    question: "🆓 ¿Ofrecen algún plan gratuito?",
    answer:
      "Sí. Te damos 14 días de prueba gratis para que explores todas las funcionalidades antes de elegir un plan de pago."
  }
];

const LandingFAQSection = () => {
  return (
    <Box id="faqs" sx={{ py: 10, backgroundColor: "#f4faff", px: 2 }}>
      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        gutterBottom
      >
        ❓ Preguntas Frecuentes
      </Typography>

      <Typography
        variant="subtitle1"
        color="text.secondary"
        textAlign="center"
        maxWidth="md"
        mx="auto"
        mb={6}
      >
        Encuentra aquí las respuestas a las dudas más comunes de nuestros usuarios.
      </Typography>

      <Box maxWidth="md" mx="auto">
        {faqs.map((faq, i) => (
          <Grow in key={i} timeout={400 + i * 150}>
            <Accordion
              disableGutters
              elevation={3}
              sx={{
                mb: 2,
                borderRadius: 2,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                "&:before": {
                  display: "none"
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 3,
                  py: 2,
                  "& .MuiAccordionSummary-content": {
                    margin: 0
                  }
                }}
              >
                <Typography fontWeight="bold" fontSize={{ xs: "0.95rem", md: "1.05rem" }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 2 }}>
                <Typography fontSize={{ xs: "0.9rem", md: "1rem" }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grow>
        ))}
      </Box>
    </Box>
  );
};

export default LandingFAQSection;
