import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";

const paypalImg = "/assets/images/paypal.jpg";

const PayPalCheckoutModal = ({
  open,
  onClose,
  isXs,
  paypalLoaded,
  loadPayPalSdk,
  setPaypalLoaded,
  loadingPayPal,
  setLoadingPayPal,
  pendingPayment,
  onFinish,
}) => {
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById("paypal-container");
    if (el) el.innerHTML = "";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!pendingPayment?.concepto || !pendingPayment?.monto) return;

    (async () => {
      try {
        await loadPayPalSdk();
        setPaypalLoaded(true);

        setLoadingPayPal(true);

        // Limpia contenedor
        const el = document.getElementById("paypal-container");
        if (el) el.innerHTML = "";

        // Renderiza botones
        setTimeout(() => {
          if (!window.paypal?.Buttons) {
            showError("PayPal aún no está listo…");
            onClose();
            return;
          }

          window.paypal
            .Buttons({
              // ✅ Fuerza idioma en UI
              locale: "es_MX",
              style: { layout: "vertical" },

              createOrder: async () => {
                const { concepto, monto } = pendingPayment;

                // descuento
                const evalResp = await axiosClient.post("/referidos/descuento", {
                  concepto,
                  monto,
                });
                const { monto_final } = evalResp.data || {};
                const finalToCharge =
                  typeof monto_final === "number" ? monto_final : monto;

                const resp = await axiosClient.post("/paypal/checkout", {
                  concepto,
                  monto: finalToCharge,
                });

                const { order_id } = resp.data || {};
                if (!order_id) throw new Error("order_id no recibido");
                return order_id;
              },

              onApprove: async (data) => {
                await axiosClient.post("/paypal/capture", {
                  order_id: data.orderID,
                });

                await showSuccess("✅ Pago confirmado. Se activará en segundos.");
                if (onFinish) await onFinish();
              },

              onCancel: () => {
                showError("⚠️ Pago cancelado por el usuario.");
                onClose();
              },

              onError: (err) => {
                console.error("PayPal error:", err);
                showError("❌ Error con PayPal.");
                onClose();
              },
            })
            .render("#paypal-container");
        }, 120);
      } catch (err) {
        console.error("PayPal init error:", err?.message || err);
        showError("No se pudo cargar PayPal. Revisa configuración del backend.");
        onClose();
      } finally {
        setLoadingPayPal(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
          justifyContent: "space-between",
          fontWeight: 900,
          px: { xs: 2, md: 3 },
          pt: { xs: 1.25, md: 1.75 },
          pb: { xs: 0.75, md: 1 },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component="img"
            src={paypalImg}
            alt="PayPal"
            sx={{ width: 90, height: 28, objectFit: "contain" }}
          />
          <Typography fontWeight={900}>Paga con PayPal</Typography>
        </Stack>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Box id="paypal-container" sx={{ minHeight: 220, width: "100%" }} />

        {loadingPayPal && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            Preparando PayPal…
          </Typography>
        )}

        {open && !paypalLoaded && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            PayPal aún no está listo…
          </Typography>
        )}

        <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
          Moneda: MXN · Idioma: Español (México)
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalCheckoutModal;