export function customerPhone(customer) {
  let phone = String(customer?.telefono ?? "").replace(/\D/g, "");
  if (phone.length === 13 && phone.startsWith("521")) phone = phone.slice(3);
  else if (phone.length === 12 && phone.startsWith("52")) phone = phone.slice(2);
  return /^\d{10}$/.test(phone) ? phone : "";
}
