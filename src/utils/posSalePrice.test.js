import { resolveSalePrice, salePriceAfterDiscount } from "./posSalePrice";
test("prefers warehouse price and preserves explicit zero, then falls back to variant and product", () => {
  const product = { price: 100, warehouse_inventories: [{ warehouse_id: 3, price: 0 }], variants: [{ id: 4, price: 120, warehouse_stocks: [{ warehouse_id: 3, price: 140 }, { warehouse_id: 5, price: null }] }] };
  expect(resolveSalePrice(product, null, 3)).toBe(0);
  expect(resolveSalePrice(product, 4, 3)).toBe(140);
  expect(resolveSalePrice(product, 4, 5)).toBe(120);
  expect(resolveSalePrice({ ...product, variants: [{ id: 4, price: null }] }, 4, null)).toBe(100);
  expect(salePriceAfterDiscount(140, 10)).toBe(126);
});
