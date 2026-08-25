import axiosClient from "../../config/axiosClient";

const branchSitePath = (storeId, branchId) =>
  `/stores/${storeId}/branches/${branchId}/site`;

export const getStoreSites = (storeId) =>
  axiosClient.get(`/stores/${storeId}/sites`);
export const getBranchSite = (storeId, branchId) =>
  axiosClient.get(branchSitePath(storeId, branchId));
export const createBranchSite = (storeId, branchId, payload) =>
  axiosClient.post(branchSitePath(storeId, branchId), payload);
export const updateBranchSite = (storeId, branchId, payload) =>
  axiosClient.patch(branchSitePath(storeId, branchId), payload);
export const upsertBranchSite = (storeId, branchId, payload) =>
  axiosClient.post(`${branchSitePath(storeId, branchId)}/upsert`, payload);
export const deleteBranchSite = (storeId, branchId) =>
  axiosClient.delete(branchSitePath(storeId, branchId));
export const cloneBranchSite = (storeId, branchId, sourceBranchId) =>
  axiosClient.post(`${branchSitePath(storeId, branchId)}/clone`, {
    source_branch_id: sourceBranchId,
  });
export const getMyStore = () => axiosClient.get("/perfil/mi-tienda");
