import axiosSuperadmin from "../../config/axiosSuperadmin";

const BASE_URL = "/admin/app-versions";

export const appVersionService = {
  getCatalogs: () => axiosSuperadmin.get(`${BASE_URL}/catalogs`),

  getAll: (params = {}) =>
    axiosSuperadmin.get(BASE_URL, {
      params,
    }),

  getById: (id) => axiosSuperadmin.get(`${BASE_URL}/${id}`),

  create: (formData) =>
    axiosSuperadmin.post(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  update: (id, formData) =>
    axiosSuperadmin.post(`${BASE_URL}/${id}?_method=PUT`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  delete: (id) => axiosSuperadmin.delete(`${BASE_URL}/${id}`),
};