import { useTienda } from "../context/TiendaContext";
import useBranchCatalogSettings from "./useBranchCatalogSettings";
import useServiceBranch from "./useServiceBranch";
import { hasBranchAction } from "../utils/branchCatalogAccess";

export default function useVehicleRecordsAccess(enabled = true) {
  const branch = useServiceBranch();
  const { tienda, tiendaLoading } = useTienda();
  const storeId = tienda?.id;
  const { settings, loading, error, status, retry } = useBranchCatalogSettings(
    branch?.id, Boolean(enabled && storeId && !tiendaLoading), storeId,
  );
  return {
    branch, storeId, loading: tiendaLoading || loading, error, status, retry,
    canRead: hasBranchAction(settings, "vehicle_records", "read"),
    canWrite: hasBranchAction(settings, "vehicle_records", "write"),
    canManageStatus: hasBranchAction(settings, "vehicle_records", "manage_status"),
    canReadCatalog: hasBranchAction(settings, "vehicle_catalog", "read"),
  };
}
