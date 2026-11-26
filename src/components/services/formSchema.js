export const fieldTypes = {
  short_text: "Texto corto", long_text: "Texto largo", integer: "Entero", decimal: "Decimal",
  date: "Fecha", time: "Hora", single_select: "Selección única", multi_select: "Selección múltiple",
  checkbox: "Casilla", boolean: "Sí / No", inspection: "Inspección",
};
export const hasOptions = (type) => ["single_select", "multi_select", "inspection"].includes(type);
export const ordered = (items = []) => [...items].sort((a, b) => a.sort_order - b.sort_order);
export const fieldsOf = (schema) => (schema?.sections ?? []).flatMap((section) => section.fields ?? []);
export const fieldAnswer = (answers, id) => Object.hasOwn(answers, id) ? answers[id] : undefined;
export const previewAnswers = (schema) => Object.fromEntries(fieldsOf(schema)
  .filter((field) => field.type !== "inspection" && field.default !== undefined).map((field) => [field.id, field.default]));
export const missingAnswer = (value) => value == null || value === "" || (Array.isArray(value) && !value.length);
const identifier = /^[a-z][a-z0-9_]{0,63}$/;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const bytes = (value) => new Blob([JSON.stringify(value)]).size;

export function answerIssue(field, value, final = false) {
  if (missingAnswer(value)) return final && field.required ? "Esta respuesta es obligatoria." : "";
  const rules = field.rules ?? {};
  const options = (field.options ?? []).map(({ value: key }) => key);
  switch (field.type) {
    case "short_text":
    case "long_text": {
      const cap = field.type === "short_text" ? 500 : 10000;
      if (typeof value !== "string" || value.length < (rules.min_length ?? 0) || value.length > Math.min(cap, rules.max_length ?? cap)) return "Revisa la longitud del texto.";
      break;
    }
    case "integer":
    case "decimal":
      if (!finite(value) || (field.type === "integer" && !Number.isInteger(value)) ||
          value < (rules.min ?? -Infinity) || value > (rules.max ?? Infinity)) return "Ingresa un número válido dentro del rango.";
      break;
    case "date": {
      const date = new Date(`${value}T00:00:00Z`);
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) return "Ingresa una fecha válida.";
      break;
    }
    case "time":
      if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Ingresa una hora válida.";
      break;
    case "checkbox":
    case "boolean":
      if (typeof value !== "boolean") return "Elige Sí o No.";
      break;
    case "single_select":
      if (!options.includes(value)) return "Elige una opción válida.";
      break;
    case "multi_select":
      if (!Array.isArray(value) || new Set(value).size !== value.length || value.length > (rules.max_items ?? 30) || value.some((key) => !options.includes(key))) return "Revisa las opciones seleccionadas.";
      break;
    case "inspection":
      if (!value || typeof value !== "object" || !options.includes(value.status)) return "Elige un resultado válido.";
      if (rules.require_explanation_when?.includes(value.status) && (typeof value.explanation !== "string" || !value.explanation.trim())) return "Explica el motivo de este resultado.";
      if (["explanation", "observation", "recommendation"].some((key) => value[key] != null && (typeof value[key] !== "string" || value[key].length > 2000))) return "Cada nota admite hasta 2000 caracteres.";
      break;
    default:
      return "Tipo de campo no admitido.";
  }
  return "";
}

export function validateAnswers(schema, answers, final = false) {
  const errors = {};
  const fields = fieldsOf(schema);
  const ids = new Set(fields.map(({ id }) => id));
  for (const key of Object.keys(answers)) if (!ids.has(key)) errors[`answers.${key}`] = "Campo no reconocido.";
  for (const field of fields) {
    const issue = answerIssue(field, fieldAnswer(answers, field.id), final);
    if (issue) errors[`answers.${field.id}`] = issue;
  }
  if (Object.keys(answers).length > 200 || bytes(answers) > 131072) errors.answers = "Las respuestas exceden el tamaño permitido.";
  return errors;
}

export function validateSchema(schema) {
  const errors = {};
  const ids = new Set();
  const validText = (value, max, required = false) => value == null ? !required :
    typeof value === "string" && (!required || Boolean(value.trim())) && value.length <= max;
  if (!validText(schema.title, 191, true)) errors["schema.title"] = "Ingresa un título de hasta 191 caracteres.";
  if (!validText(schema.description, 2000) || !validText(schema.kind, 50)) errors.schema = "Revisa la descripción y el tipo de esquema.";
  if (!schema.sections?.length || schema.sections.length > 20 || fieldsOf(schema).length > 200) errors["schema.sections"] = "Agrega de 1 a 20 secciones y hasta 200 preguntas en total.";
  const disclaimers = schema.metadata?.disclaimers;
  if (disclaimers && (disclaimers.length > 10 || disclaimers.some((item) => !validText(item, 500, true)))) errors["schema.metadata.disclaimers"] = "Ingresa hasta 10 aclaraciones de 500 caracteres.";
  const checkId = (path, id) => {
    if (!identifier.test(id) || ids.has(id)) errors[path] = "Usa un identificador único con letra inicial, minúsculas, números o guion bajo.";
    ids.add(id);
  };
  (schema.sections ?? []).forEach((section, index) => {
    const root = `schema.sections.${index}`;
    checkId(`${root}.id`, section.id);
    if (!Number.isInteger(section.sort_order) || section.sort_order < 1 || section.sort_order > 1000) errors[`${root}.sort_order`] = "El orden debe estar entre 1 y 1000.";
    if (!validText(section.title, 191, true) || !validText(section.description, 1000)) errors[root] = "Revisa el título y descripción de la sección.";
    if (!section.fields?.length || section.fields.length > 100) errors[`${root}.fields`] = "Agrega de 1 a 100 preguntas en esta sección.";
    (section.fields ?? []).forEach((field, fieldIndex) => {
      const path = `${root}.fields.${fieldIndex}`;
      checkId(`${path}.id`, field.id);
      if (!Number.isInteger(field.sort_order) || field.sort_order < 1 || field.sort_order > 1000) errors[`${path}.sort_order`] = "El orden debe estar entre 1 y 1000.";
      if (!Object.hasOwn(fieldTypes, field.type) || !validText(field.label, 300, true) || !validText(field.help, 1000)) errors[path] = "Revisa el tipo, etiqueta y ayuda de la pregunta.";
      const options = field.options ?? [];
      const keys = options.map((item) => item.value);
      if (hasOptions(field.type) && (!options.length || options.length > 30 || new Set(keys).size !== keys.length ||
          options.some((item) => !identifier.test(item.value) || !validText(item.label, 100, true)))) errors[`${path}.options`] = "Ingresa de 1 a 30 opciones válidas y únicas.";
      const rules = field.rules ?? {};
      if (rules.min > rules.max || rules.min_length > rules.max_length ||
        ["min", "max"].some((key) => rules[key] != null && !finite(rules[key])) ||
        ["min_length", "max_length"].some((key) => rules[key] != null && (!Number.isInteger(rules[key]) || rules[key] < 0 || rules[key] > 10000)) ||
        (rules.max_items != null && (!Number.isInteger(rules.max_items) || rules.max_items < 1 || rules.max_items > 30)) ||
        rules.require_explanation_when?.some((value) => !keys.includes(value))) errors[`${path}.rules`] = "Revisa los límites y las opciones que requieren explicación.";
      if (field.number != null && (!Number.isInteger(field.number) || field.number < 1 || field.number > 1000)) errors[`${path}.number`] = "El número debe estar entre 1 y 1000.";
      if (field.default !== undefined && (field.type === "inspection" || answerIssue(field, field.default))) errors[`${path}.default`] = "Valor predeterminado inválido.";
    });
  });
  if (schema.kind === "inspection25") {
    const points = fieldsOf(schema).filter(({ type }) => type === "inspection");
    if (points.length !== 25 || new Set(points.map(({ number }) => number)).size !== 25 ||
        points.some((point) => !Number.isInteger(point.number) || point.number < 1 || point.number > 25 ||
          [...(point.options ?? [])].map(({ value }) => value).sort().join(",") !== "atender,bien,nr,urgente" ||
          !point.rules?.require_explanation_when?.includes("nr"))) errors["schema.kind"] = "La inspección requiere 25 puntos numerados y las opciones de Laravel, con explicación para NR.";
  }
  if (bytes(schema) > 65536) errors.schema = "El esquema supera 65 536 bytes.";
  return errors;
}

export function moveRow(items, index, offset) {
  const copy = [...items];
  const destination = index + offset;
  if (destination < 0 || destination >= copy.length) return items;
  [copy[index], copy[destination]] = [copy[destination], copy[index]];
  return copy.map((item, sortOrder) => ({ ...item, sort_order: sortOrder + 1 }));
}

export function appendRow(items, item) {
  const next = (items.at(-1)?.sort_order ?? 0) + 1;
  return next <= 1000 ? [...items, { ...item, sort_order: next }] :
    [...items, item].map((row, index) => ({ ...row, sort_order: index + 1 }));
}

export function inspectionProgress(schema, answers) {
  const points = fieldsOf(schema).filter(({ type }) => type === "inspection");
  const counts = { bien: 0, atender: 0, urgente: 0, nr: 0 };
  let answered = 0;
  for (const field of points) {
    const value = fieldAnswer(answers, field.id);
    if (!missingAnswer(value) && !answerIssue(field, value, true)) {
      answered += 1;
      if (Object.hasOwn(counts, value.status)) counts[value.status] += 1;
    }
  }
  return { total: points.length, answered, counts };
}
