import { batchExpiryLabel, batchIdentity, decimalQuantity, requireSaleWithoutBatches } from "./batchInventory";

test("preserves decimal quantities and enforces the inventory precision", () => {
  expect(decimalQuantity("5.010")).toBe("5.010");
  expect(decimalQuantity("5.010", 2)).toBeNull();
  expect(decimalQuantity("0.001", 3, 0.01)).toBeNull();
  expect(decimalQuantity("1e2")).toBeNull();
});

test("stores month precision without showing the technical day as an exact expiry", () => {
  const month = batchIdentity({ batch_number: " LT-A ", expires_on: "2027-08", expiry_precision: "month" });
  expect(month).toEqual({
    batch_number: "LT-A", expires_on: "2027-08-01", expiry_precision: "month",
    manufactured_on: null, expiry_raw: "2027-08",
  });
  expect(batchExpiryLabel(month)).toBe("2027-08 (precisión mensual)");
  expect(batchIdentity({ batch_number: "LT-B", expiry_precision: "unknown" }).expires_on).toBeNull();
  expect(() => batchIdentity({ batch_number: "LT-B", expires_on: "2027-02-30" })).toThrow("caducidad válida");
});

test("requires a verified allocation response before allowing legacy sale mutations", async () => {
  const get = jest.fn()
    .mockResolvedValueOnce({ data: { sale_id: 900, items: [{ batches: [] }] } })
    .mockResolvedValueOnce({ data: { sale_id: 900, items: [{ batches: [{ batch_id: 501 }] }] } })
    .mockResolvedValueOnce({ data: { sale_id: 901, items: [] } });
  await expect(requireSaleWithoutBatches({ get }, 900)).resolves.toBeUndefined();
  await expect(requireSaleWithoutBatches({ get }, 900)).rejects.toThrow("ventas con lotes");
  await expect(requireSaleWithoutBatches({ get }, 900)).rejects.toThrow("verificar");
  expect(get).toHaveBeenCalledWith("/sales/900/batch-allocations", undefined);
});

test("allows an entry to omit the lot number while validating its exact expiry", () => {
  expect(batchIdentity({ expires_on: "2027-08-15" }, { optionalNumber: true })).toEqual({
    expiry_precision: "day", expires_on: "2027-08-15", manufactured_on: null, expiry_raw: null,
  });
  expect(() => batchIdentity({ expiry_precision: "day" }, { optionalNumber: true })).toThrow("Ingresa la caducidad");
  expect(() => batchIdentity({ expires_on: "2027-08-15" })).toThrow("número de lote");
});
