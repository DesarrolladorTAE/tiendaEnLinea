export const shipmentStatuses = {
  pending: "Pendiente", preparing: "En preparación", ready_to_ship: "Listo para enviar",
  shipped: "Enviado", in_transit: "En tránsito", delivered: "Entregado", cancelled: "Cancelado",
};
export const shipmentTransitions = {
  pending: ["pending", "preparing", "cancelled"],
  preparing: ["preparing", "ready_to_ship", "cancelled"],
  ready_to_ship: ["ready_to_ship", "shipped", "delivered", "cancelled"],
  shipped: ["shipped", "in_transit", "delivered", "cancelled"],
  in_transit: ["in_transit", "delivered", "cancelled"],
  delivered: [], cancelled: [],
};
const enabled = value => value === true || value === 1 || value === "1";
export function privateShippingConfig(config, branchId) {
  const settings = config?.settings || {};
  const channels = (config?.channels || []).filter(row => enabled(row.is_active));
  return {
    enabled: enabled(settings.enabled) && enabled(settings.allow_pos),
    notifications_available: enabled(settings.notify_updates) && settings.whatsapp_provider !== "none",
    methods: (config?.methods || []).filter(row => enabled(row.is_active) && channels.some(channel => String(channel.id) === String(row.shipping_channel_id))),
    delivery_points: (config?.delivery_points || []).filter(row => enabled(row.is_active) && (!branchId || String(row.branch_id) === String(branchId))),
  };
}
export const shippingError = error => {
  const status = error.response?.status;
  if (status === 401) return "Tu sesión venció. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "El registro no existe o no pertenece a tu tienda o sucursal.";
  return [error.response?.data?.message || error.message || "No se pudo completar la operación.", ...Object.values(error.response?.data?.errors || {}).flat()].join(" ");
};
export function saleOnline(sale) {
  return sale?.is_online === true || sale?.is_online === 1 || ["online", "public", "web", "catalog"].includes(sale?.source ?? sale?.origin ?? sale?.channel);
}
export function cancelledShippingSale(sale, orderStatus) {
  return ["cancelled", "canceled", "cancelada", "cancelado"].includes(String(sale?.status || "").toLowerCase()) ||
    !!sale?.cancelled_at || !!sale?.canceled_at || String(orderStatus || "").toLowerCase() === "rejected";
}
