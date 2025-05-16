import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    question: "¿Qué es Telorecargo?",
    answer:
      "Es una plataforma para enviar recargas electrónicas a cualquier operador móvil en México de forma fácil y rápida."
  },
  {
    question: "¿Puedo usarlo desde el celular?",
    answer:
      "Sí, puedes acceder desde cualquier navegador móvil sin necesidad de instalar ninguna app."
  },
  {
    question: "¿Cómo funcionan los planes?",
    answer:
      "Puedes iniciar con el plan gratuito por 14 días y luego elegir uno de los planes de pago según tus necesidades."
  }
];

const LandingFAQSection = () => {
  return (
    <Box id="faqs" sx={{ py: 10, backgroundColor: "#f9f9f9" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Preguntas frecuentes
      </Typography>

      <Box maxWidth="md" mx="auto" mt={4}>
        {faqs.map((faq, i) => (
          <Accordion key={i}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight="bold">{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default LandingFAQSection;
