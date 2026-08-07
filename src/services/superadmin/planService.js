import axiosSuperadmin from "../../config/axiosSuperadmin";

const BASE_URL = "/admin/plans";

export const planService = {
  getAll: (params = {}) =>
    axiosSuperadmin.get(BASE_URL, {
      params,
    }),

  getById: (id) =>
    axiosSuperadmin.get(`${BASE_URL}/${id}`),

  create: (data) =>
    axiosSuperadmin.post(BASE_URL, data),

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

  toggleFeatured: (id) =>
    axiosSuperadmin.patch(
      `${BASE_URL}/${id}/toggle-featured`
    ),

  getFeatureMatrix: (id) =>
    axiosSuperadmin.get(
      `${BASE_URL}/${id}/feature-matrix`
    ),

  updateFeatureMatrix: (
    id,
    features
  ) =>
    axiosSuperadmin.put(
      `${BASE_URL}/${id}/feature-matrix`,
      {
        features,
      }
    ),

  getAddons: (id) =>
    axiosSuperadmin.get(
      `${BASE_URL}/${id}/addons`
    ),

  updateAddons: (
    id,
    addons
  ) =>
    axiosSuperadmin.put(
      `${BASE_URL}/${id}/addons`,
      {
        addons,
      }
    ),

  updatePrices: (
    id,
    prices
  ) =>
    axiosSuperadmin.put(
      `${BASE_URL}/${id}/prices`,
      {
        prices,
      }
    ),
};