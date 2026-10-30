const KEY = "inventory:updated";

export function notifyInventoryChanged() {
  window.dispatchEvent(new Event("products:changed"));
  try { localStorage.setItem(KEY, `${Date.now()}-${Math.random()}`); } catch { /* Local events still refresh this tab. */ }
}

export function subscribeInventoryChanges(refresh) {
  const onStorage = event => { if (event.key === KEY) refresh(); };
  const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
  window.addEventListener("products:changed", refresh);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("products:changed", refresh);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
