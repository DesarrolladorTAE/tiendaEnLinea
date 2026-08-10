import axiosSuperadmin from "../../config/axiosSuperadmin";

const BASE_URL =
  "/admin/complementos";

export const complementoService = {
  getAll: (params = {}) =>
    axiosSuperadmin.get(BASE_URL, {
      params,
    }),

  getById: (id) =>
    axiosSuperadmin.get(
      `${BASE_URL}/${id}`
    ),

  create: (data) =>
    axiosSuperadmin.post(
      BASE_URL,
      data
    ),

  update: (id, data) =>
    axiosSuperadmin.put(
      `${BASE_URL}/${id}`,
      data
    ),

  delete: (id) =>
    axiosSuperadmin.delete(
      `${BASE_URL}/${id}`
    ),

  toggleStatus: (id) =>
    axiosSuperadmin.patch(
      `${BASE_URL}/${id}/toggle-status`
    ),

  toggleLanding: (id) =>
    axiosSuperadmin.patch(
      `${BASE_URL}/${id}/toggle-landing`
    ),

  reorder: (items) =>
    axiosSuperadmin.patch(
      `${BASE_URL}/reorder`,
      {
        items,
      }
    ),
};