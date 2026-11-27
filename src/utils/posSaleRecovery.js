const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
const storageKey = (posId) => `pos-v2-recovery:${posId}`;

export function readSaleRecovery(posId) {
  if (!posId) return null;
  try {
    const saved = localStorage.getItem(storageKey(posId));
    if (!saved) return null;
    const reference = JSON.parse(saved);
    return uuid.test(reference.key) ? reference : { unavailable: true };
  } catch {
    return { unavailable: true };
  }
}

export function reserveSaleRecovery(posId, orderId) {
  if (!posId || readSaleRecovery(posId)) throw new Error("Revisa el estado de la venta anterior antes de volver a cobrar.");
  const reference = { key: globalThis.crypto.randomUUID(), ...(orderId ? { orderId: Number(orderId) } : {}) };
  localStorage.setItem(storageKey(posId), JSON.stringify(reference));
  return reference;
}

export function lockSaleRecovery(posId, reserve) {
  return globalThis.navigator?.locks ? navigator.locks.request(storageKey(posId), reserve) : reserve();
}

export function updateSaleRecovery(posId, reference, conflict = false) {
  const current = readSaleRecovery(posId);
  if (current?.key !== reference.key) return;
  if (conflict) localStorage.setItem(storageKey(posId), JSON.stringify({ ...reference, conflict: true }));
  else localStorage.removeItem(storageKey(posId));
}

export async function recoverPOSSale(client, posId, reference) {
  const { data } = await client.get(`/v2/sales/idempotency/${reference.key}`);
  if (data?.replayed !== true || !Number.isSafeInteger(Number(data.sale?.id)) || Number(data.sale.id) <= 0 ||
      Number(data.sale.pos_location_id) !== Number(posId)) {
    throw new Error("Laravel no confirmó una venta de esta terminal.");
  }
  return data;
}
