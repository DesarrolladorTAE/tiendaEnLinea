// src/hooks/usePlanesPromos.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../config/axiosClient";
import planesStatic from "../utils/planes";

/** Convierte promos {paga, recibe} a etiquetas legibles */
function etiquetasPagaRecibe(promos = []) {
  return promos.map((p) => `Paga ${p.paga} y recibe ${p.recibe}`);
}

/**
 * usePlanesPromos
 * - Consulta si aplica 5% por referido (solo visual) y decora los planes.
 * - La fuente de verdad del monto final SIEMPRE es el backend (antes de cobrar).
 *
 * Opciones:
 * - conceptoDummy: concepto de prueba para checar elegibilidad (no cobra).
 * - montoDummy: monto de prueba para checar elegibilidad.
 * - endpoint: ruta backend para validar referido (según tu axiosClient).
 * - auto: si true, consulta elegibilidad en el primer render.
 */
export default function usePlanesPromos({
  conceptoDummy = "PLAN:0:1",
  montoDummy = 100,
  endpoint = "/referidos/descuento",
  auto = true,
} = {}) {
  const [eligibleRef, setEligibleRef] = useState(false);
  const [percentRef, setPercentRef] = useState(0);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Llama al backend para saber si aplica descuento por referido */
  const checkElegibilidad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Asegúrate que axiosClient envíe el token si la ruta es protegida.
      const resp = await axiosClient.post(endpoint, {
        concepto: conceptoDummy,
        monto: montoDummy,
      });

      if (process.env.NODE_ENV !== "production") {
        // Útil para depurar respuestas reales del backend
        console.log("[usePlanesPromos] respuesta referidos:", resp.data);
      }

      const elig = !!resp.data?.eligible;
      const pct = Number(resp.data?.percent ?? 0);

      if (mounted.current) {
        setEligibleRef(elig);
        setPercentRef(Number.isFinite(pct) ? pct : 0);
      }
    } catch (err) {
      console.error(
        "[usePlanesPromos] error consultando referidos:",
        err?.response?.data || err
      );
      if (mounted.current) {
        setEligibleRef(false);
        setPercentRef(0);
        setError(err?.response?.data?.message || "No se pudo validar el referido.");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [endpoint, conceptoDummy, montoDummy]);

  useEffect(() => {
    if (auto) {
      checkElegibilidad();
    }
  }, [auto, checkElegibilidad]);

  /** Calcula precio visual con 5% si aplica */
  const precioConRef = useCallback(
    (precioMensual) => {
      if (!eligibleRef || !percentRef) return precioMensual;
      const val = Number(precioMensual) || 0;
      return Math.max(0, +(val * (1 - percentRef / 100)).toFixed(2));
    },
    [eligibleRef, percentRef]
  );

  /** Decora los planes con etiquetas y precio visual con referido (si aplica) */
  const planesDecorados = useMemo(() => {
    const base = Array.isArray(planesStatic) ? planesStatic : [];
    return base.map((p) => {
      const etiquetas = etiquetasPagaRecibe(p.promociones || []);
      const precioPromo = p.demo ? 0 : precioConRef(p.precio_mensual);
      const showChipRef = !p.demo && eligibleRef && percentRef > 0;

      return {
        ...p,
        etiquetas,                // ["Paga 5 y recibe 6", ...]
        precio_con_ref: precioPromo, // precio mensual con 5% si aplica (visual)
        showChipRef,              // para mostrar Chip visual
        chipRefText: showChipRef
          ? `- ${percentRef}% primera compra por referido`
          : null,
      };
    });
  }, [eligibleRef, percentRef, precioConRef]);

  return {
    planes: planesDecorados,
    eligibleRef,
    percentRef,
    precioConRef,
    loading,
    error,
    /** Reintenta manualmente si lo necesitas */
    refetch: checkElegibilidad,
  };
}
