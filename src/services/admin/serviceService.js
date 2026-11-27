import adminClient from "../../config/axiosClient";

const basePath = (branchId) => `/branches/${branchId}/services`;
const servicePath = (branchId, serviceId) => `${basePath(branchId)}/${serviceId}`;

const editableFields = [
  "name", "code", "short_description", "description", "service_type", "vehicle_requirement",
  "base_price", "duration_minutes", "requires_booking", "requires_resource", "requires_address",
  "is_home_service", "requires_confirmation", "requires_deposit", "deposit_type", "deposit_value",
  "billing_mode", "default_capacity", "sat_product_code", "sat_unit_code", "tax_object",
  "iva_percentage", "price_override", "capacity_override",
];

const appendValue = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
};

export const buildServiceFormData = (values, updating = false) => {
  const formData = new FormData();
  const { images = [], delete_image_ids = [], ...fields } = values;

  if (!fields.requires_deposit) {
    delete fields.deposit_type;
    delete fields.deposit_value;
  }

  editableFields.forEach((key) => appendValue(formData, key, fields[key]));
  images.forEach((file) => formData.append("images[]", file));
  if (updating) {
    formData.append("_method", "PUT");
    appendValue(formData, "is_active", fields.is_active);
    appendValue(formData, "primary_image_id", fields.primary_image_id);
    delete_image_ids.forEach((id) => formData.append("delete_image_ids[]", id));
  } else {
    appendValue(formData, "primary_image_index", fields.primary_image_index);
  }
  return formData;
};

export const createServiceService = (axiosClient) => ({
  list(branchId, params = {}, signal) {
    return axiosClient.get(basePath(branchId), { params, signal });
  },
  get(branchId, serviceId, signal) {
    return axiosClient.get(servicePath(branchId, serviceId), { signal });
  },
  create(branchId, values) {
    return axiosClient.post(basePath(branchId), buildServiceFormData(values));
  },
  update(branchId, serviceId, values) {
    const data = buildServiceFormData(values, true);
    return axiosClient.post(`${basePath(branchId)}/${serviceId}`, data);
  },
  remove(branchId, serviceId) {
    return axiosClient.delete(`${basePath(branchId)}/${serviceId}`);
  },
  getBookingConfig(branchId, serviceId, signal) {
    return axiosClient.get(`${servicePath(branchId, serviceId)}/booking-config`, { signal });
  },
  saveBookingConfig(branchId, serviceId, values) {
    return axiosClient.put(`${servicePath(branchId, serviceId)}/booking-config`, values);
  },
  availability(branchId, serviceId, params, signal) {
    return axiosClient.get(`${servicePath(branchId, serviceId)}/availability`, { params, signal });
  },
  getResources(branchId, serviceId, signal) {
    return axiosClient.get(`${servicePath(branchId, serviceId)}/resources`, { signal });
  },
  associateResource(branchId, serviceId, resource) {
    return axiosClient.post(`${servicePath(branchId, serviceId)}/resources`, { resources: [resource] });
  },
  updateResource(branchId, serviceId, resourceId, values) {
    return axiosClient.put(`${servicePath(branchId, serviceId)}/resources/${resourceId}`, values);
  },
  removeResource(branchId, serviceId, resourceId) {
    return axiosClient.delete(`${servicePath(branchId, serviceId)}/resources/${resourceId}`);
  },
  getForms(branchId, serviceId, signal) {
    return axiosClient.get(`${servicePath(branchId, serviceId)}/forms`, { signal });
  },
  saveForms(branchId, serviceId, forms) {
    return axiosClient.put(`${servicePath(branchId, serviceId)}/forms`, { forms });
  },
  listFormTemplates(params, signal) {
    return axiosClient.get("/service-form-templates", { params, signal });
  },
});

export const serviceService = createServiceService(adminClient);
