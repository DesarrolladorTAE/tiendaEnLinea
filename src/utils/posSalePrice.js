export function resolveSalePrice(product, variantId, warehouseId) {
  const variant = variantId == null ? null : (product?.variants || []).find(row => String(row.id) === String(variantId));
  const rows = variant ? variant.warehouse_stocks : product?.warehouse_inventories;
  const warehouse = warehouseId == null ? null : (rows || []).find(row => String(row.warehouse_id) === String(warehouseId));
  const value = warehouse?.price ?? variant?.price ?? product?.price;
  return value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}
export function salePriceAfterDiscount(price, discount) {
  return Number((price * (1 - (Number(discount) || 0) / 100)).toFixed(2));
}
