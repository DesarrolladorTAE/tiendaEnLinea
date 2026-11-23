export function vehicleRowsForPayload(rows) {
  if (!Array.isArray(rows) || rows.length > 100) throw new Error("Se permiten hasta 100 compatibilidades.");
  return rows.map((row, index) => {
    const vehicle_brand = String(row.vehicle_brand || "").trim();
    const vehicle_model = String(row.vehicle_model || "").trim();
    if (!vehicle_brand || !vehicle_model || vehicle_brand.length > 120 || vehicle_model.length > 120) throw new Error(`Vehículo ${index + 1}: marca y modelo son obligatorios, de máximo 120 caracteres.`);
    const year = value => {
      if (value === "" || value == null) return null;
      const number = Number(value);
      if (!Number.isInteger(number) || number < 1886 || number > 2200) throw new Error(`Vehículo ${index + 1}: usa años enteros entre 1886 y 2200.`);
      return number;
    };
    const year_from = year(row.year_from), year_to = year(row.year_to);
    if (year_from !== null && year_to !== null && year_from > year_to) throw new Error(`Vehículo ${index + 1}: el año final debe ser mayor o igual al inicial.`);
    return { vehicle_brand, vehicle_model, year_from, year_to };
  });
}
export function vehicleRange(row) {
  if (row.year_from == null && row.year_to == null) return "Sin límite de años";
  if (row.year_from == null) return `Hasta ${row.year_to}`;
  if (row.year_to == null) return `Desde ${row.year_from}`;
  return row.year_from === row.year_to ? String(row.year_from) : `${row.year_from} – ${row.year_to}`;
}
