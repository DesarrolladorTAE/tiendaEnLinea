import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicShippingConfig } from "../services/public/shippingService";
import { retryAfterMs, shippingConfigForBranch } from "../utils/shipping.mjs";

export default function usePublicShippingConfig({ open, branchId, storeId }) {
  const [state, setState] = useState({ key: "", config: null, loading: false, error: "", retryAt: 0 });
  const request = useRef(null);
  const retryAt = useRef(0);
  const [, tick] = useState(0);
  const key = `${storeId || ""}:${branchId || ""}`;
  const refresh = useCallback(async () => {
    if (!open || !branchId || Date.now() < retryAt.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState((current) => ({ ...current, key, config: null, loading: true, error: "" }));
    try {
      const response = await getPublicShippingConfig(branchId, controller.signal);
      if (controller.signal.aborted) return;
      const config = shippingConfigForBranch(response.data.data, branchId, storeId);
      setState({ key, config, loading: false, error: "", retryAt: 0 });
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure.response?.status === 429) retryAt.current = Date.now() + retryAfterMs(failure.response.headers?.["retry-after"]);
      setState({ key, config: null, loading: false, retryAt: retryAt.current, error: failure.response?.status === 429 ? "Se alcanzó el límite de consultas de entrega. Espera antes de reintentar." : "No pudimos consultar las opciones de entrega. Reintenta antes de enviar el pedido." });
    }
  }, [open, branchId, storeId, key]);

  useEffect(() => {
    if (open && branchId) void refresh();
    return () => request.current?.abort();
  }, [refresh, open, branchId]);

  useEffect(() => {
    if (!state.retryAt || !open) return undefined;
    const timer = window.setInterval(() => {
      tick((value) => value + 1);
      if (Date.now() >= state.retryAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.retryAt, open]);

  const current = state.key === key ? state : { config: null, loading: Boolean(open && branchId), error: "", retryAt: 0 };
  return { ...current, refresh, waiting: retryAt.current > Date.now() };
}
