import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const plans = [
  {
    name: "Plan Negocio",
    basePrice: 19900,
    price: "$199 MXN/mes",
    color: "warning",
    features: [
      "2 puntos de venta",
      "100 productos",
      "Envio de Tickets por WhatsApp",
      "Reportes de Ventas",
      "Soporte por WhatsApp y correo",
    ],
    exclude: ["Facturación electrónica"],
  },
  {
    name: "Plan Profesional",
    basePrice: 44900,
    price: "$449 MXN/mes",
    color: "info",
    features: [
      "5 puntos de venta",
      "Productos ilimitados",
      "Reportes detallados",
      "Soporte técnico WhatsApp",
    ],
    extras: ["Facturación disponible (complemento)"],
  },
  {
    name: "Plan Avanzado",
    basePrice: 89900,
    price: "$899 MXN/mes",
    color: "secondary",
    features: [
      "10 puntos de venta",
      "Dominio personalizado",
      "Reportes por tienda y agente",
      "Branding profesional",
      "Capacitación mensual",
      "Soporte prioritario",
    ],
    extras: ["Incluye módulo CFDI (folios aparte)"],
  },
];

const durationOptions = [
  {
    label: "MENSUAL",
    months: 1,
    multiplier: 1,
    description: "Plan Mensual",
  },
  {
    label: "SEMESTRAL",
    months: 7,
    multiplier: 6,
    description: "¡Pagas 6 y obtienes 7 meses!",
  },
  {
    label: "ANUAL",
    months: 12,
    multiplier: 10,
    description: "¡Pagas 10 y obtienes 12 meses!",
  },
];

export default function PricingPlans({ onPlanSelect, loading }) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newIndex) => {
    setTabIndex(newIndex);
  };

  const selectedDuration = durationOptions[tabIndex];

  return (
    <Box>
      {/* Pestañas globales */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        centered
        sx={{ mb: 4 }}
        indicatorColor="primary"
        textColor="primary"
      >
        {durationOptions.map((option, i) => (
          <Tab key={i} label={option.label} />
        ))}
      </Tabs>

      {/* Planes */}
      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        className="mb-4"
      >
        {plans.map((plan, index) => {
          const totalPrice = plan.basePrice * selectedDuration.multiplier;

          return (
            <Card
              key={index}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "divider",
                boxShadow: 0,
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
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(totalPrice / 100)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {selectedDuration.description}
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
                  disabled={loading}
                  onClick={() =>
                    onPlanSelect({
                      ...plan,
                      selectedDuration: selectedDuration.months,
                      selectedPrice: totalPrice,
                      description: selectedDuration.description,
                    })
                  }
                >
                  Seleccionar este plan
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
