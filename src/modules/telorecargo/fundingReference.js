// Only the external Telorecargo account ID is valid here.
export function fundingReference(telorecargoUserId) {
  const id = String(telorecargoUserId ?? "").trim();
  return /^[1-9]\d*$/.test(id) ? `TLR${id}` : null;
}
