import React, { createContext, useContext, useMemo, useState } from "react";

const AdminUiContext = createContext({
  hideLayout: false,
  setHideLayout: () => {},
  selectedBranch: null,
  setSelectedBranch: () => {},
  clearSelectedBranch: () => {},
});

const KEY = "ADMIN_SELECTED_BRANCH";

export function AdminUiProvider({ children }) {
  const [hideLayout, setHideLayout] = useState(false);

  const [selectedBranch, _setSelectedBranch] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setSelectedBranch = (branch) => {
    _setSelectedBranch(branch);
    try {
      if (branch) sessionStorage.setItem(KEY, JSON.stringify(branch));
      else sessionStorage.removeItem(KEY);
    } catch {}
  };

  const clearSelectedBranch = () => setSelectedBranch(null);

  const value = useMemo(
    () => ({
      hideLayout,
      setHideLayout,
      selectedBranch,
      setSelectedBranch,
      clearSelectedBranch,
    }),
    [hideLayout, selectedBranch]
  );

  return <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>;
}

export const useAdminUi = () => useContext(AdminUiContext);
