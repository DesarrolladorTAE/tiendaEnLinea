import { productStock, variantStock, scopePOSProduct, validateInventoryItems, hasProductVariants, usesWarehouses } from "./productInventory";

const variants = [{ id: 11, stock: 4 }, { id: 12, stock: 6 }];
const warehouseProduct = { id: 1, stock: 0, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2, qty: 3 }, { warehouse_id: 3, qty: 7 }] };
const combined = { id: 1, stock: 0, has_variants: true, use_warehouse_inventory: true, variants: [
  { id: 11, stock: 999, warehouse_stocks: [{ warehouse_id: 2, stock: 2 }, { warehouse_id: 3, stock: 8 }] },
  { id: 12, stock: 999, warehouse_stocks: [{ warehouse_id: 2, stock: 4 }] },
] };

test("simple products use their editable real stock", () => {
  expect(productStock({ stock: "4.5", has_variants: "0", use_warehouse_inventory: "0" })).toBe(4.5);
  expect(hasProductVariants({ variants })).toBe(true);
  expect(usesWarehouses({ use_warehouse_inventory: "0" })).toBe(false);
});
test("variant products sum all variants, ignoring the product zero", () => {
  expect(productStock({ stock: 0, variants })).toBe(10);
  expect(productStock({ stock: 0, variants }, { variantId: 12 })).toBe(6);
});
test("simple warehouse products use qty, never products.stock", () => {
  expect(productStock(warehouseProduct)).toBe(10);
  expect(productStock(warehouseProduct, { warehouseId: 2 })).toBe(3);
});
test("combined inventory sums the variant warehouse detail, never either parent stock", () => {
  expect(productStock(combined)).toBe(14);
  expect(productStock(combined, { variantId: 11, warehouseId: 2 })).toBe(2);
  expect(variantStock({ stock: 999, warehouse_stocks: [] }, true)).toBe(0);
});
test("POS totals and selector rows include only permitted warehouses", () => {
  const scoped = scopePOSProduct(combined, [2]);
  expect(productStock(scoped)).toBe(6);
  expect(scoped.variants[0].warehouse_stocks).toHaveLength(1);
  expect(productStock(scopePOSProduct(warehouseProduct, []))).toBe(0);
  expect(productStock(scopePOSProduct(warehouseProduct, [3]))).toBe(7);
  expect(combined.variants[0].warehouse_stocks).toHaveLength(2);
});
test("inactive variants do not count toward POS availability", () => {
  const product = { stock: 0, variants: [{ id: 11, stock: 3 }, { id: 12, stock: 99, is_active: "0" }] };
  expect(productStock(product, { activeOnly: true })).toBe(3);
  expect(productStock(product)).toBe(102);
});
test("missing detail is not reported as a confirmed zero", () => {
  expect(productStock({ stock: 0, has_variants: true })).toBeNull();
  expect(productStock({ stock: 0, use_warehouse_inventory: true })).toBeNull();
  expect(productStock(scopePOSProduct({ stock: 0, use_warehouse_inventory: true }, [2]))).toBeNull();
});
test("sales require the correct identifiers and selected warehouse availability", () => {
  expect(validateInventoryItems([{ product_id: 1, quantity: 1 }], [combined])).toMatch(/variante/);
  expect(validateInventoryItems([{ product_id: 1, variant_id: 11, quantity: 1 }], [combined])).toMatch(/almacén/);
  expect(validateInventoryItems([{ product_id: 1, variant_id: 11, warehouse_id: 2, quantity: 3 }], [combined])).toMatch(/insuficiente/);
  expect(validateInventoryItems([{ product_id: 1, variant_id: 11, warehouse_id: 2, quantity: 2 }], [combined])).toBeNull();
  expect(validateInventoryItems([{ product_id: 1, variant_id: 11, warehouse_id: 3, quantity: 1 }], [scopePOSProduct(combined, [2])])).toMatch(/usuario/);
});
test("duplicate lines share availability while different warehouses have separate quantities", () => {
  const line = { product_id: 1, variant_id: 11, warehouse_id: 2, quantity: 2 };
  expect(validateInventoryItems([line, { ...line, quantity: 1 }], [combined])).toMatch(/insuficiente/);
  expect(validateInventoryItems([line, { ...line, warehouse_id: 3, quantity: 8 }], [combined])).toBeNull();
});
test("invalid quantities and stale modalities fail validation", () => {
  expect(validateInventoryItems([{ product_id: 1, quantity: -1 }], [{ id: 1, stock: 10 }])).toMatch(/mayor/);
  expect(validateInventoryItems([{ product_id: 1, quantity: 1, warehouse_id: 3 }], [{ id: 1, stock: 10 }])).toMatch(/ya no usa almacenes/);
});
