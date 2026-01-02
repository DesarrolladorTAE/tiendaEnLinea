import { useMemo } from "react";
import { useTienda } from "../context/TiendaContext";

// Plan 2 = Negocio => SOLO SUELTAS (no hijas, no padres con hijas)
const PLAN_SOLO_SUELTAS = 2;

// Si luego quieres permitir jerarquía a otros planes:
const PLANES_CON_JERARQUIA = new Set([1, 3, 4]);

export default function useCategoriaPadreGate() {
  const { tienda, tiendaLoading, openPlanesModal } = useTienda();

  const planId = Number(tienda?.plan_id || 0);

  const isPlanSoloSueltas = planId === PLAN_SOLO_SUELTAS;

  const canUseHierarchy = useMemo(() => {
    if (!planId) return false;
    // Plan 2 no
    if (isPlanSoloSueltas) return false;
    return PLANES_CON_JERARQUIA.has(planId);
  }, [planId, isPlanSoloSueltas]);

  const reasonHierarchy = useMemo(() => {
    if (tiendaLoading) return "Cargando tienda...";
    if (!planId) return "No se pudo detectar el plan.";
    if (!isPlanSoloSueltas) return "";
    return "Plan Negocio: solo puedes crear categorías sueltas (sin padre y sin hijas).";
  }, [tiendaLoading, planId, isPlanSoloSueltas]);

  return {
    tiendaLoading,
    planId,
    isPlanSoloSueltas,      // ✅ importante
    canUseHierarchy,        // ✅ jerarquía permitida
    reasonHierarchy,
    openPlanesModal,
  };
}
