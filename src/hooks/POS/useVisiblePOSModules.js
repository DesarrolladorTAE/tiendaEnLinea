import { useCallback, useEffect, useRef, useState } from "react";
import client from "../../config/axiosClientPOS";
import { isOperationalPOSModule, posControlledEnabled } from "../../utils/posServices";

export default function useVisiblePOSModules(posId) {
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(null);

  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setRefreshing(true);
    try {
      const request = { signal: controller.signal };
      const [visible, full] = await Promise.allSettled([
        client.get("/pos/modules/enabled", request),
        posControlledEnabled ? client.get("/pos/modules", request) : null,
      ]);
      const data = visible.value?.data;
      if (!Array.isArray(data?.data)) throw new Error("Catálogo inválido");
      if (!controller.signal.aborted) {
        const keys = [...new Set(data.data.filter((module) => module?.visible === true).map(({ key }) => key))];
        const capabilities = full.value?.data?.data;
        const rows = Array.isArray(capabilities) ? capabilities : [];
        const operationalKeys = [...new Set((posControlledEnabled ? rows : data.data).filter(isOperationalPOSModule).map(({ key }) => key))];
        const authorizedKeys = posControlledEnabled ? keys.filter((key) => rows.some((row) =>
          row?.key === key && row.available === true && row.enabled === true && row.visible === true)) : keys;
        const idempotency = rows.filter((row) => row?.key === "sales_v2_idempotency");
        setResult({ posId, keys, operationalKeys, authorizedKeys,
          idempotencyEnabled: idempotency.length === 1 && idempotency[0].operational_enabled === true });
      }
    } catch {
      if (!controller.signal.aborted) setResult({ posId, error: "No se pudieron consultar los módulos del punto de venta." });
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, [posId]);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      pending.current?.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const current = result?.posId === posId ? result : null;
  return { keys: current?.keys, operationalKeys: current?.operationalKeys, authorizedKeys: current?.authorizedKeys,
    idempotencyEnabled: !refreshing && current?.idempotencyEnabled === true, error: current?.error, refreshing, refresh };
}
