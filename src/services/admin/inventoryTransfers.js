import axiosClient from "../../config/axiosClient";

const base = "/inventory-transfers";
export function transferData(response) {
  const body = response.data;
  if (!body || typeof body !== "object" || body.success === false || body.ok === false) throw new Error(body?.message || "El servidor no devolvió datos del traspaso.");
  return body;
}
export function transferCollection(body, key) {
  const value = body?.[key] ?? body?.data?.[key] ?? (key === "availability" ? body?.items ?? body?.data?.items : undefined) ?? body?.data ?? body;
  const rows = Array.isArray(value) ? value : value?.data;
  if (!Array.isArray(rows)) throw new Error("No se pudo leer la lista del servidor.");
  const lastPage = Number(value?.last_page ?? value?.meta?.last_page ?? body?.meta?.last_page ?? 1);
  if (!Number.isSafeInteger(lastPage) || lastPage < 0) throw new Error("La paginación del servidor no es válida.");
  return { rows, lastPage: Math.max(1, lastPage) };
}
export function transferRecord(body) {
  const payload = body?.data ?? body;
  const row = body?.transfer ?? payload?.transfer ?? payload;
  if (!row?.id) throw new Error("No se pudo leer el detalle del traspaso.");
  return { ...row, items: row.items ?? payload?.items ?? body?.items, events: row.events ?? payload?.events ?? body?.events };
}
export const transferError = error => [error?.response?.data?.message || error?.message || "No se pudo completar la operación.", ...Object.values(error?.response?.data?.errors || {}).flat()].join("\n");
export const inventoryKey = row => [row.product_id, row.variant_id || "", row.source_warehouse_id || ""].join(":");
export const transferItemName = item => item.product_name || item.name || item.product_name_snapshot || item.source_product_name || item.product_snapshot?.name || item.snapshot?.product_name || item.snapshot?.name || item.source_product?.name || item.product?.name || (item.source_product_id || item.product_id ? `Producto #${item.source_product_id || item.product_id}` : item.sku || item.product_sku || "Producto sin nombre en el comprobante");
export const canReceiveTransfer = (record, branchId) => record?.status === "pending" && Number(branchId) > 0 && Number(record.destination_branch_id ?? record.destination_branch?.id) === Number(branchId);
export function transferQuantityInput(row, value, { destinationGeneral = false } = {}) {
  const precision = !row.variant_id && (!row.source_warehouse_id || destinationGeneral) ? 2 : 3;
  let quantity = String(value).replace(",", ".");
  if (!new RegExp(`^\\d*(?:\\.\\d{0,${precision}})?$`).test(quantity)) return null;
  if (quantity === "") return ""; // Allow clearing while editing; submission requires a positive amount.
  if (quantity.startsWith(".")) quantity = `0${quantity}`;
  const available = String(row.available);
  if (!/^\d+(?:\.\d{1,3})?$/.test(available)) return null;
  const scaled = value => { const [whole, fraction = ""] = value.split("."); return BigInt(whole || "0") * 1000n + BigInt(fraction.padEnd(3, "0")); };
  return scaled(quantity) <= scaled(available) ? quantity : null;
}
export const destinationLabel = row => row.destination_inventory_mode === "general" || (row.destination_warehouse_id == null && row.destination_inventory_mode !== "warehouse") ? "Inventario general / Sin almacén" : row.destination_warehouse?.name || row.destination_warehouse_name || `Almacén #${row.destination_warehouse_id ?? "—"}`;
export function validateTransferItems(items, { destinationGeneral = false } = {}) {
  if (!items.length || items.length > 200) throw new Error("Selecciona entre 1 y 200 partidas.");
  const keys = new Set();
  return items.map(row => {
    const quantity = String(row.quantity).trim();
    const globalSimple = !row.variant_id && !row.source_warehouse_id;
    const decimal = globalSimple ? /^\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,3})?$/;
    const scaled = value => { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0")); };
    const available = String(row.available);
    if (!decimal.test(quantity) || !/^\d+(?:\.\d{1,3})?$/.test(available) || scaled(quantity) <= 0n || scaled(quantity) > scaled(available)) throw new Error(`Revisa la cantidad de ${row.product_name || row.name || row.sku || row.product_id}: debe ser positiva, no superar la existencia y usar máximo ${globalSimple ? 2 : 3} decimales.`);
    if (destinationGeneral && !row.variant_id && (quantity.split(".")[1] || "").replace(/0+$/, "").length > 2) throw new Error("El inventario general de productos simples admite máximo dos decimales significativos. Ajusta la cantidad sin redondear automáticamente.");
    const key = inventoryKey(row);
    if (keys.has(key)) throw new Error("No repitas producto, variante y almacén en distintas partidas.");
    keys.add(key);
    return { product_id: row.product_id, ...(row.variant_id ? { variant_id: row.variant_id } : {}), ...(row.source_warehouse_id ? { source_warehouse_id: row.source_warehouse_id } : {}), ...(row.destination_product_id ? { destination_product_id: row.destination_product_id } : {}), ...(row.destination_variant_id ? { destination_variant_id: row.destination_variant_id } : {}), quantity };
  });
}
export const transfersApi = {
  async list(params, signal) { return transferData(await axiosClient.get(base, { params, signal })); },
  async availability(params, signal) { return transferData(await axiosClient.get(`${base}/availability`, { params, signal })); },
  async detail(id, signal) { return transferRecord(transferData(await axiosClient.get(`${base}/${id}`, { signal }))); },
  async create(body, key) { return transferData(await axiosClient.post(base, body, { headers: { "Idempotency-Key": key } })); },
  async decide(id, action, notes) {
    if (!["accept", "reject"].includes(action)) throw new Error("Acción inválida.");
    return transferData(await axiosClient.post(`${base}/${id}/${action}`, { notes }));
  },
  async branches(storeId, signal) {
    if (!storeId) throw new Error("No se pudo identificar la tienda.");
    return this.catalog("/branches", { store_id: storeId }, "branches", signal);
  },
  async warehouses(branchId, signal) { return this.catalog(`/branches/${branchId}/warehouses`, {}, "warehouses", signal); },
  async destinationProducts(branchId, useWarehouses, signal) {
    const rows = await this.catalog(`/admin/branches/${branchId}/products`, {}, "products", signal);
    return rows.filter(row => [true, 1, "1"].includes(row.use_warehouse_inventory) === useWarehouses && row.use_warehouse_inventory != null);
  },
  async catalog(url, params, key, signal) {
    const rows = []; let page = 1, lastPage = 1;
    do {
      const result = transferCollection(transferData(await axiosClient.get(url, { params: { ...params, page, per_page: 100 }, signal })), key);
      rows.push(...result.rows); lastPage = result.lastPage; page += 1;
    } while (page <= lastPage);
    return rows;
  },
  async pdf(id, download = false) {
    let response;
    try { response = await axiosClient.get(`${base}/${id}/pdf`, { responseType: "blob", params: download ? { download: 1 } : {} }); }
    catch (error) {
      if (error.response?.data instanceof Blob) { try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Preserve the original error. */ } }
      if (!error.response) throw new Error("No se recibió respuesta del servidor al generar el PDF. Puede ser una interrupción de red o un bloqueo de CORS. Intenta nuevamente; si persiste, revisa la solicitud PDF y los registros del servidor.");
      throw error;
    }
    if (!response.data.type.includes("pdf")) {
      let message;
      try { message = JSON.parse(await response.data.text()).message; } catch { /* The response may be HTML. */ }
      throw new Error(message || "El servidor no generó un PDF válido.");
    }
    return response.data;
  },
};
