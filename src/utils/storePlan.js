export const storePlanId = store => Number(store?.plan_id || store?.subscription?.plan_id || store?.store_plan?.plan_id || 0);

export const canAccessWorkers = planId => [1, 3, 4].includes(planId);
