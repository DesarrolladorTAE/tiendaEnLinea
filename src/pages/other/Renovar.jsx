import React, { useState } from "react";
import axiosClient from "../../config/axiosClient";
import PricingPlans from "./PricingPlans";

const Renovar = () => {
  const [loading, setLoading] = useState(false);

  const handlePago = async (plan) => {
    setLoading(true);
    try {
      console.log("Plan seleccionado:", plan);
      const res = await axiosClient.post("/checkout", {
        nombre_plan: plan.name,
        precio: plan.selectedPrice,
        duracion_meses: plan.selectedDuration,
        descripcion: plan.description || `${plan.selectedDuration} mes(es)`,
      });

      const { url } = res.data;
      if (url) {
        window.open(url, "_blank");
      } else {
        console.error("No se recibió una URL de pago");
      }
    } catch (err) {
      console.error("Error al crear Checkout:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-3">
      <div className="text-center mb-4">
        <h1 className="mb-3">Tu acceso ha expirado</h1>
        <p className="mb-4">
          Tu periodo de prueba o suscripción ha finalizado. Para continuar usando la plataforma, por
          favor selecciona un plan y realiza el pago.
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

        <p className="text-muted">Si ya realizaste el pago, por favor vuelve a iniciar sesión.</p>

        <button onClick={() => (window.location.href = "/admin")} className="btn btn-secondary">
          Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default Renovar;
