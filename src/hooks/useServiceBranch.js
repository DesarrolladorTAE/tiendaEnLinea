import { useLocation, useSearchParams } from "react-router-dom";
import { useAdminUi } from "../context/AdminUiContext";

export default function useServiceBranch() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { selectedBranch } = useAdminUi();
  const fromNavigation = location.state?.branch;
  const branchId = Number(params.get("branch_id") ?? fromNavigation?.id ?? selectedBranch?.id ?? 0);
  if (!Number.isSafeInteger(branchId) || branchId < 1) return null;
  return [fromNavigation, selectedBranch].find((branch) => Number(branch?.id) === branchId) ?? { id: branchId };
}
