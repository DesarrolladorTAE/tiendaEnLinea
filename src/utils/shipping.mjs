export const validTrackingCode = (value) => /^(?:[a-zA-Z0-9]{48}|ENV-[A-Z0-9]{12})$/.test(value);

export function shippingConfigForBranch(config, branchId, storeId) {
  if (!config || String(config.branch_id) !== String(branchId) || (storeId && String(config.store_id) !== String(storeId))) throw new Error("La configuración no corresponde a la sucursal del catálogo.");
  const requirements = config.requirements;
  const enabled = config.enabled === true && requirements?.professional_plan === true && requirements?.payment_gateway === true && requirements?.branch_pos === true;
  return { ...config, enabled, methods: enabled && Array.isArray(config.methods) ? config.methods : [], delivery_points: enabled && Array.isArray(config.delivery_points) ? config.delivery_points : [] };
}

export function safeShippingUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function retryAfterMs(value, now = Date.now()) {
  if (value == null || value === "") return 60000;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(value) - now) || 60000;
}

export function buildShipment(config, values) {
  if (!config?.enabled || !values.shipping_method_id) return null;
  const method = config.methods?.find((item) => String(item.id) === String(values.shipping_method_id));
  if (!method) throw new Error("Selecciona un método de entrega disponible.");
  const name = String(values.recipient_name || "").trim();
  const phone = String(values.recipient_phone || "").trim();
  const email = String(values.recipient_email || "").trim();
  if (!name || name.length > 191) throw new Error("Escribe el nombre del destinatario (máximo 191 caracteres).");
  if (!/^\+?\d{10,15}$/.test(phone)) throw new Error("El teléfono debe contener entre 10 y 15 dígitos, con + opcional.");
  if (email && (email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Escribe un correo válido.");
  if (typeof values.notification_consent !== "boolean") throw new Error("Indica tu preferencia de avisos.");
  const shipment = { shipping_method_id: method.id, recipient_name: name, recipient_phone: phone, notification_consent: config.notifications_available ? values.notification_consent : false };
  if (email) shipment.recipient_email = email;
  if (["pickup", "delivery_point"].includes(method.fulfillment_type)) {
    const point = config.delivery_points?.find((item) => String(item.id) === String(values.delivery_point_id));
    if (!point) throw new Error("Selecciona un punto de entrega disponible.");
    shipment.delivery_point_id = point.id;
  } else if (["shipping", "home_delivery"].includes(method.fulfillment_type)) {
    const address = String(values.destination_address || "").trim();
    if (!address || address.length > 2000) throw new Error("Escribe el domicilio completo (máximo 2000 caracteres).");
    shipment.destination_address = address;
  } else throw new Error("Modalidad de entrega no disponible.");
  return shipment;
}
