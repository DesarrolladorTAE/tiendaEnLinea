export const formatoFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

export const puedeFacturar = (fechaStr) => {
  const fecha = new Date(fechaStr);
  const ahora = new Date();

  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 0); // último día a las 11pm

  return ahora <= finMes;
};
