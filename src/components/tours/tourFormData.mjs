// Route stops may be returned as TourStop models with a pivot, or as
// TourRouteStop models containing their stop. Never turn these into Service fields.
export function tourRouteId(departure) {
  return departure.tour_route_id ?? departure.tour_route?.id ?? departure.route?.id;
}

export function usedTourRoutes(departures, catalog) {
  const routes = new Map();
  departures.forEach((departure) => {
    const id = tourRouteId(departure);
    if (id == null || id === "") return;
    const key = String(id);
    if (!routes.has(key)) {
      routes.set(key, { id, ...(catalog.find((route) => String(route.id) === key) || {}),
        ...(departure.tour_route || departure.route || {}), departures: [] });
    }
    routes.get(key).departures.push(departure);
  });
  return [...routes.values()];
}

export function tourStopRows(rows) {
  return rows.map((row, index) => {
    const stop = row.stop || row.tour_stop || row;
    const relation = row.pivot || row;
    return {
      id: row.tour_stop_id ?? stop.id ?? null,
      name: stop.name || "Parada sin nombre",
      time: relation.default_departure_time ?? null,
      reference: stop.reference ?? null,
      order: relation.stop_order ?? null,
      boardingMinutes: relation.boarding_minutes ?? null,
      priceAdjustment: relation.price_adjustment ?? null,
      index,
      stop,
    };
  }).sort((a, b) => {
    if (a.order == null || b.order == null) return a.index - b.index;
    return Number(a.order) - Number(b.order) || a.index - b.index;
  });
}

export function tourEntityRecord(data, entity, expectedId) {
  const record = data?.[entity] ?? data?.data ?? data;
  const id = Number(record?.id);
  if (!Number.isSafeInteger(id) || id <= 0 || (expectedId != null && String(record.id) !== String(expectedId))) {
    throw new Error("El servidor no devolvió el registro con un ID válido. Actualiza el catálogo antes de volver a crear registros.");
  }
  return record;
}

export function validateRouteStop(values) {
  const errors = {};
  for (const [key, min] of [["stop_order", 1], ["boarding_minutes", 0]]) {
    const value = Number(values[key]);
    if (values[key] === "" || !Number.isInteger(value) || value < min || value > 4294967295) errors[key] = `Ingresa un entero entre ${min} y 4294967295.`;
  }
  if (values.default_departure_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.default_departure_time)) errors.default_departure_time = "Ingresa una hora válida (HH:mm).";
  const price = String(values.price_adjustment);
  if (!/^-?\d+(\.\d{1,2})?$/.test(price) || Math.abs(Number(price)) > 9999999999.99) errors.price_adjustment = "Ingresa un importe válido con un máximo de dos decimales.";
  return errors;
}

export function tourFormError(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;
  const fallback = status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión."
    : status === 403 ? "No tienes permiso para realizar esta acción."
    : status === 404 ? "La ruta o parada no está disponible para esta sucursal."
    : error?.message || "No se pudo completar la operación.";
  return [data?.message || fallback, ...Object.values(data?.errors || {}).flat()].join("\n");
}

// Accept existing API envelope conventions, but reject unrelated/malformed JSON.
export function tourRouteRecord(data, expectedId) {
  const record = data?.route ?? data?.data ?? data;
  if (!record || String(record.id) !== String(expectedId)) {
    throw new Error("No se pudo leer el detalle de la ruta del servidor.");
  }
  return record;
}
