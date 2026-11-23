import { fetchPOSScope, fetchPOSProductPage, loadCartInventory } from "./posInventory";

test("intersects the user's warehouses with the authenticated POS response", async () => {
  const client = { post: jest.fn().mockResolvedValue({ data: { warehouse_ids: [2] } }), get: jest.fn().mockResolvedValue({ data: {
    warehouse_ids: [2, 3], products: [{ id: 1, stock: 0, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2, qty: 4 }, { warehouse_id: 3, qty: 20 }] }],
  } }) };
  const scope = await fetchPOSScope(client);
  const page = await fetchPOSProductPage(client, 10, { page: 1 }, scope);
  expect(page.products[0].warehouse_inventories).toEqual([{ warehouse_id: 2, qty: 4 }]);
  expect(client.get.mock.calls[0][1].params.pos_location_id).toBe(10);
});
test("checkout reloads cart products across backend pages and excludes unpermitted rows", async () => {
  const client = { post: jest.fn().mockResolvedValue({ data: { warehouse_ids: [2] } }), get: jest.fn()
    .mockResolvedValueOnce({ data: { products: [{ id: 1, stock: 2 }], meta: { last_page: 2 } } })
    .mockResolvedValueOnce({ data: { products: [{ id: 7, stock: 0, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 3, qty: 90 }] }], meta: { last_page: 2 } } }) };
  const products = await loadCartInventory(client, 10, [{ product_id: 1 }, { product_id: 7 }]);
  expect(products.map(p => p.id)).toEqual([1, 7]);
  expect(products[1].warehouse_inventories).toEqual([]);
  expect(client.get).toHaveBeenCalledTimes(2);
});
