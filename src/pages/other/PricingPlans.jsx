import React from "react";
import { Box, Card, CardContent, Typography, Button, Stack, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const plans = [
  {
    name: "Plan Negocio",
    price: "$199 MXN/mes",
    priceCentavos: 19900,
    features: [
      "2 puntos de venta",
      "100 productos",
      "Registro de compras",
      "Tickets WhatsApp/correo",
      "Reportes mensuales",
      "Soporte por WhatsApp y correo",
    ],
    exclude: ["Pasarela de pago", "Facturación electrónica"],
    color: "warning",
  },
  {
    name: "Plan Profesional",
    price: "$449 MXN/mes",
    priceCentavos: 44900,
    features: [
      "5 puntos de venta",
      "Productos ilimitados",
      "Reportes detallados",
      "Control por sucursal",
      "Soporte técnico WhatsApp",
    ],
    extras: ["Facturación disponible (complemento)"],
    color: "info",
  },
  {
    name: "Plan Avanzado",
    price: "$899 MXN/mes",
    priceCentavos: 89900,
    features: [
      "10 puntos de venta",
      "Dominio personalizado",
      "Reportes por tienda y agente",
      "Branding profesional",
      "Capacitación mensual",
      "Soporte prioritario",
    ],
    extras: ["Incluye módulo CFDI (folios aparte)"],
    color: "secondary",
  },
];

export default function PricingPlans({ onPlanSelect, loading }) {
  return (
    <Box
      display="grid"
      gap={3}
      gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
      className="mb-4"
    >
      {plans.map((plan, index) => (
        <Card
          key={index}
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: "divider",
            boxShadow: 0,
            transition: "all 0.3s ease-in-out",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            "&:hover": {
              borderColor: "primary.main",
              boxShadow: 3,
              cursor: "pointer",
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              <div>
                <Typography variant="h6" gutterBottom>
                  {plan.name}
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={600}>
                  {plan.price}
                </Typography>
              </div>

              <Divider />

              <Stack spacing={1}>
                {plan.features.map((feature, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">
                    <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                    {feature}
                  </Typography>
                ))}
                {plan.exclude?.map((item, i) => (
                  <Typography key={i} variant="body2" color="error.main">
                    <CancelIcon fontSize="small" sx={{ mr: 1 }} />
                    {item}
                  </Typography>
                ))}
                {plan.extras?.map((item, i) => (
                  <Typography key={i} variant="body2" color="info.main">
                    <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              color={plan.color}
              sx={{ mt: 3 }}
              onClick={() => onPlanSelect(plan)}
            >
              Seleccionar
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
