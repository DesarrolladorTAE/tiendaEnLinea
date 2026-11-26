import React, { useCallback } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { resourceService } from "../../services/admin/resourceService";
import { SetupFeedback, WeeklyScheduleFields } from "../services/ScheduleFields";
import { validateWeekly, weeklyDraft, weeklyPayload } from "../services/serviceSchedule";
import { useServiceSetupEditor } from "../services/useServiceSetupEditor";

const toDraft = (rows) => weeklyDraft(rows);

export default function ResourceScheduleDialog({ branchId, resource, onClose }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const read = useCallback(async (signal) => {
    const { data } = await resourceService.getSchedule(branchId, resource.id, signal);
    if (!Array.isArray(data?.data?.weekly_schedules)) throw new Error("Invalid resource schedule");
    return data.data.weekly_schedules;
  }, [branchId, resource.id]);
  const { draft, setDraft, load, feedback, saving, save, reload } = useServiceSetupEditor(read, toDraft);
  const submit = (event) => {
    event.preventDefault();
    void save({
      validate: (rows) => validateWeekly(rows, false),
      checkLatest: true,
      write: async (rows) => {
        const { data } = await resourceService.saveSchedule(branchId, resource.id, weeklyPayload(rows, false));
        if (!Array.isArray(data?.data?.weekly_schedules)) throw new Error("Invalid resource schedule");
        return data.data.weekly_schedules;
      },
    });
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="md" onClose={saving ? undefined : onClose}
    slotProps={{ paper: { component: "form", noValidate: true, onSubmit: submit } }}>
    <DialogTitle>Horario de {resource.name}</DialogTitle>
    <DialogContent dividers>
      {load.loading ? <CircularProgress aria-label="Cargando horario del recurso" /> : load.message ? (
        <Alert severity="error" action={<Button onClick={reload}>Reintentar</Button>}>{load.message}</Alert>
      ) : draft && (
        <Stack component="fieldset" disabled={saving} spacing={2} sx={{ minWidth: 0, p: 0, border: 0 }}>
          <SetupFeedback feedback={feedback} />
          <WeeklyScheduleFields rows={draft} onChange={setDraft} errors={feedback?.fields ?? {}} />
          {draft.length === 0 && <Alert severity="info">Sin horario propio, se aplica el horario del servicio junto con la capacidad, las reservas y el estado del recurso.</Alert>}
        </Stack>
      )}
    </DialogContent>
    <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
      {draft && !load.loading && !load.message && <Button onClick={reload} disabled={saving}>Descartar borrador y recargar</Button>}
      <Button onClick={onClose} disabled={saving}>Cerrar</Button>
      <Button type="submit" variant="contained" disabled={saving || load.loading || Boolean(load.message) || draft === null}>Guardar horario</Button>
    </DialogActions>
  </Dialog>;
}
