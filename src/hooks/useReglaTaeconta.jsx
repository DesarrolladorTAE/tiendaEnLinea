// src/hooks/useReglaTaeconta.js
import { useEffect, useState } from "react";
import axiosClientPOS from "../config/axiosClientPOS";
import useComplementosActivos from "./useComplementosActivos";
import { useTienda } from "../context/TiendaContext";

export const PLAN_TAECONTA_MIN = 3;
export const COMPLEMENTO_TAECONTA_ID = 4;

export default function useReglaTaeconta(posLocationId = null, options = {}) {
  const { ignorePOS = false } = options;

  const posId = ignorePOS
    ? null
    : posLocationId ||
      localStorage.getItem("POS_LOCATION_ID") ||
      localStorage.getItem("pos_location_id") ||
      null;

  const tieneTokenPOS = ignorePOS ? false : !!localStorage.getItem("POS_TOKEN");
  const usandoPOS = !ignorePOS && (!!posId || tieneTokenPOS);

  const { tienda, loading: tiendaLoading } = useTienda();

  const {
    tieneComplemento,
    loading: compLoading,
    error: compError,
  } = useComplementosActivos({
    enabled: !usandoPOS,
  });

  const [posRule, setPosRule] = useState(null);
  const [posLoading, setPosLoading] = useState(false);
  const [posError, setPosError] = useState(null);

  useEffect(() => {
    let alive = true;

    const fetchPosRule = async () => {
      if (!usandoPOS) return;

      setPosLoading(true);
      setPosError(null);

      try {
        const params = posId ? { pos_location_id: posId } : {};

        const { data } = await axiosClientPOS.get("/pos/taeconta/regla", {
          params,
        });

        if (!alive) return;
        setPosRule(data || null);
      } catch (error) {
        if (!alive) return;
        console.error("Error validando TaeConta POS:", error);
        setPosRule(null);
        setPosError(error);
      } finally {
        if (alive) setPosLoading(false);
      }
    };

    fetchPosRule();

    return () => {
      alive = false;
    };
  }, [usandoPOS, posId]);

  if (usandoPOS) {
    const allowed = !!posRule?.allowed;

    return {
      allowed,
      loading: posLoading,
      error: posError,
      reason: posLoading
        ? "LOADING"
        : !posRule
        ? "SIN_REGLA_POS"
        : allowed
        ? null
        : posRule?.reason || "ACCESO_RESTRINGIDO",
      planId: posRule?.plan_id ?? null,
      hasPlan: !!posRule?.has_plan,
      hasComplemento: !!posRule?.has_complemento,
      rule: posRule,
    };
  }

  const planId = tienda?.plan_id ?? tienda?.plan?.id ?? null;
  const hasPlan = (planId ?? 0) >= PLAN_TAECONTA_MIN;
  const hasComplemento = !!tieneComplemento(COMPLEMENTO_TAECONTA_ID);

  const allowed = !!tienda && hasPlan && hasComplemento;

  let reason = null;
  if (tiendaLoading || compLoading) reason = "LOADING";
  else if (!tienda) reason = "SIN_TIENDA";
  else if (!hasPlan) reason = "PLAN_INFERIOR";
  else if (!hasComplemento) reason = "FALTA_COMPLEMENTO";

  return {
    allowed,
    loading: tiendaLoading || compLoading,
    error: compError,
    reason,
    planId,
    hasPlan,
    hasComplemento,
    rule: null,
  };
}