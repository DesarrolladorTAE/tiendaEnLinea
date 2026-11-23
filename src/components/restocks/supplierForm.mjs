export const EMPTY_SUPPLIER = {
  name: "", alias: "", rfc: "", curp: "", phone: "", celular: "", email: "",
  contact_name: "", address: "", numero_exterior: "", numero_interior: "",
  colonia: "", codigo_postal: "", localidad: "", municipio: "", estado: "", pais: "",
  notes: "", limite_credito: "0", dias_credito: "0", is_active: true, origen_sicar: false,
};

const booleanValue = (value) => value === true || value === 1 || value === "1";

export function supplierToForm(supplier = {}) {
  const form = Object.fromEntries(Object.entries(EMPTY_SUPPLIER).map(([key, fallback]) => [key, supplier[key] ?? fallback]));
  form.is_active = booleanValue(form.is_active);
  form.origen_sicar = booleanValue(form.origen_sicar);
  return form;
}

export function validateSupplier(form) {
  const errors = {};
  if (!String(form.name).trim()) errors.name = "El nombre es obligatorio.";
  if (form.codigo_postal && !/^\d{5}$/.test(form.codigo_postal)) errors.codigo_postal = "Ingresa 5 dígitos.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Revisa el correo electrónico.";
  if (!/^\d+(?:\.\d{1,6})?$/.test(String(form.limite_credito))) errors.limite_credito = "Ingresa un importe positivo o cero, con hasta 6 decimales.";
  if (!/^\d+$/.test(String(form.dias_credito)) || !Number.isSafeInteger(Number(form.dias_credito))) errors.dias_credito = "Ingresa un número entero positivo o cero.";
  return errors;
}

export function supplierPayload(form, branchId) {
  const payload = supplierToForm(form);
  for (const key of Object.keys(payload)) {
    if (typeof payload[key] === "string") payload[key] = payload[key].trim();
  }
  payload.rfc = payload.rfc.toUpperCase();
  payload.curp = payload.curp.toUpperCase();
  // Keep credit amounts as strings to preserve the backend's six decimal places.
  payload.limite_credito = String(payload.limite_credito);
  payload.dias_credito = Number(payload.dias_credito);
  payload.branch_id = branchId;
  return payload;
}
