import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../../config/axiosClient";
import PricingPlans from "./PricingPlans";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import { showSuccess, showError } from "../../utils/alerts";
import { useNavigate } from "react-router-dom";

/* ===== IMÁGENES DESDE PUBLIC (JPG) ===== */
const paypalImg = "/assets/images/paypal.jpg";
const conektaImg = "/assets/images/conekta.jpg";

const Renovar = () => {
  const [loading, setLoading] = useState(false);

  // ====== Selector método ======
  const [modalMetodoPago, setModalMetodoPago] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  // pendingPayment: { concepto, monto, summaryName, planName, meses }

  // ====== Conekta ======
  const [modalConektaOpen, setModalConektaOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");
  const [conektaLoaded, setConektaLoaded] = useState(false);

  // ====== PayPal ======
  const [modalPayPalOpen, setModalPayPalOpen] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [loadingPayPal, setLoadingPayPal] = useState(false);

  // ====== Post-pago UX PRO (timer bloqueo) ======
  const [modalActivandoOpen, setModalActivandoOpen] = useState(false);
  const [countdown, setCountdown] = useState(60); // 1 minuto
  const [activarDone, setActivarDone] = useState(false);

  const navigate = useNavigate();

  /* =========================
     Cargar script Conekta
  ========================= */
  useEffect(() => {
    const src = "https://pay.conekta.com/v1.0/js/conekta-checkout.min.js";
    const scriptAlreadyLoaded = document.querySelector(`script[src="${src}"]`);

    if (!scriptAlreadyLoaded) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => setConektaLoaded(true);
      script.onerror = () =>
        console.error("❌ No se pudo cargar el script de Conekta");
      document.body.appendChild(script);
    } else {
      setConektaLoaded(true);
    }
  }, []);

  /* =========================
     PayPal: obtener config backend
     GET /paypal/config -> { mode, client_id }
  ========================= */
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

  /* =========================
     Loader PayPal SDK (es_MX / MXN / buyer-country=MX)
  ========================= */
  const loadPayPalSdk = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.paypal?.Buttons) return resolve(true);
      if (!paypalClientId) return reject(new Error("paypalClientId vacío"));

      const existing = document.querySelector('script[data-paypal-sdk="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () =>
          reject(new Error("PayPal SDK error")),
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
        paypalClientId,
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
      .catch(() => setPaypalLoaded(false));
  }, [paypalClientId, loadPayPalSdk]);

  /* =========================
     Al seleccionar plan:
     abrimos selector método
     ✅ guardamos nombre bonito del plan y meses
  ========================= */
  const handlePago = async (plan) => {
    setLoading(true);
    try {
      const concepto = `PLAN:${plan.id}:${plan.mesesPagados}`;
      const monto = plan.selectedPrice;

      const planName =
        plan.display_name || plan.nombre || plan.name || `Plan #${plan.id}`;

      const mesesObtenidos = Number(plan.mesesPagados || plan.meses || 1);
      const monthsLabel = `${mesesObtenidos} mes${
        mesesObtenidos === 1 ? "" : "es"
      }`;
      const summaryName = `${planName} · ${monthsLabel}`;

      setPendingPayment({
        concepto,
        monto,
        summaryName,
        planName,
        meses: mesesObtenidos,
      });

      setModalMetodoPago(true);
    } catch (err) {
      console.error("Error preparando pago:", err?.response?.data || err);
      showError("No se pudo preparar el pago.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Elegir método
  ========================= */
  const elegirMetodo = async (metodo) => {
    if (!pendingPayment) return;
    setModalMetodoPago(false);

    if (metodo === "conekta") return iniciarConekta(pendingPayment);
    if (metodo === "paypal") return iniciarPayPal(pendingPayment);
  };

  /* =========================
     Iniciar Conekta (igual a tu flujo)
  ========================= */
  const iniciarConekta = async ({ concepto, monto }) => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/checkout", { concepto, monto });
      const { checkoutRequestId } = res.data;

      if (!checkoutRequestId) throw new Error("Datos de checkout incompletos");

      setCheckoutId(checkoutRequestId);
      setModalConektaOpen(true);
    } catch (err) {
      console.error(
        "Error al crear Checkout Conekta:",
        err?.response?.data || err,
      );
      showError("❌ No se pudo iniciar el pago con Conekta.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Integración Conekta embebida cuando abre modal
  ========================= */
  useEffect(() => {
    if (!modalConektaOpen || !checkoutId || !conektaLoaded) return;
    if (!window.ConektaCheckoutComponents) return;

    setTimeout(() => {
      const targetExists = document.querySelector("#conekta-container");
      if (!targetExists) return;

      window.ConektaCheckoutComponents.Integration({
        config: {
          checkoutRequestId: checkoutId,
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
          onFinish: async () => {
            // Aquí si quieres, también puedes bloquear 60s igual que PayPal
            await showSuccess(
              "✅ Pago confirmado.\n\nTu acceso se activará en breve. Por favor espera 1 minuto.",
            );
            setModalConektaOpen(false);
            setCheckoutId("");
            // Redirige o deja botón
            setTimeout(() => navigate("/admin"), 1200);
          },
          onErrorPayment: (error) => {
            console.error("❌ Error en pago", error);
            showError("❌ Pago fallido. Intenta nuevamente.");
          },
          onGetInfoSuccess: (loadTime) => {
            console.log(
              "⏱️ Checkout embebido cargado en:",
              loadTime?.initLoadTime,
            );
          },
          onUserClose: () => {},
        },
      });
    }, 300);
  }, [modalConektaOpen, checkoutId, conektaLoaded, navigate]);

  const cerrarConekta = () => {
    setModalConektaOpen(false);
    setCheckoutId("");
  };

  /* =========================
     Modal bloqueo + temporizador
  ========================= */
  const iniciarBloqueoActivacion = () => {
    setCountdown(60);
    setActivarDone(false);
    setModalActivandoOpen(true);
  };

  useEffect(() => {
    if (!modalActivandoOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActivarDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [modalActivandoOpen]);

  const continuarDespuesActivacion = () => {
    // Aquí mandas al login/admin, como tú pediste
    window.location.href = "/admin";
  };

  /* =========================
     Iniciar PayPal (abre modal + renderiza buttons)
     ✅ onApprove ahora: captura -> cierra paypal -> abre modal timer 60s
  ========================= */
  const iniciarPayPal = async ({ concepto, monto }) => {
    try {
      setModalPayPalOpen(true);
      setLoadingPayPal(true);

      await loadPayPalSdk();
      setPaypalLoaded(true);

      const el = document.getElementById("paypal-container");
      if (el) el.innerHTML = "";

      setTimeout(() => {
        if (!window.paypal?.Buttons) {
          showError("PayPal aún no está listo.");
          setModalPayPalOpen(false);
          setLoadingPayPal(false);
          return;
        }

        window.paypal
          .Buttons({
            locale: "es_MX",
            style: { layout: "vertical" },

            createOrder: async () => {
              try {
                const resp = await axiosClient.post("/paypal/checkout", {
                  concepto,
                  monto,
                });
                const { order_id } = resp.data || {};
                if (!order_id) throw new Error("order_id no recibido");
                return order_id;
              } catch (err) {
                console.error(
                  "❌ Error creando orden PayPal:",
                  err?.response?.data || err,
                );
                showError("No se pudo iniciar el pago con PayPal.");
                throw err;
              }
            },

            onApprove: async (data) => {
              try {
                setLoadingPayPal(true);

                // 1) Confirmar capture en backend
                await axiosClient.post("/paypal/capture", {
                  order_id: data.orderID,
                });

                // 2) Cerrar PayPal modal
                setModalPayPalOpen(false);

                // 3) Abrir modal PRO con temporizador (bloqueo)
                iniciarBloqueoActivacion();
              } catch (err) {
                console.error(
                  "❌ Error confirmando pago (capture):",
                  err?.response?.data || err,
                );
                const msg =
                  err?.response?.data?.message ||
                  "❌ Error del servidor al confirmar el pago. Intenta nuevamente.";
                showError(msg);
                setModalPayPalOpen(false);
              } finally {
                setLoadingPayPal(false);
              }
            },

            onCancel: () => {
              showError("⚠️ Pago cancelado por el usuario.");
              setModalPayPalOpen(false);
              setLoadingPayPal(false);
            },

            onError: (err) => {
              console.error("❌ PayPal SDK error:", err);
              showError("❌ Error con PayPal. Intenta nuevamente.");
              setModalPayPalOpen(false);
              setLoadingPayPal(false);
            },
          })
          .render("#paypal-container")
          .catch((err) => {
            console.error("❌ Render PayPal Buttons error:", err);
            showError("No se pudo mostrar el botón de PayPal.");
            setModalPayPalOpen(false);
          })
          .finally(() => {
            setLoadingPayPal(false);
          });
      }, 150);
    } catch (e) {
      console.error("❌ PayPal init error:", e?.message || e);
      showError("No se pudo iniciar PayPal. Revisa configuración.");
      setModalPayPalOpen(false);
      setLoadingPayPal(false);
    }
  };

  const cerrarPayPal = () => {
    setModalPayPalOpen(false);
    setLoadingPayPal(false);
    const el = document.getElementById("paypal-container");
    if (el) el.innerHTML = "";
  };

  const formatTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="container py-3">
      <div className="text-center mb-4">
        <h1 className="mb-3">Tu acceso ha expirado</h1>
        <p className="mb-4">
          Tu periodo de prueba o suscripción ha finalizado. Para continuar usando
          la plataforma, por favor selecciona un plan y realiza el pago.
        </p>
      </div>

      <PricingPlans onPlanSelect={handlePago} loading={loading} />

      <div className="text-center">
        <div className="mb-4">
          <a
            href="https://wa.me/5217442188925"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
          >
            💬 Contactar soporte vía WhatsApp
          </a>
        </div>

        <p className="text-muted">
          Si ya realizaste el pago, por favor vuelve a iniciar sesión.
        </p>

        <button onClick={() => (window.location.href = "/admin")} className="btn btn-secondary">
          Iniciar sesión
        </button>
      </div>

      {/* ================== MODAL SELECCIÓN MÉTODO ================== */}
      <Dialog
        open={modalMetodoPago}
        onClose={() => setModalMetodoPago(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            fontWeight: 900,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentsRoundedIcon color="primary" />
            <Typography fontWeight={900}>Elige tu método de pago</Typography>
          </Stack>
          <IconButton onClick={() => setModalMetodoPago(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card
                onClick={() => paypalLoaded && elegirMetodo("paypal")}
                sx={{
                  cursor: paypalLoaded ? "pointer" : "not-allowed",
                  opacity: paypalLoaded ? 1 : 0.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "0.2s",
                  "&:hover": paypalLoaded
                    ? { transform: "translateY(-2px)", boxShadow: 6 }
                    : {},
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 2 }}>
                  <Box
                    component="img"
                    src={paypalImg}
                    alt="PayPal"
                    sx={{ width: 150, height: 52, objectFit: "contain", mb: 1 }}
                  />
                  <Typography fontWeight={900}>PayPal</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {paypalLoaded ? "Paga con cuenta o tarjeta" : "Cargando PayPal…"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card
                onClick={() => conektaLoaded && elegirMetodo("conekta")}
                sx={{
                  cursor: conektaLoaded ? "pointer" : "not-allowed",
                  opacity: conektaLoaded ? 1 : 0.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "0.2s",
                  "&:hover": conektaLoaded
                    ? { transform: "translateY(-2px)", boxShadow: 6 }
                    : {},
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 2 }}>
                  <Box
                    component="img"
                    src={conektaImg}
                    alt="Conekta"
                    sx={{ width: 150, height: 52, objectFit: "contain", mb: 1 }}
                  />
                  <Typography fontWeight={900}>Conekta</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {conektaLoaded ? "Tarjeta o transferencia" : "Cargando Conekta…"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {pendingPayment && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "action.hover",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                Resumen
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Plan: <b>{pendingPayment.summaryName || pendingPayment.planName}</b>
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Monto: <b>${Number(pendingPayment.monto || 0).toLocaleString()} MXN</b>
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ================== MODAL CONEKTA ================== */}
      <Dialog
        open={modalConektaOpen}
        onClose={cerrarConekta}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            boxShadow: 24,
            animation: "fadeInScale 0.3s ease-in-out",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: "#ffffffee",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PaymentIcon color="warning" />
            <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Pago con Conekta
            </span>
          </div>

          <IconButton onClick={cerrarConekta}>
            <CloseIcon />
          </IconButton>
        </div>

        <DialogContent
          sx={{
            p: 0,
            height: { xs: "75vh", sm: "600px" },
            overflow: "hidden",
            backgroundColor: "#fefefe",
          }}
        >
          {checkoutId && conektaLoaded ? (
            <div
              id="conekta-container"
              style={{
                height: "100%",
                width: "100%",
                border: "none",
                overflow: "hidden",
              }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress color="warning" />
            </div>
          )}
        </DialogContent>

        <style>
          {`
            @keyframes fadeInScale {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      </Dialog>

      {/* ================== MODAL PAYPAL ================== */}
      <Dialog
        open={modalPayPalOpen}
        onClose={cerrarPayPal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            boxShadow: 24,
          },
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: "#ffffffee",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={paypalImg}
              alt="PayPal"
              style={{ width: 90, height: 28, objectFit: "contain" }}
            />
            <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Pago con PayPal
            </span>
          </div>

          <IconButton onClick={cerrarPayPal}>
            <CloseIcon />
          </IconButton>
        </div>

        <DialogContent sx={{ p: 2 }}>
          <div id="paypal-container" style={{ minHeight: 220 }} />

          {loadingPayPal && (
            <div style={{ marginTop: 10, opacity: 0.7 }}>
              Preparando PayPal…
            </div>
          )}

          {!paypalLoaded && (
            <div style={{ marginTop: 10, opacity: 0.7 }}>
              PayPal aún no está listo…
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            Moneda: MXN · Idioma: Español (México)
          </div>
        </DialogContent>
      </Dialog>

      {/* ================== MODAL PRO: ACTIVANDO PLAN (NO SE PUEDE CERRAR) ================== */}
      <Dialog
        open={modalActivandoOpen}
        onClose={() => {}}
        fullWidth
        maxWidth="xs"
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ px: 2.5, py: 2, fontWeight: 900 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {activarDone ? (
              <CheckCircleRoundedIcon color="success" />
            ) : (
              <HourglassBottomRoundedIcon color="warning" />
            )}
            <Typography fontWeight={900}>
              {activarDone ? "Listo" : "Activando tu plan…"}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 800 }}>
            Pago confirmado ✅
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Estamos aplicando tu activación. Por favor espera <b>1 minuto</b> y después
            podrás continuar e iniciar sesión.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={(60 - countdown) * (100 / 60)} />
            <Typography sx={{ mt: 1, fontWeight: 900, textAlign: "center" }}>
              {formatTime(countdown)}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={!activarDone}
            onClick={continuarDespuesActivacion}
            sx={{ mt: 2.5, borderRadius: 2.5, fontWeight: 900, py: 1.2 }}
          >
            Continuar
          </Button>

          {!activarDone && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, textAlign: "center", opacity: 0.8 }}
            >
              Este proceso es automático. No cierres la página.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Renovar;