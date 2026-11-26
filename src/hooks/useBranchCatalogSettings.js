import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

export default function useBranchCatalogSettings(branchId, enabled = true, storeId) {
  const [state, setState] = useState({ branchId: null, settings: null, loading: false, error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!branchId || !enabled) return;
    const controller = new AbortController();
    setState({ branchId, storeId, settings: null, loading: true, error: "" });
    axiosClient.get(`/admin/branches/${branchId}/catalog-settings`, { signal: controller.signal })
      .then(({ data }) => {
        const settings = data?.data;
        if (!settings || String(settings.branch_id) !== String(branchId) ||
            (Object.hasOwn(settings, "capabilities") && String(settings.capabilities?.scope?.branch_id) !== String(branchId))) {
          throw new Error("Invalid catalog settings scope");
        }
        if (!controller.signal.aborted) setState({ branchId, storeId, settings, loading: false, error: "" });
      })
      .catch((error) => { if (!controller.signal.aborted) setState({ branchId, storeId, settings: null, loading: false, error: "No se pudo cargar la configuración vehicular.", status: error.response?.status }); });
    return () => controller.abort();
  }, [branchId, enabled, revision, storeId]);
  return { ...(enabled && String(state.branchId) === String(branchId) && state.storeId === storeId ? state : { settings: null, loading: Boolean(enabled && branchId), error: "" }), retry: () => setRevision(v => v + 1) };
}
