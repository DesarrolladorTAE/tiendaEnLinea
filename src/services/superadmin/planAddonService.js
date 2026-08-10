import axiosSuperadmin from "../../config/axiosSuperadmin";

const BASE_URL = "/admin/plan-addons";

export const planAddonService = {
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
      `/admin/plans/${planId}/addons`
    ),

  syncPlanAddons: (
    planId,
    addons
  ) =>
    axiosSuperadmin.put(
      `/admin/plans/${planId}/addons`,
      {
        addons,
      }
    ),
};