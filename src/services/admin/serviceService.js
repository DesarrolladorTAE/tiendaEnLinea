import axiosClient from "../../config/axiosClient";

const basePath = (branchId) => `/branches/${branchId}/services`;

const appendValue = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
};

export const buildServiceFormData = (values) => {
  const formData = new FormData();
  const { images = [], delete_image_ids = [], ...fields } = values;

  if (!fields.requires_deposit) {
    delete fields.deposit_type;
    delete fields.deposit_value;
  }

  Object.entries(fields).forEach(([key, value]) => appendValue(formData, key, value));
  images.forEach((file) => formData.append("images[]", file));
  delete_image_ids.forEach((id) => formData.append("delete_image_ids[]", id));
  return formData;
};

export const serviceService = {
  list(branchId, params = {}) {
    return axiosClient.get(basePath(branchId), { params });
  },
  get(branchId, serviceId) {
    return axiosClient.get(`${basePath(branchId)}/${serviceId}`);
  },
  create(branchId, values) {
    return axiosClient.post(basePath(branchId), buildServiceFormData(values));
  },
  update(branchId, serviceId, values) {
    const data = buildServiceFormData({ ...values, _method: "PUT" });
    return axiosClient.post(`${basePath(branchId)}/${serviceId}`, data);
  },
  remove(branchId, serviceId) {
    return axiosClient.delete(`${basePath(branchId)}/${serviceId}`);
  },
};
