import axiosClient from "../../config/axiosClient";

const basePath = (branchId) => `/branches/${branchId}/resources`;

export const resourceService = {
  list(branchId, params = {}, signal) {
    return axiosClient.get(basePath(branchId), { params, signal });
  },
  get(branchId, resourceId) {
    return axiosClient.get(`${basePath(branchId)}/${resourceId}`);
  },
  create(branchId, values) {
    return axiosClient.post(basePath(branchId), values);
  },
  update(branchId, resourceId, values) {
    return axiosClient.put(`${basePath(branchId)}/${resourceId}`, values);
  },
  remove(branchId, resourceId) {
    return axiosClient.delete(`${basePath(branchId)}/${resourceId}`);
  },
  getSchedule(branchId, resourceId, signal) {
    return axiosClient.get(`${basePath(branchId)}/${resourceId}/schedule`, { signal });
  },
  saveSchedule(branchId, resourceId, weekly_schedules) {
    return axiosClient.put(`${basePath(branchId)}/${resourceId}/schedule`, { weekly_schedules });
  },
};
