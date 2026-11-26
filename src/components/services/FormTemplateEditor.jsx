import React, { useEffect, useRef, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Checkbox, FormControlLabel, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import DynamicForm, { FormValue } from "./DynamicForm";
import { appendRow, fieldTypes, fieldsOf, hasOptions, moveRow, ordered, previewAnswers, validateSchema } from "./formSchema";
import { dynamicForms, formError } from "../../services/admin/dynamicForms";
import { useVehicleMutation as useMutation } from "../vehicles/VehicleRecordFields";
import { showConfirm } from "../../utils/alerts";

const keyPattern = /^[a-z][a-z0-9-]*$/;
const newField = (id, order) => ({ id, label: "", type: "short_text", required: false, sort_order: order });
export const newSchema = () => ({ title: "", sections: [{ id: "section_1", title: "", sort_order: 1, fields: [newField("field_2", 1)] }] });

export function FormIssues({ message, fields }) {
  const entries = Object.entries(fields ?? {});
  return message || entries.length ? <Alert severity="error">
    {message}
    {entries.length > 0 && <BoxList entries={entries} />}
  </Alert> : null;
}

function BoxList({ entries }) {
  return <ul style={{ marginBottom: 0 }}>{entries.map(([key, description]) => <li key={key}>{key} · {description}</li>)}</ul>;
}

export default function FormTemplateEditor({ template, onSaved, onCancel }) {
  const [name, setName] = useState(template?.name ?? "");
  const [key, setKey] = useState(template?.key ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [schema, setSchema] = useState(() => template?.schema ?? newSchema());
  const [preview, setPreview] = useState(false);
  const [answers, setAnswers] = useState({});
  const [issue, setIssue] = useState({});
  const counter = useRef(2);
  const { run, busy } = useMutation();
  const sections = ordered(schema.sections);
  const generateId = (prefix) => {
    const used = new Set([...sections, ...fieldsOf(schema)].map((item) => item.id));
    let next;
    do { next = `${prefix}_${++counter.current}`; } while (used.has(next));
    return next;
  };
  const setSections = (value) => setSchema((previous) => ({ ...previous, sections: value }));
  const updateSection = (id, patch) => setSections(sections.map((item) => item.id === id ? { ...item, ...patch } : item));
  const updateRoot = (values) => setSchema((previous) => ({ ...previous, ...values }));
  const save = (event) => {
    event.preventDefault();
    const fields = validateSchema(schema);
    if (!name.trim() || name.length > 191) fields.name = "Ingresa un nombre de hasta 191 caracteres.";
    if (!template && (!keyPattern.test(key) || key.length > 100)) fields.key = "Inicia con una letra y usa minúsculas, números y guiones.";
    if (description.length > 5000) fields.description = "Máximo 5000 caracteres.";
    if (Object.keys(fields).length) { setIssue({ fields }); return; }
    const schemaChanged = !template || JSON.stringify(schema) !== JSON.stringify(template.schema);
    const body = { name: name.trim(), description: description.trim() || null,
      ...(!template ? { key } : {}), ...(schemaChanged ? { schema } : {}) };
    void run(async (signal) => {
      if (template && schemaChanged && (!await showConfirm(
        "Cambiar el esquema incrementará la versión. Las capturas y órdenes que ya guardaron su definición conservarán el snapshot anterior.", "Guardar versión",
      ) || signal.aborted)) return;
      setIssue({});
      try {
        const saved = await (template ? dynamicForms.update(template.id, body, signal) : dynamicForms.create(body, signal));
        if (!signal.aborted) {
          if (!saved?.id) throw new Error("No se pudo confirmar el identificador de la plantilla.");
          onSaved(saved);
        }
      } catch (error) { if (!signal.aborted) setIssue(formError(error)); }
    });
  };
  return <Stack component="form" onSubmit={save} noValidate spacing={2}>
    <FormIssues message={issue.text} fields={issue.fields} />
    {template && <Alert severity="info">Versión vigente {template.version}. Editar nombre o descripción conserva la versión.</Alert>}
    <Stack component="fieldset" disabled={busy} sx={{ border: 0, minWidth: 0, m: 0, p: 0 }} spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}><TextField fullWidth label="Nombre de la plantilla" value={name} onChange={(e) => setName(e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 5 }}><TextField fullWidth label="Clave" value={key} disabled={Boolean(template)} onChange={(e) => setKey(e.target.value)} /></Grid>
        <Grid size={12}><TextField fullWidth label="Descripción de la plantilla" multiline value={description} onChange={(e) => setDescription(e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 7 }}><TextField fullWidth label="Título del formulario" value={schema.title} onChange={(e) => updateRoot({ title: e.target.value })} /></Grid>
        <Grid size={{ xs: 12, sm: 5 }}><TextField fullWidth label="Tipo de esquema (opcional)" value={schema.kind ?? ""} onChange={(e) => updateRoot({ kind: e.target.value || null })} /></Grid>
        <Grid size={12}><TextField fullWidth label="Descripción del formulario" multiline value={schema.description ?? ""} onChange={(e) => updateRoot({ description: e.target.value || null })} /></Grid>
        <Grid size={12}><TextField fullWidth label="Aclaraciones (una por línea)" multiline value={(schema.metadata?.disclaimers ?? []).join("\n")}
          onChange={(e) => updateRoot({ metadata: { disclaimers: e.target.value ? e.target.value.split("\n") : [] } })} /></Grid>
      </Grid>
      <Button type="button" variant="outlined" onClick={() => { setPreview(!preview); setAnswers(previewAnswers(schema)); }}>{preview ? "Cerrar vista previa" : "Vista previa"}</Button>
      {preview && <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2">Las respuestas de esta vista no se guardan.</Typography>
        <DynamicForm schema={schema} answers={answers} onChange={(id, value) => setAnswers((old) => ({ ...old, [id]: value }))} />
      </Paper>}
      {sections.map((section, index) => {
        const fields = ordered(section.fields);
        return <Accordion key={section.id} defaultExpanded={index === 0}>
          <AccordionSummary><Typography fontWeight={700}>Sección {index + 1} · {section.title || "Sin título"}</Typography></AccordionSummary>
          <AccordionDetails><Stack spacing={2}>
            <TextField label="Título de sección" value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
            <TextField label="Descripción de sección" multiline value={section.description ?? ""} onChange={(e) => updateSection(section.id, { description: e.target.value || null })} />
            <OrderButtons label="sección" index={index} length={sections.length}
              move={(offset) => setSections(moveRow(sections, index, offset))} remove={() => setSections(sections.filter((item) => item.id !== section.id))} />
            {fields.map((field, fieldIndex) => <FieldEditor key={field.id} field={field}
              onChange={(patch) => updateSection(section.id, { fields: fields.map((item) => item.id === field.id ? { ...item, ...patch } : item) })}>
              <OrderButtons label="pregunta" index={fieldIndex} length={fields.length}
                move={(offset) => updateSection(section.id, { fields: moveRow(fields, fieldIndex, offset) })}
                remove={() => updateSection(section.id, { fields: fields.filter((item) => item.id !== field.id) })} />
            </FieldEditor>)}
            <Button type="button" disabled={fields.length >= 100 || fieldsOf(schema).length >= 200}
              onClick={() => updateSection(section.id, { fields: appendRow(fields, newField(generateId("field"), 1)) })}>Agregar pregunta</Button>
          </Stack></AccordionDetails>
        </Accordion>;
      })}
      <Button type="button" variant="outlined" disabled={sections.length >= 20}
        onClick={() => setSections(appendRow(sections, { id: generateId("section"), title: "", fields: [] }))}>Agregar sección</Button>
    </Stack>
    <Stack direction="row" spacing={1}>
      <Button variant="contained" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar plantilla"}</Button>
      <Button type="button" disabled={busy} onClick={onCancel}>Cancelar</Button>
    </Stack>
  </Stack>;
}

function OrderButtons({ label, index, length, move, remove }) {
  return <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
    <Button type="button" disabled={index === 0} onClick={() => move(-1)}>Subir {label}</Button>
    <Button type="button" disabled={index + 1 === length} onClick={() => move(1)}>Bajar {label}</Button>
    <Button type="button" color="error" onClick={remove}>Quitar {label}</Button>
  </Stack>;
}

function FieldEditor({ field, onChange, children }) {
  const rules = field.rules ?? {};
  const options = field.options ?? [];
  const numericRules = ["integer", "decimal"].includes(field.type) ? [["min", "Mínimo"], ["max", "Máximo"]] :
    ["short_text", "long_text"].includes(field.type) ? [["min_length", "Longitud mínima"], ["max_length", "Longitud máxima"]] :
    field.type === "multi_select" ? [["max_items", "Selecciones máximas"]] : [];
  const updateOptions = (items) => onChange({ options: items,
    ...(field.type === "inspection" ? { rules: { ...rules, require_explanation_when: (rules.require_explanation_when ?? []).filter((key) => items.some((item) => item.value === key)) } } : {}) });
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1.5}>
    <Typography variant="caption">Identificador: {field.id}</Typography>
    <TextField size="small" label="Pregunta" value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
    <TextField select size="small" label="Tipo de campo" value={field.type}
      onChange={(e) => onChange({ type: e.target.value, options: hasOptions(e.target.value) ? [] : undefined, rules: undefined, default: undefined })}>
      {Object.entries(fieldTypes).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <TextField size="small" label="Ayuda" value={field.help ?? ""} onChange={(e) => onChange({ help: e.target.value || null })} />
    <TextField size="small" type="number" label="Número de pregunta" value={field.number ?? ""} onChange={(e) => onChange({ number: e.target.value ? Number(e.target.value) : undefined })} />
    <FormControlLabel label="Obligatoria" control={<Checkbox checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} />} />
    {hasOptions(field.type) && <>
      {options.map((option, index) => <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1}>
        {[["value", "Valor interno"], ["label", "Etiqueta"]].map(([key, title]) => <TextField key={key} size="small" label={title}
          value={option[key]} onChange={(e) => updateOptions(options.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} />)}
        {field.type === "inspection" && <FormControlLabel label="Exigir explicación" control={<Checkbox
          checked={(rules.require_explanation_when ?? []).includes(option.value)}
          onChange={(e) => onChange({ rules: { ...rules, require_explanation_when: e.target.checked ?
            [...new Set([...(rules.require_explanation_when ?? []), option.value])] :
            (rules.require_explanation_when ?? []).filter((value) => value !== option.value) } })} />} />}
        <Button type="button" color="error" onClick={() => updateOptions(options.filter((_, i) => i !== index))}>Quitar opción</Button>
      </Stack>)}
      <Button type="button" disabled={options.length >= 30} onClick={() => updateOptions([...options, { value: "", label: "" }])}>Agregar opción</Button>
    </>}
    {numericRules.map(([key, label]) => <TextField key={key} type="number" size="small" label={label} value={rules[key] ?? ""}
      onChange={(e) => onChange({ rules: { ...rules, [key]: e.target.value === "" ? undefined : Number(e.target.value) } })} />)}
    {field.type !== "inspection" && <FormValue field={{ ...field, required: false }} label="Valor predeterminado"
      value={field.default} onChange={(value) => onChange({ default: value ?? undefined })} />}
    {children}
  </Stack></Paper>;
}
