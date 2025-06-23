// src/components/suscripciones/ModalPlanesComplementos.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Box,
  Divider,
} from "@mui/material";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";

const ModalPlanesComplementos = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.3rem" }}>
        📦 Planes y Complementos Disponibles
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#f9fafb" }}>
        {/* PLANES */}
        <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 2 }}>
          🧾 Planes
        </Typography>
        <Grid container spacing={3} mb={4}>
          {planes.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.plan_id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {plan.nombre}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {plan.precio_mensual === 0
                      ? "GRATIS"
                      : `$${plan.precio_mensual.toLocaleString()} MXN`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {plan.descripcion}
                  </Typography>

                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={0.5}>
                    {plan.beneficios?.map((beneficio, i) => (
                      <Typography key={i} variant="caption" color="text.secondary">
                        ✅ {beneficio}
                      </Typography>
                    ))}
                  </Stack>

                  {plan.promociones?.length > 0 && (
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                      {plan.promociones.map((promo, i) => (
                        <Chip
                          key={i}
                          label={`🎁 Paga ${promo.paga} → Recibe ${promo.recibe}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>
                <CardActions sx={{ mt: "auto", px: 2, pb: 2 }}>
                  <Button fullWidth variant="contained" color="primary">
                    Seleccionar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* COMPLEMENTOS */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          🧩 Complementos
        </Typography>
        <Grid container spacing={3}>
          {complementos.map((comp) => (
            <Grid item xs={12} sm={6} md={4} key={comp.complemento_id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {comp.nombre}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    ${comp.precio.toLocaleString()} MXN
                  </Typography>

                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                    <Chip label={comp.tipo} size="small" variant="outlined" />
                    {comp.desde && (
                      <Chip
                        label="Desde"
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  {comp.nota && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        📝 {comp.nota}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ mt: "auto", px: 2, pb: 2 }}>
                  <Button fullWidth variant="outlined" color="secondary">
                    Agregar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPlanesComplementos;
