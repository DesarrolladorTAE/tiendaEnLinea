export const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const exceptionTypes = {
  closed: "Cerrado", blocked: "Bloqueado", holiday: "Festivo",
  open: "Abierto", special: "Especial", override: "Horario alternativo",
};
const openingTypes = new Set(["open", "special", "override"]);
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const timeInput = (value) => value?.slice(0, 5) || "";
export const numberOrNull = (value) => value === "" || value == null ? null : Number(value);
export const integerIn = (value, min, max) => {
  const number = numberOrNull(value);
  return Number.isSafeInteger(number) && number >= min && number <= max;
};
export const isDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const bookingNumbers = [
  ["duration_minutes", "Duración (minutos)", 1, 1440],
  ["slot_interval_minutes", "Intervalo entre citas (minutos)", 1, 1440],
  ["capacity_per_slot", "Capacidad por horario", 1, 1000],
  ["capacity_per_day", "Capacidad diaria (opcional)", 1, 10000, true],
  ["min_advance_minutes", "Anticipación mínima (minutos)", 0, 525600],
  ["max_advance_days", "Anticipación máxima (días)", 1, 730],
  ["buffer_minutes", "Separación entre citas (minutos)", 0, 1440],
];

export function weeklyDraft(rows) {
  return rows.map((row) => ({
    weekday: row.weekday, is_enabled: Boolean(row.is_enabled),
    start_time: timeInput(row.start_time), end_time: timeInput(row.end_time),
    capacity_override: row.capacity_override ?? "",
  }));
}

export function bookingDraft(config, duration) {
  return {
    is_active: config?.is_active ?? true,
    duration_minutes: config?.duration_minutes ?? duration ?? 60,
    slot_interval_minutes: config?.slot_interval_minutes ?? 30,
    capacity_per_slot: config?.capacity_per_slot ?? 1,
    capacity_per_day: config?.capacity_per_day ?? "",
    min_advance_minutes: config?.min_advance_minutes ?? 0,
    max_advance_days: config?.max_advance_days ?? 30,
    buffer_minutes: config?.config?.buffer_minutes ?? 0,
    requires_confirmation: config?.requires_confirmation ?? false,
    weekly_schedules: weeklyDraft(config?.weekly_schedules ?? []),
    exceptions: (config?.schedule_exceptions ?? []).map((row) => ({
      date: row.date, type: row.type, start_time: timeInput(row.start_time),
      end_time: timeInput(row.end_time), capacity_override: row.capacity_override ?? "", reason: row.reason ?? "",
    })),
  };
}

export function validateWeekly(rows, withCapacity) {
  const errors = {};
  const enabled = new Map();
  if (withCapacity && !rows.length) errors.weekly_schedules = "Agrega al menos una franja semanal.";
  if (rows.length > 28) errors.weekly_schedules = "Agrega hasta 28 franjas semanales.";
  rows.forEach((row, index) => {
    const key = `weekly_schedules.${index}`;
    if (!integerIn(row.weekday, 0, 6)) errors[`${key}.weekday`] = "Selecciona un día válido.";
    if (!timePattern.test(row.start_time)) errors[`${key}.start_time`] = "Ingresa una hora válida.";
    if (!timePattern.test(row.end_time) || row.start_time >= row.end_time) {
      errors[`${key}.end_time`] = "La hora final debe ser posterior a la inicial.";
    }
    if (withCapacity && numberOrNull(row.capacity_override) !== null && !integerIn(row.capacity_override, 1, 1000)) {
      errors[`${key}.capacity_override`] = "Ingresa un entero entre 1 y 1000.";
    }
    if (!row.is_enabled || errors[`${key}.start_time`] || errors[`${key}.end_time`]) return;
    const day = Number(row.weekday);
    const previous = enabled.get(day) ?? [];
    if (previous.some((other) => other.start_time < row.end_time && row.start_time < other.end_time)) {
      errors[`${key}.start_time`] = "Esta franja se traslapa con otra habilitada.";
    }
    enabled.set(day, [...previous, row]);
  });
  return errors;
}

export function weeklyPayload(rows, withCapacity) {
  return rows.map(({ weekday, is_enabled, start_time, end_time, capacity_override }) => ({
    weekday: Number(weekday), is_enabled, start_time, end_time,
    ...(withCapacity ? { capacity_override: numberOrNull(capacity_override) } : {}),
  }));
}

export function validateBooking(values) {
  const errors = validateWeekly(values.weekly_schedules, true);
  bookingNumbers.forEach(([key, , min, max, optional]) => {
    if (!(optional && numberOrNull(values[key]) === null) && !integerIn(values[key], min, max)) {
      errors[key] = `Ingresa un entero entre ${min} y ${max}.`;
    }
  });
  if (values.exceptions.length > 366) errors.exceptions = "Agrega hasta 366 excepciones.";
  values.exceptions.forEach((row, index) => {
    const key = `exceptions.${index}`;
    if (!isDate(row.date)) errors[`${key}.date`] = "Selecciona una fecha válida.";
    if (!Object.hasOwn(exceptionTypes, row.type)) errors[`${key}.type`] = "Selecciona un tipo válido.";
    const opening = openingTypes.has(row.type);
    if ((opening || row.start_time) && !timePattern.test(row.start_time)) errors[`${key}.start_time`] = "Ingresa una hora inicial válida.";
    if (((opening || row.end_time) && !timePattern.test(row.end_time)) ||
        (row.start_time && row.end_time && row.start_time >= row.end_time)) {
      errors[`${key}.end_time`] = "La hora final debe ser posterior a la inicial.";
    }
    if (numberOrNull(row.capacity_override) !== null && !integerIn(row.capacity_override, 1, 1000)) {
      errors[`${key}.capacity_override`] = "Ingresa un entero entre 1 y 1000.";
    }
    if (row.reason.length > 191) errors[`${key}.reason`] = "El motivo admite hasta 191 caracteres.";
  });
  return errors;
}

export function bookingPayload(values) {
  return {
    is_active: values.is_active, requires_confirmation: values.requires_confirmation,
    ...Object.fromEntries(bookingNumbers.map(([key]) => [key, numberOrNull(values[key])])),
    weekly_schedules: weeklyPayload(values.weekly_schedules, true),
    exceptions: values.exceptions.map(({ date, type, start_time, end_time, capacity_override, reason }) => ({
      date, type, start_time: start_time || null, end_time: end_time || null,
      capacity_override: numberOrNull(capacity_override), reason: reason || null,
    })),
  };
}
