// A total is for display only. Never write it back to products.stock.
export const inventoryFlag = value => value === true || value === 1 || value === "1" || value === "true";
export const hasProductVariants = product => inventoryFlag(product?.has_variants) || inventoryFlag(product?.has_variations) || (Array.isArray(product?.variants) && product.variants.length > 0);
export const usesWarehouses = product => inventoryFlag(product?.use_warehouse_inventory);
export const usesDetailInventory = product => hasProductVariants(product) || usesWarehouses(product);
export const activeVariant = variant => ![false, 0, "0", "false"].includes(variant?.is_active);
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const quantity = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

export function warehouseRows(rows, allowedIds) {
  if (!Array.isArray(rows)) return [];
  // null means the authenticated POS endpoint has already scoped the rows.
  if (allowedIds == null) return rows;
  const allowed = new Set(allowedIds.map(String));
  return rows.filter(row => allowed.has(String(row.warehouse_id)));
}

export function scopePOSProduct(product, allowedIds) {
  if (!usesWarehouses(product)) return product;
  return {
    ...product,
    warehouse_inventories: Array.isArray(product.warehouse_inventories) ? warehouseRows(product.warehouse_inventories, allowedIds) : product.warehouse_inventories,
    variants: Array.isArray(product.variants) ? product.variants.map(variant => ({
      ...variant, warehouse_stocks: Array.isArray(variant.warehouse_stocks) ? warehouseRows(variant.warehouse_stocks, allowedIds) : variant.warehouse_stocks,
    })) : product.variants,
  };
}

export function variantStock(variant, useWarehouses, { warehouseId, allowedWarehouseIds } = {}) {
  if (!variant) return 0;
  if (!useWarehouses) return quantity(variant.stock);
  if (!Array.isArray(variant.warehouse_stocks)) return null;
  const rows = warehouseRows(variant.warehouse_stocks, allowedWarehouseIds);
  return rows.reduce((sum, row) => sum + (warehouseId == null || sameId(row.warehouse_id, warehouseId) ? quantity(row.stock) : 0), 0);
}

// null indicates missing detail, rather than a confirmed out-of-stock product.
export function productStock(product, { variantId, warehouseId, allowedWarehouseIds, activeOnly = false } = {}) {
  if (!product) return null;
  const useWh = usesWarehouses(product);
  if (hasProductVariants(product)) {
    if (!Array.isArray(product.variants)) return null;
    const variants = product.variants.filter(v => (!activeOnly || activeVariant(v)) && (variantId == null || sameId(v.id, variantId)));
    const stocks = variants.map(v => variantStock(v, useWh, { warehouseId, allowedWarehouseIds }));
    return stocks.some(stock => stock === null) ? null : stocks.reduce((sum, stock) => sum + stock, 0);
  }
  if (!useWh) return quantity(product.stock);
  if (!Array.isArray(product.warehouse_inventories)) return null;
  return warehouseRows(product.warehouse_inventories, allowedWarehouseIds).reduce((sum, row) => sum + (warehouseId == null || sameId(row.warehouse_id, warehouseId) ? quantity(row.qty) : 0), 0);
}

export const inventoryKey = item => [item.product_id, item.variant_id ?? "", item.warehouse_id ?? ""].join(":");

export function validateInventoryItems(items, products) {
  const totals = new Map();
  for (const item of items) {
    const product = products.find(p => sameId(p.id, item.product_id));
    if (!product) return "No se pudo consultar el inventario actual de un producto. Actualiza el catálogo.";
    if (hasProductVariants(product)) {
      if (!item.variant_id) return "Selecciona la variante del producto.";
      if (!product.variants?.some(v => sameId(v.id, item.variant_id) && activeVariant(v))) return "La variante seleccionada ya no está disponible.";
    } else if (item.variant_id != null) return "El producto ya no usa variantes. Vuelve a seleccionarlo.";
    if (usesWarehouses(product)) {
      if (!item.warehouse_id) return "Selecciona el almacén del producto.";
      const variant = product.variants?.find(v => sameId(v.id, item.variant_id));
      const rows = hasProductVariants(product) ? variant?.warehouse_stocks : product.warehouse_inventories;
      if (!rows?.some(row => sameId(row.warehouse_id, item.warehouse_id))) return "El almacén seleccionado no está disponible para este producto y usuario.";
    } else if (item.warehouse_id != null) return "El producto ya no usa almacenes. Vuelve a seleccionarlo.";
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return "La cantidad debe ser mayor que cero.";
    const key = inventoryKey(item);
    const total = (totals.get(key) || 0) + qty;
    totals.set(key, total);
    const available = productStock(product, { variantId: item.variant_id, warehouseId: item.warehouse_id, activeOnly: true });
    if (available === null) return "No se pudo consultar el detalle de existencias. Actualiza el catálogo.";
    if (total > available + 0.0000001) return `Stock insuficiente para ${product.name || "el producto"} en la variante y almacén seleccionados. Disponible: ${available}.`;
  }
  return null;
}
