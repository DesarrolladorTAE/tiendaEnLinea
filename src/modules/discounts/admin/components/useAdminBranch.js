import { useEffect, useMemo } from "react";

export function useAdminBranch({
  branchFromNav,
  branchIdFromUrl,
  selectedBranch,
  setSelectedBranch,
  setHideLayout,
  navigate,
}) {
  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  useEffect(() => setHideLayout(false), [setHideLayout]);

  useEffect(() => {
    if (branchFromNav?.id) setSelectedBranch(branchFromNav);
  }, [branchFromNav, setSelectedBranch]);

  useEffect(() => {
    if (!activeBranch?.id) navigate("/admin/sucursales");
  }, [activeBranch?.id, navigate]);

  return activeBranch;
}