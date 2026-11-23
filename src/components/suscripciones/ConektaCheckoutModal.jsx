import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { showError } from "../../utils/alerts";

const CONEKTA_SCRIPT = "https://pay.conekta.com/v1.0/js/conekta-checkout.min.js";

const ConektaCheckoutModal = ({
  open,
  onClose,
  isXs,
  checkoutId,

  // ✅ pásalos desde tu padre (recomendado)
  publicKey, // import.meta.env.VITE_CONEKTA_PUBLIC_KEY
  onFinish,
  onErrorPayment,
  onUserClose,

  // opcional
  options = {
    colorPrimary: "#0ea5e9",
    inputType: "minimalMode",
    backgroundMode: "lightMode",
  },
}) => {
  const [conektaLoaded, setConektaLoaded] = useState(false);
  const initLockRef = useRef(false); // evita doble init por renders
  const lastCheckoutIdRef = useRef("");

  // 1) Cargar script Conekta (una vez)
  useEffect(() => {
    const already = document.querySelector(`script[src="${CONEKTA_SCRIPT}"]`);
    if (already) {
      setConektaLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = CONEKTA_SCRIPT;
    script.async = true;
    script.onload = () => setConektaLoaded(true);
    script.onerror = () => {
      console.error("❌ No se pudo cargar el script de Conekta");
      setConektaLoaded(false);
    };
    document.body.appendChild(script);
  }, []);

  // helper: limpiar contenedor
  const clearContainer = () => {
    const el = document.getElementById("conekta-container");
    if (el) el.innerHTML = "";
  };

  // 2) Inicializar Integration *cada vez que abre* con un checkoutId válido
  useEffect(() => {
    if (!open) {
      initLockRef.current = false;
      return;
    }
    if (!checkoutId) return;
    if (!conektaLoaded) return;
    if (!window.ConektaCheckoutComponents) return;

    // Si ya inicializamos con ESTE mismo checkoutId, no lo vuelvas a montar.
    if (lastCheckoutIdRef.current === checkoutId && initLockRef.current) return;

    initLockRef.current = true;
    lastCheckoutIdRef.current = checkoutId;

    // esperar a que el modal pinte el div (como Renovar)
    const t = setTimeout(() => {
      const targetExists = document.querySelector("#conekta-container");
      if (!targetExists) {
        initLockRef.current = false;
        return;
      }

      // MUY importante: limpiar antes de montar
      clearContainer();

      try {
        window.ConektaCheckoutComponents.Integration({
          config: {
            checkoutRequestId: checkoutId,
            publicKey,
            targetIFrame: "#conekta-container",
            locale: "es",
          },
          options,
          callbacks: {
            onFinish: async (order) => {
              // ✅ cierra / limpia
              try {
                await onFinish?.(order);
              } finally {
                clearContainer();
              }
            },
            onErrorPayment: (err) => {
              console.error("❌ Error en pago Conekta", err);
              onErrorPayment?.(err);
              // si te lo niegan y quieres permitir reintentar dentro del mismo modal:
              // initLockRef.current = false; // opcional
              // clearContainer(); // opcional
              showError("❌ Pago fallido. Intenta nuevamente.");
            },
            onUserClose: () => {
              onUserClose?.();
            },
            onGetInfoSuccess: (loadTime) => {
              console.log("⏱️ Checkout embebido cargado:", loadTime?.initLoadTime);
            },
          },
        });
      } catch (e) {
        console.error("❌ Error inicializando Conekta Integration:", e);
        initLockRef.current = false;
        showError("No se pudo cargar el checkout de Conekta.");
      }
    }, 300);

    return () => clearTimeout(t);
  }, [open, checkoutId, conektaLoaded, publicKey, options, onFinish, onErrorPayment, onUserClose]);

  // 3) Al cerrar modal: limpia iframe para evitar “sesión pegada”
  useEffect(() => {
    if (!open) {
      clearContainer();
    }
  }, [open]);

  const handleClose = () => {
    clearContainer();
    initLockRef.current = false;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        <CreditCardIcon color="warning" /> Procesando tu pago (Conekta)
      </DialogTitle>

      <IconButton
        onClick={handleClose}
        sx={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0, height: { xs: 480, md: 660 }, overflow: "hidden" }}>
        {!conektaLoaded ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
            <CircularProgress color="warning" />
          </Box>
        ) : (
          <div
            id="conekta-container"
            style={{
              height: "100%",
              width: "100%",
              border: "none",
              overflow: "hidden",
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConektaCheckoutModal;