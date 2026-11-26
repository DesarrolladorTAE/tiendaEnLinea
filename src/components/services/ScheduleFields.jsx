import React from "react";
import { Alert, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { exceptionTypes, weekdays } from "./serviceSchedule";

export function SetupFeedback({ feedback }) {
  if (!feedback) return null;
  return <Alert severity={feedback.success ? "success" : "error"}>{feedback.message}
    {!feedback.success && Object.keys(feedback.fields ?? {}).length > 0 && (
      <ul className="mb-0">{[...new Set(Object.values(feedback.fields))].map((message) => <li key={message}>{message}</li>)}</ul>
    )}
  </Alert>;
}

export function ScheduleField({ path, errors, label, value, onChange, type, children, ...props }) {
  return <TextField size="small" fullWidth label={label} value={value} onChange={(event) => onChange(event.target.value)}
    type={type} select={Boolean(children)} error={Boolean(errors[path])} helperText={errors[path]}
    slotProps={{ inputLabel: type === "time" || type === "date" ? { shrink: true } : undefined }}
    {...props}>{children}</TextField>;
}

export function WeeklyScheduleFields({ rows, onChange, errors, withCapacity = false }) {
  const change = (index, key) => (value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return <Stack spacing={1.5}>
    <Typography variant="h6">Horarios semanales</Typography>
    {errors.weekly_schedules && <Alert severity="error">{errors.weekly_schedules}</Alert>}
    {rows.length === 0 && <Typography>Sin franjas configuradas.</Typography>}
    {rows.map((row, index) => {
      const props = (key) => ({ path: `weekly_schedules.${index}.${key}`, errors, value: row[key], onChange: change(index, key) });
      return <Paper variant="outlined" key={index} sx={{ p: 1.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
          <ScheduleField label={`Día de la franja ${index + 1}`} {...props("weekday")}>
            {weekdays.map((day, value) => <MenuItem key={day} value={value}>{day}</MenuItem>)}
          </ScheduleField>
          <ScheduleField label="Inicio" type="time" {...props("start_time")} />
          <ScheduleField label="Fin" type="time" {...props("end_time")} />
          {withCapacity && <ScheduleField label="Capacidad particular" type="number" {...props("capacity_override")} />}
          <FormControlLabel label="Habilitada" control={<Switch checked={row.is_enabled} onChange={(event) => change(index, "is_enabled")(event.target.checked)} />} />
          <Button type="button" color="error" onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Quitar franja ${index + 1}`}>Quitar</Button>
        </Stack>
      </Paper>;
    })}
    <Button type="button" variant="outlined" disabled={rows.length >= 28}
      onClick={() => onChange([...rows, { weekday: 1, is_enabled: true, start_time: "", end_time: "", capacity_override: "" }])}
      sx={{ alignSelf: "start" }}>Agregar franja</Button>
  </Stack>;
}

export function ScheduleExceptionsFields({ rows, onChange, errors }) {
  return <Stack spacing={1.5}>
    <Typography variant="h6">Excepciones por fecha</Typography>
    {errors.exceptions && <Alert severity="error">{errors.exceptions}</Alert>}
    {rows.map((row, index) => {
      const props = (key) => ({
        path: `exceptions.${index}.${key}`, errors, value: row[key],
        onChange: (value) => onChange(rows.map((item, i) => i === index ? { ...item, [key]: value } : item)),
      });
      return <Paper variant="outlined" key={index} sx={{ p: 1.5 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <ScheduleField label="Fecha" type="date" {...props("date")} />
            <ScheduleField label="Tipo" {...props("type")}>
              {Object.entries(exceptionTypes).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </ScheduleField>
            <ScheduleField label="Inicio" type="time" {...props("start_time")} />
            <ScheduleField label="Fin" type="time" {...props("end_time")} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <ScheduleField label="Capacidad particular" type="number" {...props("capacity_override")} />
            <ScheduleField label="Motivo" {...props("reason")} />
            <Button type="button" color="error" onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Quitar excepción ${index + 1}`}>Quitar</Button>
          </Stack>
        </Stack>
      </Paper>;
    })}
    <Button type="button" variant="outlined" disabled={rows.length >= 366} sx={{ alignSelf: "start" }}
      onClick={() => onChange([...rows, { date: "", type: "closed", start_time: "", end_time: "", capacity_override: "", reason: "" }])}>Agregar excepción</Button>
  </Stack>;
}
