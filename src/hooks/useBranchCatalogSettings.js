import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

export default function useBranchCatalogSettings(branchId, enabled = true) {
  const [state, setState] = useState({ branchId: null, settings: null, loading: false, error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!branchId || !enabled) return;
    const controller = new AbortController();
    setState({ branchId, settings: null, loading: true, error: "" });
    axiosClient.get(`/admin/branches/${branchId}/catalog-settings`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setState({ branchId, settings: data.data, loading: false, error: "" }); })
      .catch(() => { if (!controller.signal.aborted) setState({ branchId, settings: null, loading: false, error: "No se pudo cargar la configuración vehicular." }); });
    return () => controller.abort();
  }, [branchId, enabled, revision]);
  return { ...(enabled && String(state.branchId) === String(branchId) ? state : { settings: null, loading: Boolean(enabled && branchId), error: "" }), retry: () => setRevision(v => v + 1) };
}
