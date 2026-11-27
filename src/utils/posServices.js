export const posServicesEnabled = typeof __MTELMX_POS_SERVICES__ !== "undefined" && __MTELMX_POS_SERVICES__ === true;
export const posControlledEnabled = typeof __MTELMX_POS_CONTROLLED__ !== "undefined" && __MTELMX_POS_CONTROLLED__ === true;

export function isOperationalPOSModule(row) {
  return row?.key === "service_sales" && row.operational_enabled === true &&
    row.available === true && row.enabled === true && row.visible === true;
}
