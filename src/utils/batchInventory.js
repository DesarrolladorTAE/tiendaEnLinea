import { inventoryFlag } from "./productInventory";

export const tracksBatches = product => inventoryFlag(product?.batch_tracking_enabled);

export function decimalQuantity(value, precision = 3, minimum = 0.001) {
  const quantity = String(value ?? "").trim();
  return new RegExp(`^\\d+(?:\\.\\d{1,${precision}})?$`).test(quantity) &&
    Number.isFinite(Number(quantity)) && Number(quantity) >= minimum ? quantity : null;
}

export function batchIdentity(fields, { optionalNumber = false } = {}) {
  const batch_number = String(fields.batch_number ?? "").trim();
  const expiry_precision = fields.expiry_precision ?? "day";
  if ((!batch_number && !optionalNumber) || batch_number.length > 120) throw new Error("Ingresa un número de lote de hasta 120 caracteres.");
  if (!["day", "month", "unknown"].includes(expiry_precision)) throw new Error("Selecciona una precisión de caducidad.");
  if (expiry_precision !== "unknown" && !fields.expires_on) throw new Error("Ingresa la caducidad del lote.");
  const expires_on = expiry_precision === "unknown" ? null : expiry_precision === "month" && fields.expires_on.length === 7
    ? `${fields.expires_on}-01` : fields.expires_on;
  const isDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (expires_on && !isDate(expires_on)) throw new Error("Ingresa una caducidad válida.");
  if (fields.manufactured_on && !isDate(fields.manufactured_on)) throw new Error("Ingresa una fecha de fabricación válida.");
  return {
    ...(batch_number && { batch_number }), expiry_precision, expires_on,
    manufactured_on: fields.manufactured_on || null,
    expiry_raw: fields.expiry_raw?.trim() || (expiry_precision === "month" ? expires_on.slice(0, 7) : null),
  };
}

export function batchExpiryLabel(batch) {
  if (batch.expiry_precision === "month") return `${batch.expiry_raw || batch.expires_on?.slice(0, 7) || "Sin fecha"} (precisión mensual)`;
  return batch.expiry_precision === "day" && batch.expires_on ? batch.expires_on.slice(0, 10) : "Desconocida";
}

export function batchError(error) {
  const { errors, message } = error?.response?.data ?? {};
  return Object.values(errors ?? {}).flat().find(value => typeof value === "string") ||
    message || error?.message || "No se pudo completar la operación.";
}

export async function fetchSaleBatchAllocations(client, saleId, config) {
  const { data } = await client.get(`/sales/${saleId}/batch-allocations`, config);
  if (String(data?.sale_id) !== String(saleId) || !Array.isArray(data.items) ||
      data.items.some(item => !Array.isArray(item.batches))) {
    throw new Error("No se pudieron verificar los lotes de la venta.");
  }
  return data.items;
}

export async function requireSaleWithoutBatches(client, saleId) {
  const items = await fetchSaleBatchAllocations(client, saleId);
  if (items.some(item => item.batches.length)) {
    throw new Error("Las devoluciones y cancelaciones de ventas con lotes aún no están habilitadas.");
  }
}
