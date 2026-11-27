import { usePOSOperations } from "../../context/POSOperationsContext";
import React, { useState } from "react";
import { Alert, Button, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useVehicleMutation, useVehicleRequest, VehicleChoice } from "../vehicles/VehicleRecordFields";
import { readVehiclePage, vehicleRecords as adminVehicleRecords } from "../../services/admin/vehicleRecords";
import { serviceService as adminServiceService } from "../../services/admin/serviceService";
import { operationError, operations as adminOperations } from "../../services/admin/serviceOperations";
import { useOperationChoices } from "./OperationIntake";

export default function BookingEditor({ branch, booking, mode, access, onClose, onSaved, onConflict, onTimezone }) {
  const pos = usePOSOperations();
  const operations = pos?.operations ?? adminOperations;
  const serviceService = pos?.serviceService ?? adminServiceService;
  const vehicleRecords = pos?.vehicleRecords ?? adminVehicleRecords;
  const reschedule = mode === "reschedule";
  const cancel = mode === "cancel";
  const [date, setDate] = useState(booking.booking_date);
  const [time, setTime] = useState("");
  const [resource, setResource] = useState("keep");
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [vehicle, setVehicle] = useState(String(booking.vehicle_id ?? ""));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const { busy, run } = useVehicleMutation();
  const { resources } = useOperationChoices(branch, reschedule ? booking.service_id : null, false);
  const service = useVehicleRequest(async (signal) => (await serviceService.get(branch, booking.service_id, signal)).data.service,
    mode === "edit" && access.canRead ? booking.service_id : null);
  const requirement = service.data?.config?.vehicle_requirement ?? "none";
  const vehicles = useVehicleRequest(async (signal) => {
    const rows = [];
    for (let page = 1; ; page += 1) {
      const result = readVehiclePage((await vehicleRecords.forCustomer(booking.customer_id, page, signal)).data);
      if (signal.aborted) return [];
      rows.push(...result.rows.filter((row) => row.is_active));
      if (page >= result.pages) return rows;
    }
  }, service.data && requirement !== "none" ? booking.customer_id : null);
  const availability = useVehicleRequest(async (signal) => {
    const requested = resource === "keep" ? booking.resource_id : resource;
    const { data } = await serviceService.availability(branch, booking.service_id,
      { date, resource_id: requested || undefined }, signal);
    if (!Array.isArray(data?.data?.slots)) throw new Error("Respuesta de disponibilidad inválida.");
    if (!signal.aborted) onTimezone(data.data.timezone);
    return data.data;
  }, reschedule && date ? JSON.stringify([date, resource]) : null);
  const original = booking.start_time?.slice(0, 5);
  const originalOption = date === booking.booking_date && resource !== "keep";
  const slots = new Map((availability.data?.slots ?? []).map((slot) => [slot.start_time, slot.end_time]));
  const validTime = slots.has(time) || (originalOption && time === original);
  const changedVehicle = vehicle !== String(booking.vehicle_id ?? "");
  const valid = cancel ? reason.trim().length >= 5 && reason.trim().length <= 2000
    : reschedule ? !availability.loading && validTime
    : (notes !== (booking.notes ?? "") || changedVehicle) && !(changedVehicle && requirement === "required" && !vehicle);
  const submit = (event) => {
    event.preventDefault();
    if (!valid || blocked) return;
    run(async (signal) => {
      setError("");
      try {
        const id = booking.id;
        const value = cancel ? await operations.cancelBooking(branch, id, reason.trim(), signal)
          : reschedule ? await operations.reschedule(branch, id, { booking_date: date, start_time: time,
            ...(resource === "keep" ? {} : { resource_id: Number(resource) || null }) }, signal)
          : await operations.editBooking(branch, id, {
            ...(notes !== (booking.notes ?? "") ? { notes: notes || null } : {}),
            ...(changedVehicle ? { vehicle_id: Number(vehicle) || null } : {}),
          }, signal);
        if (!signal.aborted) onSaved(value);
      } catch (failure) {
        if (signal.aborted) return;
        const status = failure.response?.status;
        setError(operationError(failure));
        if ([401, 403, 404, 409].includes(status)) { setBlocked(true); onConflict(); }
        if (status === 422 && reschedule) { setTime(""); availability.retry(); }
      }
    });
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={busy ? undefined : onClose}>
    <DialogTitle>{cancel ? "Cancelar cita" : reschedule ? "Reprogramar cita" : "Editar cita"}</DialogTitle>
    <DialogContent dividers>
      <Stack component="form" spacing={2} onSubmit={submit}>
        <Typography>{booking.booking_code} · {booking.booking_date} · {original}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {cancel ? <>
          <Alert severity="warning">Al confirmar, se liberará el horario y la cita quedará en el historial.</Alert>
          <TextField label="Motivo de cancelación" required multiline disabled={busy || blocked} value={reason} onChange={(event) => setReason(event.target.value)}
            slotProps={{ htmlInput: { minLength: 5, maxLength: 2000 } }} />
        </> : reschedule ? <>
          <TextField type="date" label="Nueva fecha" disabled={busy || blocked} value={date} slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) => { setDate(event.target.value); setTime(""); }} />
          <TextField select label="Recurso" disabled={busy || blocked} value={resource} onChange={(event) => { setResource(event.target.value); setTime(""); }}>
            <MenuItem value="keep">Conservar recurso actual</MenuItem>
            <MenuItem value="">Solicitar sin recurso fijo</MenuItem>
            {(resources.data ?? []).map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>)}
          </TextField>
          <TextField select label="Nuevo horario" value={validTime ? time : ""} disabled={busy || blocked || availability.loading}
            onChange={(event) => setTime(event.target.value)}>
            <MenuItem value="">Selecciona un horario</MenuItem>
            {originalOption && original && !slots.has(original) && <MenuItem value={original}>{original} · horario actual sujeto a validación</MenuItem>}
            {[...slots].map(([start, end]) => <MenuItem key={start} value={start}>{start} – {end}</MenuItem>)}
          </TextField>
          {availability.data && <Typography variant="body2">{availability.data.timezone} · El horario anterior se conserva hasta confirmar.</Typography>}
        </> : <>
          <TextField label="Observaciones" multiline disabled={busy || blocked} value={notes} onChange={(event) => setNotes(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 5000 } }} />
          {vehicles.data && <VehicleChoice label="Vehículo" disabled={busy || blocked} value={vehicle} current={booking.vehicle_id ? booking.vehicle ?? { id: booking.vehicle_id } : null}
            options={vehicles.data.map((item) => ({ ...item, name: item.plates || item.vin }))} onChange={setVehicle} />}
        </>}
        {[resources, availability, service, vehicles].filter((request) => request.error).map((request, index) =>
          <Alert key={index} severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{operationError(request.error)}</Alert>)}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" color={cancel ? "error" : "primary"} disabled={busy || blocked || !valid}>
            {cancel ? "Confirmar cancelación" : reschedule ? "Confirmar reprogramación" : "Guardar cambios"}
          </Button>
          <Button type="button" onClick={onClose} disabled={busy}>Cerrar</Button>
        </Stack>
      </Stack>
    </DialogContent>
  </Dialog>;
}

