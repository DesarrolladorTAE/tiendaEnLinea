export function currentInvoiceComplement(items, now = Date.now()) {
  return Array.isArray(items) ? items.find((item) => {
    if (!item || typeof item !== "object") return false;
    if (Number(item.complemento_id ?? item.id) !== 4) return false;
    const state = { ...item, ...item.pivot };
    if ([false, 0, "0", "false"].includes(state.is_active) || [false, 0, "0", "false"].includes(state.activo)) return false;
    if (state.status && !["activo", "activa", "active", "vigente", "pagado", "paid", "1"].includes(String(state.status).toLowerCase())) return false;
    const start = state.fecha_inicio;
    const end = state.fecha_fin;
    const timestamp = (value, endOfDay) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}` : value).getTime();
    return (!start || timestamp(start, false) <= now) && (!end || timestamp(end, true) >= now);
  }) : undefined;
}

export const hasCurrentInvoiceComplement = (items, now) => Boolean(currentInvoiceComplement(items, now));
