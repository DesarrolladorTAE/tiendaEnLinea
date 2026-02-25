import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";
import {
  ArrowBack,
  ArrowForward,
  Close as CloseIcon,
  CheckCircleRounded,
  AccessTimeRounded,
} from "@mui/icons-material";

import complementos from "../../utils/complementos";
import axiosClient from "../../config/axiosClient";
import usePlanesPromos from "../../hooks/usePlanesPromos";

import PaymentMethodModal from "./PaymentMethodModal";
import ConektaCheckoutModal from "./ConektaCheckoutModal";
import PayPalCheckoutModal from "./PayPalCheckoutModal";

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
function mmss(sec) {
  const s = Math.max(0, Number(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const ModalPlanesComplementos = ({ open, onClose }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));

  const [tab, setTab] = useState(0);
  const [indexPlanes, setIndexPlanes] = useState(0);
  const [indexComp, setIndexComp] = useState(0);

  // Conekta
  const [loadingConekta, setLoadingConekta] = useState(false);
  const [conektaLoaded, setConektaLoaded] = useState(false); // solo para UI/selector
  const [modalConektaVisible, setModalConektaVisible] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");

  // PayPal
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [loadingPayPal, setLoadingPayPal] = useState(false);
  const [modalPayPalVisible, setModalPayPalVisible] = useState(false);

  // Selector método
  const [modalMetodoPago, setModalMetodoPago] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  // pendingPayment: { concepto, monto, onFinish }

  // ✅ TEMPORIZADOR (bloquea salida)
  const [activationOpen, setActivationOpen] = useState(false);
  const [activationLeft, setActivationLeft] = useState(60);

  const ACTIVATION_SECONDS = 60;

  const activationDone = activationLeft <= 0;
  const activationProgress = useMemo(() => {
    const total = Math.max(1, ACTIVATION_SECONDS);
    const passed = total - Math.max(0, activationLeft);
    return Math.min(100, Math.max(0, (passed / total) * 100));
  }, [activationLeft]);

  const startActivationTimer = useCallback(() => {
    setActivationLeft(ACTIVATION_SECONDS);
    setActivationOpen(true);
  }, []);

  useEffect(() => {
    if (!activationOpen) return;

    const t = setInterval(() => {
      setActivationLeft((p) => Math.max(0, p - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [activationOpen]);

  const handleActivationDone = async () => {
    if (!activationDone) return; // 🔒 safety
    setActivationOpen(false);

    // aquí ya dejas que se cierre el modal general / refresque UI
    if (pendingPayment?.onFinish) await pendingPayment.onFinish();
  };

  // meses a pagar por plan
  const [mesesSeleccionados, setMesesSeleccionados] = useState({});
  const setMesesPlan = (planId, m) =>
    setMesesSeleccionados((s) => ({ ...s, [planId]: m }));

  // hook promos
  const { planes: planesDecorados, eligibleRef, percentRef } = usePlanesPromos();

  const handlePrev = (setIndex, total) =>
    setIndex((p) => (p - 1 + total) % total);
  const handleNext = (setIndex, total) => setIndex((p) => (p + 1) % total);

  /* ======================
     Cargar script CONEKTA (solo para habilitar el selector)
  ====================== */
  useEffect(() => {
    const src = "https://pay.conekta.com/v1.0/js/conekta-checkout.min.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return setConektaLoaded(true);

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => setConektaLoaded(true);
    script.onerror = () =>
      console.error("❌ No se pudo cargar el script de Conekta");
    document.body.appendChild(script);
  }, []);

  /* ======================
     PayPal: obtener config desde BACKEND
  ====================== */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await axiosClient.get("/paypal/config");
        const { client_id } = res.data || {};
        if (!client_id) throw new Error("client_id vacío en /paypal/config");
        if (!mounted) return;
        setPaypalClientId(client_id);
      } catch (e) {
        console.warn("⚠️ No se pudo obtener /paypal/config:", e?.message || e);
        if (!mounted) return;
        setPaypalClientId("");
        setPaypalLoaded(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ======================
     Loader robusto PayPal SDK (ES_MX / MXN / MX)
  ====================== */
  const loadPayPalSdk = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.paypal?.Buttons) return resolve(true);
      if (!paypalClientId) return reject(new Error("paypalClientId vacío"));

      const existing = document.querySelector('script[data-paypal-sdk="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () =>
          reject(new Error("PayPal SDK error"))
        );
        setTimeout(() => {
          if (window.paypal?.Buttons) resolve(true);
        }, 600);
        return;
      }

      const script = document.createElement("script");
      script.setAttribute("data-paypal-sdk", "true");
      script.async = true;

      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        paypalClientId
      )}&currency=MXN&intent=capture&components=buttons&locale=es_MX&buyer-country=MX`;

      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("No se pudo cargar PayPal SDK"));
      document.body.appendChild(script);
    });
  }, [paypalClientId]);

  useEffect(() => {
    if (!paypalClientId) return;

    loadPayPalSdk()
      .then(() => setPaypalLoaded(true))
      .catch((e) => {
        console.warn("PayPal SDK no cargó:", e?.message || e);
        setPaypalLoaded(false);
      });
  }, [paypalClientId, loadPayPalSdk]);

  /* ======================
     PAGO CONEKTA
  ====================== */
  const iniciarPagoConekta = async ({ concepto, monto, onFinish }) => {
    setLoadingConekta(true);
    try {
      const evalResp = await axiosClient.post("/referidos/descuento", {
        concepto,
        monto,
      });
      const { monto_final } = evalResp.data || {};
      const finalToCharge = typeof monto_final === "number" ? monto_final : monto;

      const res = await axiosClient.post("/checkout", {
        concepto,
        monto: finalToCharge,
      });

      const { checkoutRequestId } = res.data || {};
      if (!checkoutRequestId) throw new Error("checkoutRequestId vacío");

      setCheckoutId(checkoutRequestId);
      setModalConektaVisible(true);

      // guardamos callback para cuando termine
      setPendingPayment((prev) => ({ ...(prev || {}), onFinish }));
    } finally {
      setLoadingConekta(false);
    }
  };

  /* ======================
     Selector método
  ====================== */
  const abrirSelectorPago = ({ concepto, monto, onFinish }) => {
    setPendingPayment({ concepto, monto, onFinish });
    setModalMetodoPago(true);
  };

  const elegirMetodo = async (metodo) => {
    if (!pendingPayment) return;
    setModalMetodoPago(false);

    if (metodo === "conekta") {
      if (!conektaLoaded) throw new Error("Conekta aún está cargando…");
      return iniciarPagoConekta(pendingPayment);
    }

    if (metodo === "paypal") {
      if (!paypalLoaded) throw new Error("PayPal aún está cargando…");
      setModalPayPalVisible(true);
      return;
    }
  };

  /* ======================
     Handlers compra
  ====================== */
  const handleCompraPlan = (plan) => {
    const mesesPagados = Number(mesesSeleccionados[plan.plan_id] ?? 1);
    const montoBase = Number(plan.precio_mensual) * mesesPagados;

    abrirSelectorPago({
      concepto: `PLAN:${plan.plan_id}:${mesesPagados}`,
      monto: montoBase,
      onFinish: async () => {
        setCheckoutId("");
        onClose();
      },
    });
  };

  const handleCompraComplemento = (comp) => {
    abrirSelectorPago({
      concepto: `COM:${comp.complemento_id}`,
      monto: comp.precio,
      onFinish: async () => {
        setCheckoutId("");
        onClose();
      },
    });
  };

  /* ======================
     Close modals
  ====================== */
  const handleClosePagoConekta = () => {
    setModalConektaVisible(false);
    setCheckoutId("");
  };

  const handleClosePagoPayPal = () => {
    setModalPayPalVisible(false);
  };

  return (
    <>
      {/* ================== MODAL PRINCIPAL ================== */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
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
          <Typography component="span" variant={isSm ? "h6" : "h5"} fontWeight={800}>
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

          {/* ================== PLANES ================== */}
          {tab === 0 && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <IconButton onClick={() => handlePrev(setIndexPlanes, planesDecorados.length)}>
                  <ArrowBack />
                </IconButton>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Plan {indexPlanes + 1}/{planesDecorados.length}
                </Typography>
                <IconButton onClick={() => handleNext(setIndexPlanes, planesDecorados.length)}>
                  <ArrowForward />
                </IconButton>
              </Stack>

              <SwipeableViews index={indexPlanes} onChangeIndex={setIndexPlanes} enableMouseEvents>
                {planesDecorados.map((plan, i) => {
                  const mesesPagados = Number(mesesSeleccionados[plan.plan_id] ?? 1);
                  const mesesTotales = mesesObtenidos(plan, mesesPagados);

                  const mensualBase = Number(plan.precio_mensual);
                  const mensualConRef = Number(plan.precio_con_ref ?? plan.precio_mensual);

                  const subtotalBase = plan.demo ? 0 : mensualBase * mesesPagados;
                  const subtotalConRef = plan.demo ? 0 : mensualConRef * mesesPagados;
                  const descuentoEstimado = Math.max(0, subtotalBase - subtotalConRef);

                  return (
                    <Box key={i} px={{ xs: 0.25, md: 0.5 }}>
                      <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                          <Grid container spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
                            <Grid item xs={12} md={7}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant={isSm ? "h6" : "h5"} fontWeight={800}>
                                  {plan.nombre}
                                </Typography>
                                {Array.isArray(plan.etiquetas) &&
                                  plan.etiquetas.slice(0, 2).map((label, idx) => (
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
                                {plan.demo ? "GRATIS" : `${money(mensualConRef)}/mes`}
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

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {plan.descripcion}
                              </Typography>

                              <Stack spacing={0.5}>
                                {plan.beneficios?.map((b, idx) => (
                                  <Stack key={idx} direction="row" spacing={0.75} alignItems="center">
                                    <CheckCircleRounded fontSize="small" color="success" />
                                    <Typography variant="body2">{b}</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Grid>

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
                                {plan.demo ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Este plan es de prueba gratuita por {plan.duracion_dias ?? 14} días.
                                  </Typography>
                                ) : (
                                  <>
                                    <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                                      Elige meses a pagar:
                                    </Typography>

                                    <ButtonGroup
                                      variant="outlined"
                                      orientation={isXs ? "vertical" : "horizontal"}
                                      sx={{
                                        width: "100%",
                                        "& .MuiButton-root": { flex: 1, minWidth: 0 },
                                      }}
                                    >
                                      {[1, 5, 10].map((m) => (
                                        <Button
                                          key={m}
                                          disableRipple
                                          disableTouchRipple
                                          onClick={() => setMesesPlan(plan.plan_id, m)}
                                          color={mesesPagados === m ? "primary" : "inherit"}
                                          sx={{ fontWeight: 700, py: { xs: 1, md: 1 } }}
                                        >
                                          {m} {m === 1 ? "mes" : "meses"}
                                        </Button>
                                      ))}
                                    </ButtonGroup>

                                    <Divider sx={{ my: 1.25 }} />

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
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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

                                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                          <Tooltip title="Precio mensual por los meses que pagas (sin promos).">
                                            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                              Subtotal (base): {money(subtotalBase)}
                                            </Typography>
                                          </Tooltip>
                                        </Box>

                                        {eligibleRef && percentRef > 0 && (
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="success.main">
                                              Descuento referidos (-{percentRef}%)
                                            </Typography>
                                            <Typography variant="caption" color="success.main">
                                              -{money(descuentoEstimado)}
                                            </Typography>
                                          </Stack>
                                        )}

                                        <Divider />

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          <Typography variant="subtitle2" fontWeight={800}>
                                            Total a pagar
                                          </Typography>
                                          <Typography variant="h6" fontWeight={900} color="primary">
                                            {money(subtotalConRef)}
                                          </Typography>
                                        </Stack>
                                      </Stack>
                                    </Box>

                                    <Button
                                      variant="contained"
                                      color="success"
                                      fullWidth
                                      sx={{ mt: 1.5, py: 1, fontWeight: 800, borderRadius: 2 }}
                                      disabled={loadingConekta || loadingPayPal}
                                      onClick={() => handleCompraPlan(plan)}
                                    >
                                      {loadingConekta || loadingPayPal ? "Procesando..." : "COMPRAR PLAN"}
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

          {/* ================== COMPLEMENTOS ================== */}
          {tab === 1 && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <IconButton onClick={() => handlePrev(setIndexComp, complementos.length)}>
                  <ArrowBack />
                </IconButton>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Complemento {indexComp + 1}/{complementos.length}
                </Typography>
                <IconButton onClick={() => handleNext(setIndexComp, complementos.length)}>
                  <ArrowForward />
                </IconButton>
              </Stack>

              <SwipeableViews index={indexComp} onChangeIndex={setIndexComp} enableMouseEvents>
                {complementos.map((comp, i) => (
                  <Box key={i} px={{ xs: 0.25, md: 0.5 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                        <Grid container spacing={{ xs: 1.5, md: 2 }}>
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
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                📝 {comp.nota}
                              </Typography>
                            )}
                          </Grid>

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
                              <Stack direction="row" spacing={1} flexWrap="wrap" mb={0.75}>
                                <Chip label={comp.tipo} size="small" variant="outlined" />
                                {comp.desde && (
                                  <Chip label="Desde" color="info" size="small" variant="outlined" />
                                )}
                              </Stack>

                              <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                sx={{ mt: 1, py: 1, fontWeight: 800, borderRadius: 2 }}
                                disabled={loadingConekta || loadingPayPal}
                                onClick={() => handleCompraComplemento(comp)}
                              >
                                {loadingConekta || loadingPayPal ? "Procesando..." : "COMPRAR COMPLEMENTO"}
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

      {/* ================== MODAL SELECCIÓN MÉTODO ================== */}
      <PaymentMethodModal
        open={modalMetodoPago}
        onClose={() => setModalMetodoPago(false)}
        isXs={isXs}
        pendingPayment={pendingPayment}
        paypalLoaded={paypalLoaded}
        conektaLoaded={conektaLoaded}
        onPick={async (method) => {
          try {
            await elegirMetodo(method);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* ================== MODAL CONEKTA ================== */}
      <ConektaCheckoutModal
        open={modalConektaVisible}
        onClose={handleClosePagoConekta}
        isXs={isXs}
        checkoutId={checkoutId}
        publicKey={import.meta.env.VITE_CONEKTA_PUBLIC_KEY}
        onFinish={async () => {
          // ✅ al terminar pago, NO cerramos todo aún.
          setModalConektaVisible(false);
          setCheckoutId("");
          startActivationTimer(); // 🔒 abre temporizador
        }}
        onErrorPayment={() => {
          setModalConektaVisible(false);
          setCheckoutId("");
        }}
        onUserClose={() => {
          setModalConektaVisible(false);
          setCheckoutId("");
        }}
      />

      {/* ================== MODAL PAYPAL ================== */}
      <PayPalCheckoutModal
        open={modalPayPalVisible}
        onClose={handleClosePagoPayPal}
        isXs={isXs}
        paypalLoaded={paypalLoaded}
        loadPayPalSdk={loadPayPalSdk}
        setPaypalLoaded={setPaypalLoaded}
        loadingPayPal={loadingPayPal}
        setLoadingPayPal={setLoadingPayPal}
        pendingPayment={pendingPayment}
        onFinish={async () => {
          // ✅ al terminar pago, NO cerramos todo aún.
          setModalPayPalVisible(false);
          startActivationTimer(); // 🔒 abre temporizador
        }}
      />

      {/* ================== MODAL BLOQUEADO TEMPORIZADOR ==================
          🔒 No se puede cerrar hasta que acabe y el usuario le dé click.
      */}
      <Dialog
        open={activationOpen}
        onClose={() => {}}
        disableEscapeKeyDown
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 2,
          }}
        >
          {activationDone ? (
            <CheckCircleRounded color="success" />
          ) : (
            <AccessTimeRounded color="warning" />
          )}
          ✅ Pago confirmado
        </DialogTitle>

        <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
          <Typography sx={{ fontWeight: 700 }}>
            Estamos activando tu plan. Espera <b>1 minuto</b> y luego podrás continuar.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={activationProgress} />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Activando…
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                {activationDone ? "LISTO" : mmss(activationLeft)}
              </Typography>
            </Stack>
          </Box>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, fontWeight: 900, borderRadius: 2, py: 1 }}
            disabled={!activationDone}
            onClick={handleActivationDone}
          >
            Continuar
          </Button>

          <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
            *Cuando termine el contador, dale click en “Continuar” para regresar.*
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalPlanesComplementos;