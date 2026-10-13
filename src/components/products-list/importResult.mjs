export const SUMMARY_LABELS = {
  total: "Total", creados: "Creados", actualizados: "Actualizados",
  sin_cambios: "Sin cambios", errores: "Con errores",
};

export function normalizeImportResult(data = {}, failed = false) {
  const errors = (Array.isArray(data.errores_validacion) ? data.errores_validacion : []).map((item) => ({
    fila: item?.fila ?? "—", sku: item?.sku ?? "—",
    motivo: typeof item === "string" ? item : String(item?.motivo || "Error de validación"),
  }));
  if (data.errors && typeof data.errors === "object") {
    Object.entries(data.errors).forEach(([field, messages]) => {
      (Array.isArray(messages) ? messages : [messages]).forEach((message) => {
        if (typeof message === "string") errors.push({ fila: "—", sku: "—", motivo: `${field}: ${message}` });
      });
    });
  }
  const summary = {};
  Object.keys(SUMMARY_LABELS).forEach((key) => {
    const value = data.resumen?.[key];
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0) summary[key] = Number(value);
  });
  const hasErrors = failed || errors.length > 0 || summary.errores > 0;
  const allFailed = summary.total > 0 && summary.errores >= summary.total && !(summary.creados > 0 || summary.actualizados > 0 || summary.sin_cambios > 0);
  const severity = failed || allFailed ? "error" : hasErrors ? "warning" : "success";
  const title = allFailed ? "No se importaron productos" : failed ? "No se pudo completar la importación" : hasErrors ? "Importación finalizada con errores" : "Importación finalizada";
  const grouped = new Map();
  errors.forEach(({ motivo }) => grouped.set(motivo, (grouped.get(motivo) || 0) + 1));
  return {
    summary, errors, severity, title,
    message: typeof data.message === "string" ? data.message : "",
    reasons: Array.from(grouped, ([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
  };
}

export function createImportReport(result) {
  return [
    "REPORTE DE IMPORTACIÓN DE PRODUCTOS", result.title,
    `Fecha: ${result.date}`, `Origen: ${result.mode}`, `Archivo: ${result.filename}`,
    `Sucursal: ${result.branch}`, result.message, "", "RESUMEN",
    ...Object.entries(result.summary).map(([key, value]) => `${SUMMARY_LABELS[key]}: ${value}`),
    "", "MOTIVOS AGRUPADOS",
    ...result.reasons.map(({ reason, count }) => `${count} incidencia(s): ${reason}`),
    "", "DETALLE DE ERRORES",
    ...(result.errors.length ? result.errors.map(({ fila, sku, motivo }) => `Fila: ${fila} | SKU: ${sku} | Motivo: ${motivo}`) : ["El servidor no devolvió detalles de errores."]),
  ].join("\r\n");
}
