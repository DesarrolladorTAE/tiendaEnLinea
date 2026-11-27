import { scopePOSProduct, usesWarehouses } from "./productInventory";

export const posVehicleEnabled = typeof __MTELMX_POS_VEHICLE__ !== "undefined" && __MTELMX_POS_VEHICLE__;
export const positivePOSId = (value) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
export const compatibilityLabels = {
  compatible: "Compatible",
  universal: "Universal explícito",
  unknown: "Compatibilidad desconocida",
};

export function vehicleSearchParams(filters, context, page) {
  const { brand_id, model_id, year, classification, ...product } = filters;
  const vehicle = context.service_order_id || context.vehicle_id ? context : { brand_id, model_id, year };
  return Object.fromEntries(Object.entries({
    ...product, ...vehicle, page, per_page: 20,
    ...(classification === "universal" ? { include_compatible: 0, include_universal: 1, include_unknown: 0 }
      : classification === "unknown" ? { include_compatible: 0, include_universal: 0, include_unknown: 1 }
      : classification === "compatible" ? { include_compatible: 1, include_universal: 0, include_unknown: 0 } : {}),
  }).filter(([,value]) => value !== "" && value != null));
}

export function confirmedWarehouses(me, payload, product) {
  if (!Array.isArray(payload?.pos?.allowed_warehouses) && !Array.isArray(product?.pos_inventory?.allowed_warehouse_ids)) return [];
  const ids = [me?.warehouse_ids, payload?.warehouse_ids, payload?.pos?.allowed_warehouses,
    product?.pos_inventory?.allowed_warehouse_ids].filter(Array.isArray)
    .map((list) => new Set(list.map((value) => String(value?.id ?? value)).filter(positivePOSId)));
  return ids.length ? [...ids[0]].filter((id) => ids.every((set) => set.has(id))) : [];
}

export async function findPOSVehicleProduct(client, terminal, productId, warehouse, signal) {
  if (signal.aborted) return null;
  if (!positivePOSId(productId)) throw new Error("El identificador del producto no es válido.");
  const { data } = await client.get(`/pos/products/${productId}`, { signal });
  if (signal.aborted) return null;
  if (data?.ok !== true || Number(data.pos?.id) !== Number(terminal.id) ||
      Number(data.branch_id) !== Number(terminal.branch_id) || Number(data.store_id) !== Number(terminal.store_id) ||
      Number(data.product?.id) !== Number(productId)) {
    throw new Error("El producto no coincide con la terminal autenticada.");
  }
  const product = data.product;
  if (!usesWarehouses(product)) return warehouse ? null : product;
  const ids = confirmedWarehouses(terminal, data, product).filter((id) => !warehouse || id === String(warehouse));
  return ids.length ? scopePOSProduct(product, ids) : null;
}

export async function resolveSaleLink(client, reference, signal, checkOnly = false) {
  const path = `/branches/${reference.branch}/service-orders/${reference.order}`;
  const { data } = await client.get(path, { signal });
  const order = data?.data;
  if (Number(order?.id) !== reference.order || Number(order?.branch_id) !== reference.branch ||
      Number(order?.store_id) !== reference.store) throw new Error("La orden no coincide con el contexto.");
  if (Number(order.sale_id) === reference.sale) return "linked";
  if (order.sale_id != null) return "conflict";
  if (checkOnly) return "pending";
  try {
    const { data: linked } = await client.post(`${path}/sale`, { sale_id: reference.sale }, { signal });
    return Number(linked?.data?.sale_id) === reference.sale ? "linked" : "pending";
  } catch (error) {
    if ([409, 422].includes(error.response?.status)) return "conflict";
    throw error;
  }
}

