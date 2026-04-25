// src/context/TiendaContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosClient from "../config/axiosClient";
import ModalPlanesComplementos from "../components/suscripciones/ModalPlanes";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";

// ✅ Contexto con valores seguros por defecto
const TiendaContext = createContext({
  tienda: null,
  tiendaLoading: false,
  referidos: null,
  referidosLoading: false,
  // flags derivados
  isDemo: false,
  trialVigente: false,
  codRefValido: false,
  comprasPrevias: 0,
  mostrarCTAReferidos: false,
  // control del modal de planes
  openPlanesModal: () => { },
  closePlanesModal: () => { },
});

const FALLBACK_CTA_KEY = "cta_referidos_shown"; // usado si aún no hay tienda

export const TiendaProvider = ({
  children,
  forzarCTA = false,            // <- fuerza mostrar la alerta (campañas/tests)
  soloUnaVezPorSesion = true,    // <- si true, la alerta solo aparece 1 vez por pestaña/tienda
  autoAlerta = true,             // <- si false, no se muestra alerta automática
}) => {
  const [tienda, setTienda] = useState(null);
  const [tiendaLoading, setTiendaLoading] = useState(true);

  const [referidos, setReferidos] = useState(null);
  const [referidosLoading, setReferidosLoading] = useState(false);

  const [planesModalOpen, setPlanesModalOpen] = useState(false);
  const [ctaAlertOpen, setCtaAlertOpen] = useState(false);

  /* ============ 1) Cargar tienda ============ */
  useEffect(() => {
    (async () => {
      setTiendaLoading(true);
      try {
        const { data } = await axiosClient.get("/perfil/mi-tienda");
        setTienda(data ?? null);
      } catch (error) {
        console.error("❌ No se pudo cargar la tienda:", error);
        setTienda(null);
      } finally {
        setTiendaLoading(false);
      }
    })();
  }, []);

  /* ============ 2) Cargar estado de referidos cuando hay tienda ============ */
  useEffect(() => {
    if (!tienda?.id) return;
    (async () => {
      setReferidosLoading(true);
      try {
        const { data } = await axiosClient.get("/referidos/estado");
        setReferidos(data ?? null);
        // 🔎 Logs útiles
        console.debug("[Referidos][OK] estado:", data);
      } catch (err) {
        console.error("❌ No se pudo cargar el estado de referidos:", err);
        setReferidos(null);
      } finally {
        setReferidosLoading(false);
      }
    })();
  }, [tienda?.id]);

  /* ============ 3) Derivar flags (respetar backend) ============ */
  const {
    isDemo,
    trialVigente,
    codRefValido,
    comprasPrevias,
    mostrarCTAReferidos,
  } = useMemo(() => {
    const enDemo = Number(tienda?.plan_id) === 1;
    const trialOk = Boolean(referidos?.trial?.vigente);
    const refOk = Boolean(referidos?.referido?.valido);
    const compras = Number(referidos?.compras_previas || 0);

    // ✅ Confiar en el backend (no revalidar condiciones)
    const cta = Boolean(referidos?.mostrar_cta_referidos);

    // 🔎 Logs útiles
    console.debug("[Referidos][DERIVADOS]", {
      enDemo,
      trialOk,
      refOk,
      compras,
      mostrar_cta_referidos_backend: referidos?.mostrar_cta_referidos,
      mostrarCTAReferidos_final: cta,
    });

    return {
      isDemo: enDemo,
      trialVigente: trialOk,
      codRefValido: refOk,
      comprasPrevias: compras,
      mostrarCTAReferidos: cta,
    };
  }, [tienda, referidos]);

  // 🔑 Clave de sesión POR TIENDA para no “bloquear” otras cuentas
  const sessionKey = useMemo(() => {
    return tienda?.id ? `${FALLBACK_CTA_KEY}_${tienda.id}` : FALLBACK_CTA_KEY;
  }, [tienda?.id]);

  /* ============ 4) Decidir si mostrar alerta automática ============ */
  useEffect(() => {
    if (!autoAlerta) return;
    if (tiendaLoading || referidosLoading) return;

    // Si se fuerza (campañas), mostrar sin importar backend
    if (forzarCTA) {
      if (soloUnaVezPorSesion) {
        const already = sessionStorage.getItem(sessionKey);
        if (already === "1") return;
        sessionStorage.setItem(sessionKey, "1");
      }
      setCtaAlertOpen(true);
      console.debug("[CTA] Forzada por prop forzarCTA.");
      return;
    }

    // Caso normal: solo si backend indica CTA
    if (!mostrarCTAReferidos) {
      console.debug("[CTA] No se muestra porque backend indicó mostrar_cta_referidos = false.");
      return;
    }

    if (soloUnaVezPorSesion) {
      const already = sessionStorage.getItem(sessionKey);
      if (already === "1") {
        console.debug("[CTA] Ya se mostró esta sesión para esta tienda. sessionKey:", sessionKey);
        return;
      }
      sessionStorage.setItem(sessionKey, "1");
    }

    setCtaAlertOpen(true);
    console.debug("[CTA] Mostrando alerta. sessionKey:", sessionKey);
  }, [
    autoAlerta,
    forzarCTA,
    soloUnaVezPorSesion,
    mostrarCTAReferidos,
    tiendaLoading,
    referidosLoading,
    sessionKey,
  ]);

  /* ============ 5) Acciones ============ */
  const handleOpenPlanes = () => {
    setCtaAlertOpen(false);
    setPlanesModalOpen(true);
  };

  const ctxValue = useMemo(
    () => ({
      tienda,
      loading: tiendaLoading,
      tiendaLoading,
      referidos,
      referidosLoading,
      isDemo,
      trialVigente,
      codRefValido,
      comprasPrevias,
      mostrarCTAReferidos,
      openPlanesModal: () => setPlanesModalOpen(true),
      closePlanesModal: () => setPlanesModalOpen(false),
    }),
    [
      tienda,
      tiendaLoading,
      referidos,
      referidosLoading,
      isDemo,
      trialVigente,
      codRefValido,
      comprasPrevias,
      mostrarCTAReferidos,
    ]
  );

  return (
    <TiendaContext.Provider value={ctxValue}>
      {children}

      {/* 🔔 Alerta CTA de referido */}
      <Dialog
        open={ctaAlertOpen}
        onClose={() => setCtaAlertOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          🎉 ¡Aprovecha 5% de descuento!
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body1">
              Obtén <b>5% de descuento</b> en tu primer Plan por tiempo limitado.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Da clic en <b>“Aprovechar 5% ahora”</b> para abrir el panel de planes y Comenzar tu compra.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCtaAlertOpen(false)} variant="text">
            Más tarde
          </Button>
          <Button onClick={handleOpenPlanes} variant="contained">
            Aprovechar 5% ahora
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🧩 Modal de Planes y Complementos controlado por el contexto */}
      <ModalPlanesComplementos
        open={planesModalOpen}
        onClose={() => setPlanesModalOpen(false)}
      />
    </TiendaContext.Provider>
  );
};

// ✅ hook seguro
export const useTienda = () => {
  const ctx = useContext(TiendaContext);

  return ctx ?? {
    tienda: null,
    loading: false,
    tiendaLoading: false,
    referidos: null,
    referidosLoading: false,
    isDemo: false,
    trialVigente: false,
    codRefValido: false,
    comprasPrevias: 0,
    mostrarCTAReferidos: false,
    openPlanesModal: () => { },
    closePlanesModal: () => { },
  };
};