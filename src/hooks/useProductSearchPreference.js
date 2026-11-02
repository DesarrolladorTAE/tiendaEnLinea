import { useMemo, useState } from "react";

const FIELDS = new Set(["all", "name", "sku", "oe_number"]);

export default function useProductSearchPreference(storeId) {
  const id = Number(storeId);
  const key = Number.isSafeInteger(id) && id > 0 ? `products:search-field:v1:${id}` : null;
  const saved = useMemo(() => {
    if (!key) return "all";
    try {
      const value = localStorage.getItem(key);
      return FIELDS.has(value) ? value : "all";
    } catch { return "all"; }
  }, [key]);
  const [selection, setSelection] = useState({ key, value: saved });
  const field = selection.key === key ? selection.value : saved;

  const selectField = value => {
    if (!FIELDS.has(value)) return;
    setSelection({ key, value });
    // Persist only an allowlisted field, never query text, products or credentials.
    if (key) {
      try { localStorage.setItem(key, value); } catch { /* Keep working if browser storage is unavailable. */ }
    }
  };
  return [field, selectField];
}
