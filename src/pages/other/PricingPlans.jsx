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
import planes from "../../utils/planes";

const durationOptions = [
  { label: "MENSUAL", paga: 1, recibe: 1, description: "Plan mensual" },
  { label: "SEMESTRAL", paga: 5, recibe: 6, description: "¡Pagas 5 y obtienes 6 meses!" },
  { label: "ANUAL", paga: 10, recibe: 12, description: "¡Pagas 10 y obtienes 12 meses!" },
];

export default function PricingPlans({ onPlanSelect, loading }) {
  const [tabIndex, setTabIndex] = useState(0);
  const selectedPromo = durationOptions[tabIndex];

  const handleTabChange = (_, newIndex) => setTabIndex(newIndex);

  return (
    <Box>
      {/* Tabs de duración */}
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

      {/* Grid de planes */}
      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        className="mb-4"
      >
        {planes
          .filter((plan) => !plan.demo) // omitimos plan demo
          .map((plan, index) => {
            const pricePerMonth = plan.precio_mensual;
            const totalPrice = pricePerMonth * selectedPromo.paga;

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
                        {plan.nombre}
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight={600}>
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(totalPrice)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPromo.description}
                      </Typography>
                    </div>

                    <Divider />

                    <Stack spacing={1}>
                      {plan.beneficios?.map((feature, i) => (
                        <Typography key={i} variant="body2" color="text.secondary">
                          <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                          {feature}
                        </Typography>
                      ))}
                      {plan.restricciones?.map((item, i) => (
                        <Typography key={i} variant="body2" color="error.main">
                          <CancelIcon fontSize="small" sx={{ mr: 1 }} />
                          {item}
                        </Typography>
                      ))}
                      {plan.incluyeSinCosto?.map((item, i) => (
                        <Typography key={i} variant="body2" color="info.main">
                          <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                          Incluye {item}
                        </Typography>
                      ))}
                      {plan.complementosDisponibles?.map((item, i) => (
                        <Typography key={i} variant="body2" color="info.main">
                          <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                          Puedes añadir {item}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                    disabled={loading}
                    onClick={() =>
                      onPlanSelect({
                        id: plan.plan_id,
                        name: plan.nombre,
                        selectedDuration: selectedPromo.recibe,
                        selectedPrice: totalPrice,
                        mesesPagados: selectedPromo.paga,
                        mesesObtenidos: selectedPromo.recibe,
                        description: selectedPromo.description,
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
