import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, FormControlLabel, Checkbox, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { fieldAnswer, inspectionProgress, missingAnswer, ordered } from "./formSchema";

function valueText(field, value) {
  if (missingAnswer(value)) return "Sin respuesta";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  const optionLabel = (key) => field.options?.find((item) => item.value === key)?.label ?? key;
  return Array.isArray(value) ? value.map(optionLabel).join(", ") : String(optionLabel(value));
}

export function FormValue({ field, value, onChange, issue, readOnly = false, disabled = false, label = field.label }) {
  if (field.type === "inspection") {
    const point = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const explanationRequired = field.rules?.require_explanation_when?.includes(point.status);
    const notes = [["explanation", "Explicación"], ["observation", "Observación"], ["recommendation", "Recomendación"]];
    return <Stack spacing={1.25}>
      <Typography fontWeight={700}>{field.number != null && `${field.number}. `}{label}{field.required && " *"}</Typography>
      {field.help && <Typography variant="body2" color="text.secondary">{field.help}</Typography>}
      {readOnly ? <>
        <Typography>Resultado: {valueText(field, point.status)}</Typography>
        {notes.filter(([key]) => point[key]).map(([key, title]) => <Typography sx={{ whiteSpace: "pre-wrap" }} key={key}>{title}: {point[key]}</Typography>)}
      </> : <>
        <Stack role="group" aria-label={label} direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {field.options?.map((option) => <Button key={option.value} type="button" disabled={disabled}
            variant={point.status === option.value ? "contained" : "outlined"} aria-pressed={point.status === option.value}
            sx={{ minHeight: 44 }} onClick={() => onChange({ ...point, status: option.value })}>{option.label}</Button>)}
          {point.status && <Button type="button" disabled={disabled} onClick={() => onChange(null)}>Limpiar</Button>}
        </Stack>
        {point.status && notes.filter(([key]) => key !== "explanation" || explanationRequired || point.explanation)
          .map(([key, title]) => <TextField key={key} label={title} value={point[key] ?? ""} disabled={disabled}
            required={key === "explanation" && explanationRequired} multiline size="small"
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            onChange={(event) => onChange({ ...point, [key]: event.target.value })} />)}
      </>}
      {issue && <Typography role="alert" variant="body2" color="error">{issue}</Typography>}
    </Stack>;
  }
  if (readOnly) return <Stack spacing={0.25}>
    <Typography fontWeight={700}>{label}</Typography>
    <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{valueText(field, value)}</Typography>
  </Stack>;
  const common = { label, size: "small", fullWidth: true, disabled, required: field.required,
    error: Boolean(issue), helperText: issue || field.help };
  if (field.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return <Box>
    <Typography fontWeight={700}>{label}{field.required && " *"}</Typography>
    {field.options?.map((option) => <FormControlLabel key={option.value} label={option.label} control={<Checkbox disabled={disabled}
      checked={selected.includes(option.value)} onChange={(event) => onChange(event.target.checked ?
        [...selected, option.value] : selected.filter((key) => key !== option.value))} />} />)}
    {(issue || field.help) && <Typography variant="body2" color={issue ? "error" : "text.secondary"}>{issue || field.help}</Typography>}
    </Box>;
  }
  if (["single_select", "checkbox", "boolean"].includes(field.type)) {
    const options = field.type === "single_select" ? field.options ?? [] : [{ value: "true", label: "Sí" }, { value: "false", label: "No" }];
    return <TextField {...common} select value={value == null ? "" : String(value)} onChange={(event) => {
      const key = event.target.value;
      onChange(key === "" ? null : field.type === "single_select" ? key : key === "true");
    }}>
      <MenuItem value="">Sin respuesta</MenuItem>
      {options.map((option) => <MenuItem value={option.value} key={option.value}>{option.label}</MenuItem>)}
    </TextField>;
  }
  const numeric = ["integer", "decimal"].includes(field.type);
  const temporal = ["date", "time"].includes(field.type);
  return <TextField {...common} value={value ?? ""} multiline={field.type === "long_text"} minRows={field.type === "long_text" ? 3 : undefined}
    type={numeric ? "number" : temporal ? field.type : "text"}
    onChange={(event) => {
      const next = event.target.value;
      onChange(next === "" ? null : numeric ? Number(next) : next);
    }}
    slotProps={{ inputLabel: temporal ? { shrink: true } : undefined,
      htmlInput: numeric ? { step: field.type === "integer" ? 1 : "any" } : undefined }} />;
}

export default function DynamicForm({ schema, answers = {}, onChange, errors = {}, disabled = false, readOnly = false }) {
  if (!Array.isArray(schema?.sections)) return <Alert severity="warning">El esquema de esta captura no está disponible.</Alert>;
  const progress = inspectionProgress(schema, answers);
  const sections = ordered(schema.sections);
  return <Stack spacing={2}>
    <Typography variant="h6">{schema.title}</Typography>
    {schema.description && <Typography>{schema.description}</Typography>}
    {progress.total > 0 && <Stack spacing={1}>
      <Typography aria-live="polite">{progress.answered} de {progress.total} puntos contestados</Typography>
      <LinearProgress variant="determinate" value={100 * progress.answered / progress.total} aria-label="Progreso de inspección" />
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {Object.entries({ bien: "Bien", atender: "Atender", urgente: "Urgente", nr: "NR" }).map(([key, title]) =>
          <Chip key={key} label={`${title}: ${progress.counts[key]}`} size="small" />)}
      </Stack>
    </Stack>}
    <Box>{sections.map((section, index) => {
      const fields = ordered(section.fields);
      return <Accordion key={section.id} defaultExpanded={index === 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>{section.title}</Typography></AccordionSummary>
        <AccordionDetails><Stack spacing={2.5}>
          {section.description && <Typography variant="body2">{section.description}</Typography>}
          {fields.map((field) => <FormValue key={field.id} field={field} value={fieldAnswer(answers, field.id)}
            onChange={(value) => onChange?.(field.id, value)} readOnly={readOnly} disabled={disabled}
            issue={Object.entries(errors).filter(([path]) => path === `answers.${field.id}` || path.startsWith(`answers.${field.id}.`)).map(([, issue]) => issue).join(" ")} />)}
        </Stack></AccordionDetails>
      </Accordion>;
    })}</Box>
    {schema.metadata?.disclaimers?.map((item, index) => <Typography key={index} variant="body2" color="text.secondary">{item}</Typography>)}
  </Stack>;
}
