import useBranchCatalogSettings from "./useBranchCatalogSettings";
import { hasBranchAction } from "../utils/branchCatalogAccess";

export default function useServiceSetupModules(branchId) {
  const { settings, loading, error, retry } = useBranchCatalogSettings(branchId);
  return {
    loading, error, retry,
    vehicleRecords: hasBranchAction(settings, "vehicle_records", "write"),
    serviceForms: hasBranchAction(settings, "service_forms", "read") &&
      hasBranchAction(settings, "service_forms", "configure"),
  };
}
