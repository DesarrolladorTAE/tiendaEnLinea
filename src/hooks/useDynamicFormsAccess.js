import { useTienda } from "../context/TiendaContext";
import useBranchCatalogSettings from "./useBranchCatalogSettings";
import useServiceBranch from "./useServiceBranch";
import { hasBranchAction } from "../utils/branchCatalogAccess";

export default function useDynamicFormsAccess(enabled = true, documentBranchId) {
  const branch = useServiceBranch();
  const { tienda, tiendaLoading } = useTienda();
  const storeId = tienda?.id;
  const { settings, loading, error, retry, status } = useBranchCatalogSettings(
    documentBranchId ?? branch?.id, Boolean(enabled && storeId && !tiendaLoading), storeId,
  );
  const allowed = (action) => hasBranchAction(settings, "service_forms", action);
  return { branch, storeId, loading: tiendaLoading || loading, error, retry, status,
    read: allowed("read"), configure: allowed("configure"), capture: allowed("capture") };
}
