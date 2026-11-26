export function hasBranchAction(settings, key, action) {
  const capabilities = settings?.capabilities;
  const capability = capabilities?.[key];
  return capabilities?.scope?.actor === "store" &&
    capability?.available === true && capability.enabled === true &&
    capability.visible === true && capability.authorization?.[action] === true;
}

export function vehicleCatalogAccess(settings, storeId) {
  if (settings && !Object.hasOwn(settings, "capabilities")) {
    // Compatibility with the old response until the rollout is verified.
    const read = Number(storeId) === 566 && settings.vehicle_feature_available === true;
    return { read, write: read && settings.vehicle_compatibilities_enabled === true };
  }
  return {
    read: hasBranchAction(settings, "vehicle_catalog", "read"),
    write: hasBranchAction(settings, "vehicle_catalog", "write"),
  };
}
