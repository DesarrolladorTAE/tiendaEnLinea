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
  ButtonGroup,
  Divider,
  Grid,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";
import {
  ArrowBack,
  ArrowForward,
  Close as CloseIcon,
  CheckCircleRounded,
} from "@mui/icons-material";
import complementos from "../../utils/complementos";
import { showSuccess, showError } from "../../utils/alerts";
import axiosClient from "../../config/axiosClient";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import usePlanesPromos from "../../hooks/usePlanesPromos";

/* ===== helpers ===== */
function mesesObtenidos(plan, mesesPagados) {
  const match =
    Array.isArray(plan?.promociones) &&
    plan.promociones.find((p) => Number(p?.paga) === Number(mesesPagados));
  return match ? Number(match.recibe) : Number(mesesPagados);
}
function money(n) {
  const v = Number(n || 0);
  return `$${v.toLocaleString()} MXN`;
}

const ModalPlanesComplementos = ({ open, onClose }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));

  const [tab, setTab] = useState(0);
  const [indexPlanes, setIndexPlanes] = useState(0);
  const [indexComp, setIndexComp] = useState(0);
  const [loadingConekta, setLoadingConekta] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");
  const [conektaLoaded, setConektaLoaded] = useState(false);
  const [modalConektaVisible, setModalConektaVisible] = useState(false);

  // meses a pagar por plan
  const [mesesSeleccionados, setMesesSeleccionados] = useState({});
  const setMesesPlan = (planId, m) =>
    setMesesSeleccionados((s) => ({ ...s, [planId]: m }));

  // hook con decoraciones y 5%
  const {
    planes: planesDecorados,
    eligibleRef,
    percentRef,
  } = usePlanesPromos();

  const handlePrev = (setIndex, total) =>
    setIndex((p) => (p - 1 + total) % total);
  const handleNext = (setIndex, total) => setIndex((p) => (p + 1) % total);

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

  /* ====== pago con verificación de descuento en backend ====== */
  const iniciarPago = async ({ concepto, monto, onFinish }) => {
    setLoadingConekta(true);
    try {
      const evalResp = await axiosClient.post("/referidos/descuento", {
        concepto,
        monto,
      });
      const { monto_final } = evalResp.data || {};
      const finalToCharge =
        typeof monto_final === "number" ? monto_final : monto;

      const res = await axiosClient.post("/checkout", {
        concepto,
        monto: finalToCharge,
      });
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
              colorPrimary: "#0ea5e9",
              inputType: "minimalMode",
              backgroundMode: "lightMode",
            },
            callbacks: {
              onFinish,
              onErrorPayment: () => {
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
      }, 200);
    } catch (err) {
      console.error("Error al iniciar pago:", err?.response?.data || err);
      showError("No se pudo iniciar el proceso de pago.");
      setModalConektaVisible(false);
      setCheckoutId("");
    } finally {
      setLoadingConekta(false);
    }
  };

  const handleCompraPlan = (plan) => {
    const mesesPagados = Number(mesesSeleccionados[plan.plan_id] ?? 1);
    const montoBase = Number(plan.precio_mensual) * mesesPagados;
    iniciarPago({
      concepto: `PLAN:${plan.plan_id}:${mesesPagados}`,
      monto: montoBase,
      onFinish: async () => {
        await showSuccess("✅ Pago confirmado. Plan activado.");
        setCheckoutId("");
        onClose();
      },
    });
  };

  const handleCompraComplemento = (comp) => {
    iniciarPago({
      concepto: `COMPLEMENTO:${comp.complemento_id}:1`,
      monto: comp.precio,
      onFinish: async () => {
        await showSuccess("✅ Pago confirmado. Complemento activado.");
        setCheckoutId("");
        onClose();
      },
    });
  };

  const handleClosePago = () => {
    setModalConektaVisible(false);
    setCheckoutId("");
  };

  /* ===== UI ===== */
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md" // más compacto y sin “mar de blanco”
        fullScreen={isXs}
        PaperProps={{
          sx: {
            borderRadius: isXs ? 0 : 3,
            overflow: "hidden",
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 2 },
            fontWeight: 800,
            color: "common.white",
            background:
              "linear-gradient(135deg,#0ea5e9 0%,#6d28d9 50%,#f97316 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <Typography
            component="span"
            variant={isSm ? "h6" : "h5"}
            fontWeight={800}
          >
            📦 Planes y Complementos
          </Typography>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ px: { xs: 1.25, md: 2 }, py: { xs: 1, md: 1.75 } }}
        >
          <Box
            sx={{
              mb: { xs: 1, md: 1.5 },
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 1,
              p: { xs: 0.5, md: 0.75 },
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, t) => setTab(t)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              sx={{ px: { xs: 0.5, md: 1 } }}
            >
              <Tab label="Planes" />
              <Tab label="Complementos" />
            </Tabs>
          </Box>

          {tab === 0 && (
            <>
              {/* navegación de planes */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <IconButton
                  onClick={() =>
                    handlePrev(setIndexPlanes, planesDecorados.length)
                  }
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Plan {indexPlanes + 1}/{planesDecorados.length}
                </Typography>
                <IconButton
                  onClick={() =>
                    handleNext(setIndexPlanes, planesDecorados.length)
                  }
                >
                  <ArrowForward />
                </IconButton>
              </Stack>

              <SwipeableViews
                index={indexPlanes}
                onChangeIndex={setIndexPlanes}
                enableMouseEvents
              >
                {planesDecorados.map((plan, i) => {
                  const mesesPagados = Number(
                    mesesSeleccionados[plan.plan_id] ?? 1
                  );
                  const mesesTotales = mesesObtenidos(plan, mesesPagados);
                  const mensualBase = Number(plan.precio_mensual);
                  const mensualConRef = Number(
                    plan.precio_con_ref ?? plan.precio_mensual
                  );
                  const subtotalBase = plan.demo
                    ? 0
                    : mensualBase * mesesPagados;
                  const subtotalConRef = plan.demo
                    ? 0
                    : mensualConRef * mesesPagados;
                  const descuentoEstimado = Math.max(
                    0,
                    subtotalBase - subtotalConRef
                  );

                  return (
                    <Box key={i} px={{ xs: 0.25, md: 0.5 }}>
                      <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                          <Grid
                            container
                            spacing={{ xs: 1.5, md: 2 }}
                            alignItems="flex-start"
                          >
                            {/* ===== Columna Izquierda: info del plan ===== */}
                            <Grid item xs={12} md={7}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Typography
                                  variant={isSm ? "h6" : "h5"}
                                  fontWeight={800}
                                >
                                  {plan.nombre}
                                </Typography>
                                {Array.isArray(plan.etiquetas) &&
                                  plan.etiquetas
                                    .slice(0, 2)
                                    .map((label, idx) => (
                                      <Chip
                                        key={idx}
                                        label={label}
                                        size="small"
                                        variant="outlined"
                                        sx={{ ml: 0.5 }}
                                      />
                                    ))}
                              </Stack>

                              <Typography
                                variant={isSm ? "h6" : "h5"}
                                color="primary"
                                gutterBottom
                                sx={{ mt: 0.25, fontWeight: 800 }}
                              >
                                {plan.demo
                                  ? "GRATIS"
                                  : `${money(mensualConRef)}/mes`}
                              </Typography>

                              {plan.showChipRef && (
                                <Chip
                                  label={plan.chipRefText}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ mb: 0.75 }}
                                />
                              )}

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {plan.descripcion}
                              </Typography>

                              <Stack spacing={0.5}>
                                {plan.beneficios?.map((b, idx) => (
                                  <Stack
                                    key={idx}
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                  >
                                    <CheckCircleRounded
                                      fontSize="small"
                                      color="success"
                                    />
                                    <Typography variant="body2">{b}</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Grid>

                            {/* ===== Columna Derecha: cálculo y compra ===== */}
                            <Grid item xs={12} md={5}>
                              <Box
                                sx={{
                                  position: { md: "sticky" },
                                  top: { md: 12 },
                                  borderRadius: 2,
                                  p: 1.5,
                                  bgcolor: "action.hover",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  minWidth: 0, // evita que el contenido ancho rompa la columna
                                }}
                              >
                                {plan.demo ? (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Este plan es de prueba gratuita por{" "}
                                    {plan.duracion_dias ?? 14} días.
                                  </Typography>
                                ) : (
                                  <>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{ mb: 0.75 }}
                                    >
                                      Elige meses a pagar:
                                    </Typography>

                                    <ButtonGroup
                                      variant="outlined"
                                      orientation={
                                        isXs ? "vertical" : "horizontal"
                                      }
                                      sx={{
                                        width: "100%",
                                        "& .MuiButton-root": {
                                          flex: 1,
                                          minWidth: 0,
                                        },
                                      }}
                                    >
                                      {[1, 5, 10].map((m) => (
                                        <Button
                                          key={m}
                                          disableRipple
                                          disableTouchRipple
                                          onClick={() =>
                                            setMesesPlan(plan.plan_id, m)
                                          }
                                          color={
                                            mesesPagados === m
                                              ? "primary"
                                              : "inherit"
                                          }
                                          sx={{
                                            fontWeight: 700,
                                            py: { xs: 1, md: 1 },
                                          }} // evita valores decimales "raros"
                                        >
                                          {m} {m === 1 ? "mes" : "meses"}
                                        </Button>
                                      ))}
                                    </ButtonGroup>

                                    <Divider sx={{ my: 1.25 }} />

                                    {/* ====== Resumen compacto y resistente a saltos ====== */}
                                    {/* ====== Resumen en dos líneas ====== */}
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: 1.5,
                                        bgcolor: "background.paper",
                                        border: "1px dashed",
                                        borderColor: "divider",
                                      }}
                                    >
                                      <Stack spacing={0.75}>
                                        {/* Línea 1: chips Pagas / Recibes */}
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          alignItems="center"
                                          flexWrap="wrap"
                                          sx={{ mb: 0.25 }}
                                        >
                                          <Chip
                                            size="small"
                                            label={`Pagas: ${mesesPagados}`}
                                            variant="outlined"
                                            color="primary"
                                          />
                                          {mesesTotales > mesesPagados && (
                                            <Chip
                                              size="small"
                                              label={`Recibes: ${mesesTotales}`}
                                              color="success"
                                              variant="filled"
                                            />
                                          )}
                                        </Stack>

                                        {/* Línea 2: Subtotal a la derecha */}
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            alignItems: "center",
                                            width: "100%",
                                          }}
                                        >
                                          <Tooltip title="Se calcula con el precio mensual del plan por los meses que pagas (sin promos).">
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              Subtotal (base):{" "}
                                              {money(subtotalBase)}
                                            </Typography>
                                          </Tooltip>
                                        </Box>

                                        {/* Descuento referidos (opcional) */}
                                        {eligibleRef && percentRef > 0 && (
                                          <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                          >
                                            <Typography
                                              variant="caption"
                                              color="success.main"
                                            >
                                              Descuento referidos (-{percentRef}
                                              %)
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              color="success.main"
                                              sx={{ whiteSpace: "nowrap" }}
                                            >
                                              -{money(descuentoEstimado)}
                                            </Typography>
                                          </Stack>
                                        )}

                                        <Divider sx={{ my: 0.5 }} />

                                        {/* Total */}
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="center"
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight={800}
                                          >
                                            Total a pagar
                                          </Typography>
                                          <Typography
                                            variant="h6"
                                            fontWeight={900}
                                            color="primary"
                                            sx={{ whiteSpace: "nowrap" }}
                                          >
                                            {money(subtotalConRef)}
                                          </Typography>
                                        </Stack>

                                        {/* Extra promo */}
                                        {mesesTotales > mesesPagados && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              mt: 0.25,
                                              fontStyle: "italic",
                                            }}
                                          >
                                            🎁 Promoción activa: te regalamos{" "}
                                            {mesesTotales - mesesPagados} mes
                                            {mesesTotales - mesesPagados > 1
                                              ? "es"
                                              : ""}
                                          </Typography>
                                        )}
                                      </Stack>
                                    </Box>

                                    {/* ====== Fin resumen ====== */}

                                    <Button
                                      variant="contained"
                                      color="success"
                                      fullWidth
                                      sx={{
                                        mt: 1.5,
                                        py: 1,
                                        fontWeight: 800,
                                        borderRadius: 2,
                                      }}
                                      disabled={
                                        !conektaLoaded || loadingConekta
                                      }
                                      onClick={() => handleCompraPlan(plan)}
                                    >
                                      {loadingConekta
                                        ? "Procesando..."
                                        : "COMPRAR PLAN"}
                                    </Button>
                                  </>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </SwipeableViews>
            </>
          )}

          {tab === 1 && (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <IconButton
                  onClick={() => handlePrev(setIndexComp, complementos.length)}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Complemento {indexComp + 1}/{complementos.length}
                </Typography>
                <IconButton
                  onClick={() => handleNext(setIndexComp, complementos.length)}
                >
                  <ArrowForward />
                </IconButton>
              </Stack>

              <SwipeableViews
                index={indexComp}
                onChangeIndex={setIndexComp}
                enableMouseEvents
              >
                {complementos.map((comp, i) => (
                  <Box key={i} px={{ xs: 0.25, md: 0.5 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                        <Grid container spacing={{ xs: 1.5, md: 2 }}>
                          {/* Izquierda */}
                          <Grid item xs={12} md={7}>
                            <Typography
                              variant={isSm ? "h6" : "h5"}
                              fontWeight={800}
                              sx={{ mb: 0.25 }}
                            >
                              {comp.nombre}
                            </Typography>
                            <Typography
                              variant={isSm ? "h6" : "h5"}
                              color="primary"
                              sx={{ fontWeight: 800 }}
                            >
                              {money(comp.precio)}
                            </Typography>
                            {comp.nota && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.75 }}
                              >
                                📝 {comp.nota}
                              </Typography>
                            )}
                          </Grid>
                          {/* Derecha */}
                          <Grid item xs={12} md={5}>
                            <Box
                              sx={{
                                position: { md: "sticky" },
                                top: { md: 12 },
                                borderRadius: 2,
                                p: 1.5,
                                bgcolor: "action.hover",
                                border: "1px solid",
                                borderColor: "divider",
                                minWidth: 0,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                mb={0.75}
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
                                sx={{
                                  mt: 1,
                                  py: 1,
                                  fontWeight: 800,
                                  borderRadius: 2,
                                }}
                                disabled={!conektaLoaded || loadingConekta}
                                onClick={() => handleCompraComplemento(comp)}
                              >
                                {loadingConekta
                                  ? "Procesando..."
                                  : "COMPRAR COMPLEMENTO"}
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </SwipeableViews>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Conekta */}
      <Dialog
        open={modalConektaVisible}
        onClose={handleClosePago}
        fullWidth
        maxWidth="md"
        fullScreen={isXs}
        PaperProps={{
          sx: {
            borderRadius: isXs ? 0 : 3,
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
            fontWeight: 800,
            color: "#333",
            px: { xs: 2, md: 3 },
            pt: { xs: 1.25, md: 1.75 },
            pb: { xs: 0.75, md: 1 },
          }}
        >
          <CreditCardIcon color="warning" /> Procesando tu pago
        </DialogTitle>

        <IconButton
          onClick={handleClosePago}
          sx={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent
          sx={{ p: 0, height: { xs: 480, md: 660 }, overflow: "hidden" }}
        >
          <Box
            id="conekta-container"
            sx={{
              height: "100%",
              width: "100%",
              border: "none",
              overflow: "hidden",
              "& iframe": { border: "none", borderRadius: 0 },
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalPlanesComplementos;
