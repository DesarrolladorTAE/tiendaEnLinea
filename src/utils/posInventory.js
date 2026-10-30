import { scopePOSProduct } from "./productInventory";

// my-products-by-pos1 is authenticated and scopes products to this POS.
// When the backend also supplies warehouse_ids, intersect both sources explicitly.
export async function fetchPOSScope(client) {
  const { data } = await client.post("/pos/me");
  return Array.isArray(data?.warehouse_ids) ? data.warehouse_ids : null;
}

export async function fetchPOSProductPage(client, posLocationId, params = {}, allowedIds = null) {
  const { data } = await client.get("my-products-by-pos1", {
    params: { pos_location_id: Number(posLocationId), ...params },
  });
  const ids = Array.isArray(data?.warehouse_ids) ? data.warehouse_ids.filter(id => allowedIds == null || allowedIds.some(allowed => String(allowed) === String(id))) : allowedIds;
  return { products: (Array.isArray(data?.products) ? data.products : []).map(product => scopePOSProduct(product, ids)), meta: data?.meta };
}

export async function loadCartInventory(client, posLocationId, items) {
  if (!posLocationId) throw new Error("Selecciona un punto de venta.");
  const allowedIds = await fetchPOSScope(client);
  const wanted = new Set(items.map(item => String(item.product_id)));
  const found = [];
  // Use the existing paginated endpoint, including items no longer on the current page.
  for (let page = 1; wanted.size; page++) {
    const result = await fetchPOSProductPage(client, posLocationId, { page, per_page: 100, q: "" }, allowedIds);
    result.products.forEach(product => {
      if (wanted.delete(String(product.id))) found.push(product);
    });
    const lastPage = Number(result.meta?.last_page);
    if (!result.products.length || (lastPage > 0 ? page >= lastPage : result.products.length < 100)) break;
  }
  return found;
}
