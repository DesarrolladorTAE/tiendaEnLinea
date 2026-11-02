import client from "../../config/axiosClient";

export const DOCUMENT_TYPES = [
  { value: "ticket", label: "Ticket", description: "Formato térmico de 58 u 80 mm." },
  { value: "nota_venta", label: "Nota de venta", description: "Productos, totales y espacio para firmas." },
  { value: "comprobante", label: "Comprobante", description: "Presentación comercial con cliente y pagos." },
];
export const DOCUMENT_CHANNELS = [
  { value: "pdf", label: "PDF y WhatsApp" },
  { value: "payload", label: "Impresión" },
];
const common = ["direccion", "mensaje_1", "mensaje_2", "mostrar_iva", "show_logo", "paper_size"];
const thermal = ["qr_factura", "qr_sitio", "qr_factura_size", "qr_sitio_size", "logo_max_width"];
const connection = ["chars_per_line", "printer_ip", "printer_port"];
const letter = ["title", "show_customer", "show_sku", "show_oe", "accent_color"];
const booleans = new Set(["mostrar_iva", "show_logo", "qr_factura", "qr_sitio", "show_customer", "show_sku", "show_oe"]);
const numbers = new Set(["chars_per_line", "qr_factura_size", "qr_sitio_size", "logo_max_width", "printer_port"]);
export const enabled = value => value === true || value === 1 || value === "1" || value === "true";
export const fieldsFor = (type, channel) => [...common, ...(type === "ticket" ? [...thermal, ...(channel === "payload" ? connection : [])] : letter)];
export const defaultConfig = type => ({
  direccion: "", mensaje_1: "", mensaje_2: "", mostrar_iva: true, show_logo: true,
  paper_size: type === "ticket" ? "80" : "letter",
  ...(type === "ticket" ? { qr_factura: false, qr_sitio: false, qr_factura_size: 7, qr_sitio_size: 7, logo_max_width: 384, chars_per_line: 48, printer_ip: "", printer_port: "" }
    : { title: type === "nota_venta" ? "NOTA DE VENTA" : "COMPROBANTE", show_customer: true, show_sku: true, show_oe: true, accent_color: "#333333" }),
});

export function readConfig(data, type) {
  const config = data?.config ?? data?.data?.config ?? data?.settings?.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("La respuesta no contiene la configuración del documento.");
  const result = { ...defaultConfig(type), ...config };
  booleans.forEach(key => { if (key in result) result[key] = enabled(result[key]); });
  result.paper_size = String(result.paper_size);
  return result;
}

export function configChanges(patch, type, channel) {
  return Object.fromEntries(fieldsFor(type, channel).filter(key => key in patch).map(key => {
    const value = patch[key];
    return [key, booleans.has(key) ? enabled(value) : numbers.has(key) ? (value === "" || value == null ? null : Number(value)) : key === "printer_ip" ? String(value ?? "").trim() : value];
  }));
}

export function validateConfig(form, type, channel) {
  const errors = {};
  for (const [key, max] of [["direccion", 300], ["mensaje_1", 125], ["mensaje_2", 125]]) {
    if (String(form[key] ?? "").length > max) errors[key] = `Máximo ${max} caracteres.`;
  }
  if (!(type === "ticket" ? ["58", "80"] : ["letter", "a4"]).includes(form.paper_size)) errors.paper_size = "Selecciona un tamaño válido.";
  if (type !== "ticket" && !/^#[\da-f]{6}$/i.test(form.accent_color)) errors.accent_color = "Usa un color como #333333.";
  const ranges = type === "ticket" ? [["qr_factura_size", 1, 16], ["qr_sitio_size", 1, 16], ["logo_max_width", 64, 1024], ...(channel === "payload" ? [["chars_per_line", 16, 64], ["printer_port", 1, 65535]] : [])] : [];
  ranges.forEach(([key, min, max]) => {
    if (key === "printer_port" && (form[key] === "" || form[key] == null)) return;
    const value = Number(form[key]);
    if (!Number.isInteger(value) || value < min || value > max) errors[key] = `Usa un entero entre ${min} y ${max}.`;
  });
  if (type === "ticket" && channel === "payload" && form.printer_ip && !/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(form.printer_ip.trim())) errors.printer_ip = "Ingresa una IP válida.";
  return errors;
}

const options = branchId => ({ params: branchId ? { branch_id: branchId } : {} });
const path = ({ type, channel }) => `/document-settings/${type}/${channel}`;
export const documentSettingsService = {
  get: selection => client.get(path(selection), options(selection.branchId)),
  save: (selection, config) => client.put(path(selection), { config: configChanges(config, selection.type, selection.channel) }, options(selection.branchId)),
  uploadLogo: (selection, file) => { const data = new FormData(); data.append("logo", file); return client.post(`${path(selection)}/logo`, data, options(selection.branchId)); },
  deleteLogo: selection => client.delete(`${path(selection)}/logo`, options(selection.branchId)),
};

export function logoUrl(config) {
  const value = config.logo_url || (config.logo ? `/storage/${String(config.logo).replace(/^\/?storage\//, "")}` : "");
  if (!value) return "";
  try {
    const url = new URL(value, client.defaults?.baseURL || "https://mitiendaenlineamx.com.mx/api/");
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export async function validateLogo(file) {
  if (!file || !["image/png", "image/jpeg"].includes(file.type) || !file.size || file.size > 2 * 1024 * 1024) throw new Error("Selecciona un logo PNG o JPG de máximo 2 MB.");
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => img.naturalWidth > 4096 || img.naturalHeight > 4096 ? reject(new Error("El logo no debe superar 4096 × 4096 píxeles.")) : resolve();
      img.onerror = () => reject(new Error("No se pudo leer la imagen. Selecciona otro PNG o JPG."));
      img.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}
