// src/hooks/useReglaTaeconta.js
import useComplementosActivos from "./useComplementosActivos";
import { useTienda } from "../context/TiendaContext";

export const PLAN_TAECONTA_MIN = 3;        // ← mínimo requerido
export const COMPLEMENTO_TAECONTA_ID = 4;  // ← mismo complemento

export default function useReglaTaeconta() {
  const { tienda, loading: tiendaLoading } = useTienda();
  const {
    tieneComplemento,
    loading: compLoading,
    error: compError,
  } = useComplementosActivos();

  const planId = tienda?.plan_id ?? tienda?.plan?.id ?? null;
  const hasPlan = (planId ?? 0) >= PLAN_TAECONTA_MIN;   // ← aquí el cambio
  const hasComplemento = !!tieneComplemento(COMPLEMENTO_TAECONTA_ID);

  const allowed = !!tienda && hasPlan && hasComplemento;

  let reason = null;
  if (tiendaLoading || compLoading) reason = "LOADING";
  else if (!tienda) reason = "SIN_TIENDA";
  else if (!hasPlan) reason = "PLAN_INFERIOR";          // ← nombre de motivo más claro
  else if (!hasComplemento) reason = "FALTA_COMPLEMENTO";

  return {
    allowed,
    loading: tiendaLoading || compLoading,
    error: compError,
    reason,
    planId,
    hasPlan,
    hasComplemento,
  };
}
