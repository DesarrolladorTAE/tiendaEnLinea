// src/utils/cfdiCatalogos.js

/** Catálogo de Regímenes (para selector) */
export const REGIMENES_FISCALES = [
  { codigo: "601", nombre: "601 - General de Ley Personas Morales" },
  { codigo: "603", nombre: "603 - Personas Morales con Fines no Lucrativos" },
  { codigo: "605", nombre: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { codigo: "606", nombre: "606 - Arrendamiento" },
  { codigo: "608", nombre: "608 - Demás ingresos" },
  { codigo: "610", nombre: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { codigo: "611", nombre: "611 - Ingresos por Dividendos (socios y accionistas)" },
  { codigo: "612", nombre: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { codigo: "614", nombre: "614 - Ingresos por intereses" },
  { codigo: "615", nombre: "615 - Régimen de los ingresos por obtención de premios" },
  { codigo: "616", nombre: "616 - Sin obligaciones fiscales" },
  { codigo: "620", nombre: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { codigo: "621", nombre: "621 - Incorporación Fiscal" },
  { codigo: "622", nombre: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { codigo: "623", nombre: "623 - Opcional para Grupos de Sociedades" },
  { codigo: "624", nombre: "624 - Coordinados" },
  { codigo: "625", nombre: "625 - Actividades Empresariales con ingresos en Plataformas Tecnológicas" },
  { codigo: "626", nombre: "626 - Régimen Simplificado de Confianza" },
];

/**
 * Catálogo de USOS de CFDI (c_UsoCFDI) + reglas básicas:
 * - aplicaFisica / aplicaMoral: compatibilidad por tipo de persona
 * - regimenes: (opcional) lista de regímenes receptores permitidos
 *
 * NOTA: Incluye S01, CP01 y CN01.
 *      Reglas mínimas para evitar los errores comunes:
 *      - D01–D10: solo Personas Físicas
 *      - CN01 (Nómina): restringido a régimen 605 (Sueldos y Salarios)
 */
export const USOS_CFDI = [
  // G: Gastos / compras (PF y PM)
  { codigo: "G01", nombre: "G01 - Adquisición de mercancías", aplicaFisica: true, aplicaMoral: true },
  { codigo: "G02", nombre: "G02 - Devoluciones, descuentos o bonificaciones", aplicaFisica: true, aplicaMoral: true },
  { codigo: "G03", nombre: "G03 - Gastos en general", aplicaFisica: true, aplicaMoral: true },

  // I: Inversiones (PF y PM)
  { codigo: "I01", nombre: "I01 - Construcciones", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I02", nombre: "I02 - Mobiliario y equipo de oficina por inversiones", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I03", nombre: "I03 - Equipo de transporte", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I04", nombre: "I04 - Equipo de cómputo y accesorios", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I05", nombre: "I05 - Dados, troqueles, moldes, matrices y herramental", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I06", nombre: "I06 - Comunicaciones telefónicas", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I07", nombre: "I07 - Comunicaciones satelitales", aplicaFisica: true, aplicaMoral: true },
  { codigo: "I08", nombre: "I08 - Otra maquinaria y equipo", aplicaFisica: true, aplicaMoral: true },

  // D: Deducciones personales (SOLO PF)
  { codigo: "D01", nombre: "D01 - Honorarios médicos, dentales y hospitalarios", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D02", nombre: "D02 - Gastos médicos por incapacidad o discapacidad", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D03", nombre: "D03 - Gastos funerales", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D04", nombre: "D04 - Donativos", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D05", nombre: "D05 - Intereses reales por créditos hipotecarios", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D06", nombre: "D06 - Aportaciones voluntarias al SAR", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D07", nombre: "D07 - Primas por seguros de gastos médicos", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D08", nombre: "D08 - Gastos de transportación escolar obligatoria", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D09", nombre: "D09 - Depósitos para el ahorro, primas, etc.", aplicaFisica: true, aplicaMoral: false },
  { codigo: "D10", nombre: "D10 - Pagos por servicios educativos (colegiaturas)", aplicaFisica: true, aplicaMoral: false },

  // NUEVOS / ESPECIALES
  { codigo: "S01", nombre: "S01 - Sin efectos fiscales.", aplicaFisica: true, aplicaMoral: true },
  { codigo: "CP01", nombre: "CP01 - Pagos", aplicaFisica: true, aplicaMoral: true },
  // Nómina: normalmente solo aplica con régimen 605
  { codigo: "CN01", nombre: "CN01 - Nómina", aplicaFisica: true, aplicaMoral: true, regimenes: ["605"] },

  // Por definir
  { codigo: "P01", nombre: "P01 - Por definir", aplicaFisica: true, aplicaMoral: true },
];

/** Set útil para saber si un régimen es de Persona Moral */
export const REGIMENES_PM = new Set(["601","603","620","622","623","624"]);

/** Determina si el receptor es PM o PF a partir del código de régimen */
export function esPersonaMoral(regimenCodigo) {
  const c = String(regimenCodigo || "").trim();
  return REGIMENES_PM.has(c);
}

/** Verifica si un uso es válido para el régimen del receptor (PF/PM + restricciones por régimen) */
export function esUsoValidoParaRegimen(usoCodigo, regimenCodigo) {
  const uso = USOS_CFDI.find(u => u.codigo === usoCodigo);
  if (!uso) return false;

  const pm = esPersonaMoral(regimenCodigo);
  if (pm && !uso.aplicaMoral) return false;
  if (!pm && !uso.aplicaFisica) return false;

  if (Array.isArray(uso.regimenes) && uso.regimenes.length) {
    return uso.regimenes.includes(String(regimenCodigo || "").trim());
  }
  return true;
}

/** Devuelve la lista de usos que aplican para el régimen dado */
export function filtrarUsosPorRegimen(regimenCodigo) {
  return USOS_CFDI.filter(u => esUsoValidoParaRegimen(u.codigo, regimenCodigo));
}
