// src/components/suscripciones/ModalPlanesComplementos.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import SwipeableViews from "react-swipeable-views";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";

const ModalPlanesComplementos = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [indexPlanes, setIndexPlanes] = useState(0);
  const [indexComp, setIndexComp] = useState(0);

  const handlePrev = (setIndex, total) => {
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (setIndex, total) => {
    setIndex((prev) => (prev + 1) % total);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold" }}>
        📦 Planes y Complementos
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: "#f9fafb" }}>
        <Tabs
          value={tab}
          onChange={(_, newTab) => setTab(newTab)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Planes" />
          <Tab label="Complementos" />
        </Tabs>

        {tab === 0 && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <IconButton onClick={() => handlePrev(setIndexPlanes, planes.length)}>
                <ArrowBack />
              </IconButton>
              <Typography variant="subtitle2">
                Plan {indexPlanes + 1}/{planes.length}
              </Typography>
              <IconButton onClick={() => handleNext(setIndexPlanes, planes.length)}>
                <ArrowForward />
              </IconButton>
            </Box>

            <SwipeableViews index={indexPlanes} onChangeIndex={setIndexPlanes} enableMouseEvents>
              {planes.map((plan, i) => (
                <Box key={i} px={1}>
                  <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        {plan.nombre}
                      </Typography>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        {plan.precio_mensual === 0
                          ? "GRATIS"
                          : `$${plan.precio_mensual.toLocaleString()} MXN/mes`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {plan.descripcion}
                      </Typography>
                      <Stack spacing={0.5} mt={1}>
                        {plan.beneficios?.map((b, idx) => (
                          <Typography key={idx} variant="caption">
                            ✅ {b}
                          </Typography>
                        ))}
                      </Stack>
                      {plan.promociones?.length > 0 && (
                        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                          {plan.promociones.map((promo, idx) => (
                            <Chip
                              key={idx}
                              label={`🎁 Paga ${promo.paga} → Recibe ${promo.recibe}`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </SwipeableViews>
          </>
        )}

        {tab === 1 && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <IconButton onClick={() => handlePrev(setIndexComp, complementos.length)}>
                <ArrowBack />
              </IconButton>
              <Typography variant="subtitle2">
                Complemento {indexComp + 1}/{complementos.length}
              </Typography>
              <IconButton onClick={() => handleNext(setIndexComp, complementos.length)}>
                <ArrowForward />
              </IconButton>
            </Box>

            <SwipeableViews index={indexComp} onChangeIndex={setIndexComp} enableMouseEvents>
              {complementos.map((comp, i) => (
                <Box key={i} px={1}>
                  <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        {comp.nombre}
                      </Typography>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        ${comp.precio.toLocaleString()} MXN
                      </Typography>
                      {comp.nota && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📝 {comp.nota}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                        <Chip label={comp.tipo} size="small" variant="outlined" />
                        {comp.desde && (
                          <Chip label="Desde" color="info" size="small" variant="outlined" />
                        )}
                      </Stack>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Comprar ya
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </SwipeableViews>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalPlanesComplementos;
