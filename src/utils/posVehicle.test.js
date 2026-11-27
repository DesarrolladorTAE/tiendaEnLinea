import { confirmedWarehouses, findPOSVehicleProduct, resolveSaleLink, vehicleSearchParams } from "./posVehicle";

const scope = { store: 3, branch: 12, terminal: 6, order: 77, sale: 901 };
const order = { id: 77, branch_id: 12, store_id: 3, sale_id: null };
const pending = { data: { data: order } };
const signal = new AbortController().signal;
const path = "/branches/12/service-orders/77";

test("orden y expediente excluyen filtros manuales y preservan SKU textual y paginación", () => {
  const filters = { brand_id: "4", model_id: "18", year: "2020", sku: "000123", barcode: "075001", classification: "universal" };
  expect(vehicleSearchParams(filters, { service_order_id: 77 }, 2)).toEqual({
    service_order_id: 77, sku: "000123", barcode: "075001", include_compatible: 0, include_universal: 1, include_unknown: 0, page: 2, per_page: 20,
  });
  expect(vehicleSearchParams(filters, { vehicle_id: "82" }, 1)).not.toHaveProperty("year");
  expect(vehicleSearchParams(filters, {}, 1)).toMatchObject({ brand_id: "4", model_id: "18", year: "2020" });
});

test("usa la intersección de almacenes confirmados, sin ampliar por ausencias", () => {
  const me = { warehouse_ids: [4, 5] };
  const payload = { pos: { allowed_warehouses: [{ id: 4 }, { id: 6 }] } };
  expect(confirmedWarehouses(me, payload, { pos_inventory: { allowed_warehouse_ids: [4, 7] } })).toEqual(["4"]);
  expect(confirmedWarehouses({}, {}, {})).toEqual([]);
  expect(confirmedWarehouses(me, payload, { pos_inventory: { allowed_warehouse_ids: [] } })).toEqual([]);
});


const terminal = { id: 6, branch_id: 12, store_id: 3 };
const product = { id: "123", sku: "000123", use_warehouse_inventory: true, stock: 0,
  warehouse_inventories: [{ warehouse_id: 4, qty: 2, price: 150 }, { warehouse_id: 5, qty: 90, price: 90 }],
  pos_inventory: { allowed_warehouse_ids: [4] } };
const detail = { ok: true, branch_id: 12, store_id: 3, pos: { id: 6 }, product };

test("consulta el producto una sola vez, sin query y con almacén autorizado", async () => {
  const client = { get: jest.fn().mockResolvedValue({ data: detail }) };
  const result = await findPOSVehicleProduct(client, terminal, 123, "4", signal);
  expect(result.warehouse_inventories).toEqual([{ warehouse_id: 4, qty: 2, price: 150 }]);
  expect(result.sku).toBe("000123");
  expect(client.get.mock.calls).toEqual([["/pos/products/123", { signal }]]);
});

test("interseca alcance de almacén y conserva variantes y sus precios", async () => {
  const variants = [{ id: 9, price: 160, warehouse_stocks: [
    { warehouse_id: 4, stock: 2, price: 155 }, { warehouse_id: 5, stock: 7, price: 160 },
  ] }];
  const client = { get: jest.fn().mockResolvedValue({ data: { ...detail,
    product: { ...product, variants, has_variants: true, pos_inventory: { allowed_warehouse_ids: [4, 5] } },
  } }) };
  const filtered = await findPOSVehicleProduct(client, { ...terminal, warehouse_ids: [4] }, 123, null, signal);
  expect(filtered.variants).toEqual([{ ...variants[0], warehouse_stocks: [variants[0].warehouse_stocks[0]] }]);
  await expect(findPOSVehicleProduct(client, { ...terminal, warehouse_ids: [4] }, 123, "5", signal)).resolves.toBeNull();
});

test("la falta de almacenes confirmados oculta el producto inventariado", async () => {
  const client = { get: jest.fn().mockResolvedValue({ data: { ...detail, product: { ...product, pos_inventory: {} } } }) };
  await expect(findPOSVehicleProduct(client, { ...terminal, warehouse_ids: [4] }, 123, null, signal)).resolves.toBeNull();
});

test.each([{ pos: { id: 9 } }, { branch_id: 99 }, { store_id: 17 }, { product: { ...product, id: 98 } }])
  ("rechaza payload de otro contexto (%j)", async (override) => {
    const client = { get: jest.fn().mockResolvedValue({ data: { ...detail, ...override } }) };
    await expect(findPOSVehicleProduct(client, terminal, 123, null, signal)).rejects.toThrow("terminal");
    expect(client.get).toHaveBeenCalledTimes(1);
  });

test.each([401, 403, 404])("preserva HTTP %s y no consulta el catálogo paginado", async (status) => {
  const error = { response: { status } };
  const client = { get: jest.fn().mockRejectedValue(error) };
  await expect(findPOSVehicleProduct(client, terminal, 123, null, signal)).rejects.toBe(error);
  expect(client.get.mock.calls).toEqual([["/pos/products/123", { signal }]]);
});

test("descarta la respuesta si el contexto se canceló", async () => {
  const controller = new AbortController();
  const client = { get: jest.fn().mockImplementation(async () => { controller.abort(); return { data: detail }; }) };
  await expect(findPOSVehicleProduct(client, terminal, 123, null, controller.signal)).resolves.toBeNull();
  await expect(findPOSVehicleProduct(client, terminal, 123, null, controller.signal)).resolves.toBeNull();
  expect(client.get).toHaveBeenCalledTimes(1);
});

test("el reintento recupera la orden y solo llama al endpoint de vínculo", async () => {
  const client = { get: jest.fn().mockResolvedValue(pending), post: jest.fn()
    .mockRejectedValueOnce(new Error("Sin respuesta"))
    .mockResolvedValueOnce({ data: { data: { ...order, sale_id: 901 } } }) };
  await expect(resolveSaleLink(client, scope, signal)).rejects.toThrow("Sin respuesta");
  await expect(resolveSaleLink(client, scope, signal)).resolves.toBe("linked");
  expect(client.post.mock.calls).toEqual([[path + "/sale", { sale_id: 901 }, { signal }], [path + "/sale", { sale_id: 901 }, { signal }]]);
});

test.each([[901, "linked"], [902, "conflict"]])("una orden con venta %s responde %s sin hacer POST", async (sale_id, state) => {
  const client = { get: jest.fn().mockResolvedValue({ data: { data: { ...order, sale_id } } }), post: jest.fn() };
  await expect(resolveSaleLink(client, scope, signal)).resolves.toBe(state);
  expect(client.post).not.toHaveBeenCalled();
});

test("orden ajena o rechazo 422 impide sustituir vínculos", async () => {
  const client = { get: jest.fn().mockResolvedValueOnce({ data: { data: { ...order, branch_id: 99 } } }).mockResolvedValue(pending),
    post: jest.fn().mockRejectedValue({ response: { status: 422 } }) };
  await expect(resolveSaleLink(client, scope, signal)).rejects.toThrow("contexto");
  expect(client.post).not.toHaveBeenCalled();
  await expect(resolveSaleLink(client, scope, signal)).resolves.toBe("conflict");
});

