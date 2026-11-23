import client from "../../config/axiosClient";

export const getShippingConfig = (signal) => client.get("/shipping/config", { signal });
export const saveShippingSettings = (payload) => client.put("/shipping/settings", payload);
export async function getShippingBranches(storeId, signal) {
  const rows = [];
  let page = 1;
  let last = 1;
  do {
    const response = await client.get("/branches", { params: { store_id: storeId, page, per_page: 100 }, signal });
    const payload = response.data;
    const collection = Array.isArray(payload?.data) ? payload : payload?.data || payload;
    rows.push(...(Array.isArray(collection) ? collection : Array.isArray(collection?.data) ? collection.data : []));
    last = Number(collection?.last_page || payload?.meta?.last_page || 1);
    page += 1;
  } while (page <= last);
  return rows;
}
export const saveShippingResource = (resource, id, payload) => id
  ? client.put(`/shipping/${resource}/${id}`, payload)
  : client.post(`/shipping/${resource}`, payload);
export const uploadShippingLogo = (id, file) => {
  const body = new FormData();
  body.append("logo", file);
  return client.post(`/shipping/channels/${id}/logo`, body);
};
