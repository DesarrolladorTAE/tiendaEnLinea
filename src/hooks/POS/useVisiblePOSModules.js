import { useCallback, useEffect, useRef, useState } from "react";
import client from "../../config/axiosClientPOS";

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
      const { data } = await client.get("/pos/modules/enabled", { signal: controller.signal });
      if (!Array.isArray(data?.data)) throw new Error("Catálogo inválido");
      if (!controller.signal.aborted) {
        setResult({ posId, keys: [...new Set(data.data.filter((module) => module?.visible === true).map(({ key }) => key))] });
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
  return { keys: current?.keys, error: current?.error, refreshing, refresh };
}
