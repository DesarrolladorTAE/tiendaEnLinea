import React, { useState, useEffect } from "react";
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
import {
  ArrowBack,
  ArrowForward,
  Close as CloseIcon,
} from "@mui/icons-material";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";
import { showSuccess, showError } from "../../utils/alerts";
import axiosClient from "../../config/axiosClient";
import CreditCardIcon from "@mui/icons-material/CreditCard";

const ModalPlanesComplementos = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [indexPlanes, setIndexPlanes] = useState(0);
  const [indexComp, setIndexComp] = useState(0);
  const [loadingConekta, setLoadingConekta] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");
  const [conektaLoaded, setConektaLoaded] = useState(false);
  const [modalConektaVisible, setModalConektaVisible] = useState(false);

  const handlePrev = (setIndex, total) => {
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (setIndex, total) => {
    setIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    const scriptAlreadyLoaded = document.querySelector(
      'script[src="https://pay.conekta.com/v1.0/js/conekta-checkout.min.js"]'
    );
    if (!scriptAlreadyLoaded) {
      const script = document.createElement("script");
      script.src = "https://pay.conekta.com/v1.0/js/conekta-checkout.min.js";
      script.async = true;
      script.onload = () => setConektaLoaded(true);
      script.onerror = () =>
        console.error("❌ No se pudo cargar el script de Conekta");
      document.body.appendChild(script);
    } else {
      setConektaLoaded(true);
    }
  }, []);

  const iniciarPago = async ({ concepto, monto, onFinish }) => {
    setLoadingConekta(true);
    try {
      const res = await axiosClient.post("/checkout", { concepto, monto });
      const { checkoutRequestId } = res.data;

      if (!checkoutRequestId) throw new Error("Datos de checkout incompletos");

      setCheckoutId(checkoutRequestId);

      setModalConektaVisible(true);

      setTimeout(() => {
        const targetExists = document.querySelector("#conekta-container");
        if (targetExists && window.ConektaCheckoutComponents) {
          window.ConektaCheckoutComponents.Integration({
            config: {
              checkoutRequestId,
              publicKey: import.meta.env.VITE_CONEKTA_PUBLIC_KEY,
              targetIFrame: "#conekta-container",
              locale: "es",
            },
            options: {
              colorPrimary: "#ED6C02",
              inputType: "minimalMode",
              backgroundMode: "lightMode",
            },
            callbacks: {
              onFinish,
              onErrorPayment: (error) => {
                console.error("❌ Error en pago", error);
                showError("❌ Pago fallido. Intenta nuevamente.");
                setModalConektaVisible(false);
                setCheckoutId("");
              },
              onUserClose: () => {
                showError("⚠️ Pago cancelado por el usuario.");
                setModalConektaVisible(false);
                setCheckoutId("");
              },
            },
          });
        }
      }, 300);
    } catch (err) {
      console.error("Error al crear Checkout:", err.response?.data || err);
      showError("No se pudo iniciar el proceso de pago.");
    } finally {
      setLoadingConekta(false);
    }
  };

  const handleCompraPlan = (plan) => {
    iniciarPago({
      concepto: `PLAN:${plan.plan_id}:1`,
      monto: plan.precio_mensual,
      onFinish: async () => {
        await showSuccess("✅ Pago confirmado. Plan activado.");
        setCheckoutId("");
        onClose();
      },
    });
  };

  const handleCompraComplemento = (comp) => {
    iniciarPago({
      concepto: `Complemento:${comp.complemento_id}`,
      monto: comp.precio,
      onFinish: async () => {
        await showSuccess("✅ Pago confirmado. Complemento activado.");
        await handleSaveSubscription(comp);
        setCheckoutId("");
        onClose();
      },
    });
  };

  const handleSaveSubscription = async (comp) => {
    try {
      const payload = {
        complemento_id: comp.complemento_id,
        cantidad: 1,
        monto: comp.precio,
        status: "active",
      };
      await axiosClient.post("/admin/tiendas/suscripcion", payload);
    } catch (error) {
      console.error("Error al agregar suscripción:", error);
      showError("No se pudo agregar la suscripción.");
    }
  };

  const handleClosePago = () => {
    setModalConektaVisible(false);
    setCheckoutId("");
  };

  return (
    <>
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
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <IconButton
                  onClick={() => handlePrev(setIndexPlanes, planes.length)}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="subtitle2">
                  Plan {indexPlanes + 1}/{planes.length}
                </Typography>
                <IconButton
                  onClick={() => handleNext(setIndexPlanes, planes.length)}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
              <SwipeableViews
                index={indexPlanes}
                onChangeIndex={setIndexPlanes}
                enableMouseEvents
              >
                {planes.map((plan, i) => (
                  <Box key={i} px={1}>
                    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold">
                          {plan.nombre}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          gutterBottom
                        >
                          {plan.precio_mensual === 0
                            ? "GRATIS"
                            : `$${plan.precio_mensual.toLocaleString()} MXN/mes`}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {plan.descripcion}
                        </Typography>
                        <Stack spacing={0.5} mt={1}>
                          {plan.beneficios?.map((b, idx) => (
                            <Typography key={idx} variant="caption">
                              ✅ {b}
                            </Typography>
                          ))}
                        </Stack>
                        {plan.demo ? (
                          <Button
                            variant="outlined"
                            color="info"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled
                          >
                            Gratis los primeros 14 días
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => handleCompraPlan(plan)}
                          >
                            Comprar plan
                          </Button>
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
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <IconButton
                  onClick={() => handlePrev(setIndexComp, complementos.length)}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="subtitle2">
                  Complemento {indexComp + 1}/{complementos.length}
                </Typography>
                <IconButton
                  onClick={() => handleNext(setIndexComp, complementos.length)}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
              <SwipeableViews
                index={indexComp}
                onChangeIndex={setIndexComp}
                enableMouseEvents
              >
                {complementos.map((comp, i) => (
                  <Box key={i} px={1}>
                    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold">
                          {comp.nombre}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          gutterBottom
                        >
                          ${comp.precio.toLocaleString()} MXN
                        </Typography>
                        {comp.nota && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            📝 {comp.nota}
                          </Typography>
                        )}
                        <Stack
                          direction="row"
                          spacing={1}
                          mt={2}
                          flexWrap="wrap"
                        >
                          <Chip
                            label={comp.tipo}
                            size="small"
                            variant="outlined"
                          />
                          {comp.desde && (
                            <Chip
                              label="Desde"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleCompraComplemento(comp)}
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

      {/* Modal de Pago embebido con estilo mejorado */}
      <Dialog
        open={modalConektaVisible}
        onClose={handleClosePago}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 10,
            backgroundColor: "#fff",
            position: "relative",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
            color: "#333",
            px: 3,
            pt: 2,
          }}
        >
          <CreditCardIcon color="warning" />
          Procesando tu pago
        </DialogTitle>

        <IconButton
          onClick={handleClosePago}
          sx={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent sx={{ p: 0, height: 600, overflow: "hidden" }}>
          <Box
            id="conekta-container"
            sx={{
              height: "100%",
              width: "100%",
              border: "none",
              overflow: "hidden",
              "& iframe": {
                border: "none",
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalPlanesComplementos;
