import React, { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClient";
import PricingPlans from "./PricingPlans";
import {
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import { showSuccess } from "../../utils/alerts";
import { useNavigate } from "react-router-dom";

const Renovar = () => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");
  const [conektaLoaded, setConektaLoaded] = useState(false);
  const navigate = useNavigate();
  const [pagoExitoso, setPagoExitoso] = useState(null); // null | true | false
  const [estadoPago, setEstadoPago] = useState(null); // null | 'exito' | 'error'

  // Cargar el script correcto de Conekta Checkout v6
  useEffect(() => {
    const scriptAlreadyLoaded = document.querySelector(
      'script[src="https://pay.conekta.com/v1.0/js/conekta-checkout.min.js"]'
    );

    if (!scriptAlreadyLoaded) {
      const script = document.createElement("script");
      script.src = "https://pay.conekta.com/v1.0/js/conekta-checkout.min.js";
      script.async = true;
      script.onload = () => setConektaLoaded(true);
      script.onerror = () => {
        console.error("❌ No se pudo cargar el script de Conekta");
      };
      document.body.appendChild(script);
    } else {
      setConektaLoaded(true);
    }
  }, []);

  const handlePago = async (plan) => {
    setLoading(true);
    try {
      const concepto = `PLAN:${plan.id}:${plan.mesesPagados}`;
      const monto = plan.selectedPrice;

      const res = await axiosClient.post("/checkout", { concepto, monto });
      const { checkoutRequestId, public_key } = res.data;

      if (!checkoutRequestId || !public_key)
        throw new Error("Datos de checkout incompletos");

      setCheckoutId(checkoutRequestId);
      setModalOpen(true);
    } catch (err) {
      console.error("Error al crear Checkout:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setModalOpen(false);
    setCheckoutId("");

    try {
      const res = await axiosClient.get("/perfil/mi-tienda");

      if (res.data.is_active) {
        await showSuccess("✅ Pago verificado correctamente. Redirigiendo...");
        navigate("/admin/products");
      } else {
        await showError(
          "⚠️ El pago no fue confirmado aún. Por favor espera unos minutos."
        );
      }
    } catch (err) {
      console.error("Error al verificar tienda:", err);
      await showError("❌ No se pudo verificar el estado del pago.");
    }
  };

  useEffect(() => {
    if (
      modalOpen &&
      checkoutId &&
      conektaLoaded &&
      window.ConektaCheckoutComponents
    ) {
      // Espera a que se monte el div del modal
      setTimeout(() => {
        const targetExists = document.querySelector("#conekta-container");
        if (targetExists) {
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
              onFinish: (order) => {
                console.log("✅ Pago completado", order);
                setEstadoPago("exito");
              },
              onErrorPayment: (error) => {
                console.error("❌ Error en pago", error);
                setEstadoPago("error");
              },
              onGetInfoSuccess: (loadTime) => {
                console.log(
                  "⏱️ Checkout embebido cargado en:",
                  loadTime.initLoadTime
                );
              },
            },
          });
        } else {
          console.warn("❗ No se encontró el contenedor #conekta-container");
        }
      }, 300); // Esperar 300ms o más si hace falta
    }
  }, [modalOpen, checkoutId, conektaLoaded]);

  return (
    <div className="container py-3">
      <div className="text-center mb-4">
        <h1 className="mb-3">Tu acceso ha expirado</h1>
        <p className="mb-4">
          Tu periodo de prueba o suscripción ha finalizado. Para continuar
          usando la plataforma, por favor selecciona un plan y realiza el pago.
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

        <button
          onClick={() => (window.location.href = "/admin")}
          className="btn btn-secondary"
        >
          Iniciar sesión
        </button>
      </div>

      {/* Modal embebido Conekta */}
      <Dialog
        open={modalOpen}
        onClose={handleClose}
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

          <IconButton onClick={handleClose}>
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
        0% {
          opacity: 0;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
    `}
        </style>
      </Dialog>
    </div>
  );
};

export default Renovar;
