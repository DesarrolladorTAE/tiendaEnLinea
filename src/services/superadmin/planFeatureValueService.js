import axiosSuperadmin from "../../config/axiosSuperadmin";

const BASE_URL =
  "/admin/plan-feature-values";

export const planFeatureValueService = {
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

  getMatrix: (planId) =>
    axiosSuperadmin.get(
      `/admin/plans/${planId}/feature-matrix`
    ),

  syncPlanFeatures: (
    planId,
    features
  ) =>
    axiosSuperadmin.put(
      `/admin/plans/${planId}/feature-matrix`,
      {
        features,
      }
    ),
};