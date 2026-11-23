import { calculateProfitPrice, hasConfiguredProfitFactor, hasProfitFactor, saveProductProfitFactor, validPurchaseCost } from "./productProfitFactor";

test("default zero is not counted as configured, while zero percent remains a valid factor", () => {
  expect(hasConfiguredProfitFactor({ profit_factor: "0.0000" })).toBe(false);
  expect(hasProfitFactor({ profit_factor: "0.0000" })).toBe(true);
  expect(hasConfiguredProfitFactor({ profit_factor: "45.0000" })).toBe(true);
  expect(hasConfiguredProfitFactor({ profit_factor: null })).toBe(false);
  expect(calculateProfitPrice(100, "0.0000", 0).price).toBe(100);
});

test("factor is an increase on cost and the resulting price already includes IVA", () => {
  expect(calculateProfitPrice("100", "45", "0.16")).toEqual({ profit_factor: 45, price: 145, base_price: 125 });
  expect(calculateProfitPrice(100, 0, null)).toEqual({ profit_factor: 0, price: 100, base_price: 100 });
  expect(calculateProfitPrice(0, "999999.9999", "null").price).toBe(0);
  expect(calculateProfitPrice(1.005, 0, 0).price).toBe(1.01);
});

test.each([null, undefined, "", " ", -1, "abc"])("missing or invalid cost %s keeps factor unavailable", cost => {
  expect(validPurchaseCost(cost)).toBe(false);
  expect(() => calculateProfitPrice(cost, 45, 0.16)).toThrow();
});

test.each(["", -1, "0.12345", 1000000, "abc"])("rejects invalid factor %s", factor => {
  expect(() => calculateProfitPrice(100, factor, 0.16)).toThrow();
});

test("rejects invalid IVA and overflow before saving", () => {
  expect(() => calculateProfitPrice(100, 45, -0.1)).toThrow();
  expect(() => calculateProfitPrice(100, 45, 1.1)).toThrow();
  expect(() => calculateProfitPrice(100, 45, "")).toThrow();
  expect(() => calculateProfitPrice(99999999.99, 1, 0)).toThrow();
});

test("PATCH sends only the factor and returns the authoritative server values", async () => {
  const product = { id: 7, price: "145.02", base_price: "125.017241", profit_factor: "45.0000", purchase_cost: "100" };
  const client = { patch: jest.fn().mockResolvedValue({ data: { data: product } }) };
  expect(await saveProductProfitFactor(client, 7, "45")).toBe(product);
  expect(client.patch).toHaveBeenCalledWith("/admin/products/7/profit-factor", { profit_factor: 45 });
});
