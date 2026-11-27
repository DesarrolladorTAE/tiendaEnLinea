import { usePOSOperations } from "../../context/POSOperationsContext";
import React, { useRef, useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { QuickCustomerRegistration, VehicleChoice, useVehicleRequest, useVehicleMutation } from "../vehicles/VehicleRecordFields";
import { serviceService as adminServiceService } from "../../services/admin/serviceService";
import { readVehiclePage, vehicleRecords as adminVehicleRecords, vehicleRecordsUrl as adminVehicleRecordsUrl } from "../../services/admin/vehicleRecords";
import { operations as adminOperations, operationError } from "../../services/admin/serviceOperations";

export function useOperationChoices(branch, serviceId, includeServices = true) {
  const pos = usePOSOperations();
  const serviceService = pos?.serviceService ?? adminServiceService;
  const services = useVehicleRequest(async (signal) => {
    const rows = [];
    for (let page = 1; ; page += 1) {
      if (signal.aborted) throw new DOMException("Consulta cancelada.", "AbortError");
      const { data } = await serviceService.list(branch, { page }, signal);
      const result = readVehiclePage(data.services);
      rows.push(...result.rows);
      if (page >= result.pages) return rows;
    }
  }, includeServices ? `services:${branch}` : null);
  const resources = useVehicleRequest(async (signal) => {
    const { data } = await serviceService.getResources(branch, serviceId, signal);
    return readVehiclePage(data.resources ?? data.data).rows.filter((row) =>
      Boolean(row.is_active) && Boolean(row.pivot?.is_active));
  }, serviceId ? `resources:${branch}:${serviceId}` : null);
  return { services, resources };
}

export default function OperationIntake({ branch, mode, origin, access, onSaved, onCancel, onTimezone }) {
  const pos = usePOSOperations();
  const operations = pos?.operations ?? adminOperations;
  const serviceService = pos?.serviceService ?? adminServiceService;
  const vehicleRecords = pos?.vehicleRecords ?? adminVehicleRecords;
  const vehicleRecordsUrl = pos?.vehicleRecordsUrl ?? adminVehicleRecordsUrl;
  const direct = mode === "direct";
  const [draft, setDraft] = useState({ service_id: String(origin?.service_id ?? ""), customer_id: String(origin?.customer_id ?? ""),
    vehicle_id: String(origin?.vehicle_id ?? ""), resource_id: String(origin?.resource_id ?? ""), date: "", time: "", notes: "" });
  const [newCustomer, setNewCustomer] = useState(false);
  const [addedCustomer, setAddedCustomer] = useState(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const attempts = useRef(new Map());
  const { busy, run } = useVehicleMutation();
  const { services, resources } = useOperationChoices(branch, draft.service_id);
  const customers = useVehicleRequest(async (signal) => readVehiclePage((await vehicleRecords.customers(signal)).data).rows,
    origin ? null : `customers:${branch}`);
  const service = useVehicleRequest(async (signal) => {
    const { data } = await serviceService.get(branch, draft.service_id, signal);
    if (!data.service) throw new Error("Servicio no disponible.");
    return data.service;
  }, draft.service_id ? `${branch}:${draft.service_id}` : null);
  const requirement = service.data?.config?.vehicle_requirement ?? "none";
  const vehicles = useVehicleRequest(async (signal) => {
    const rows = [];
    for (let page = 1; ; page += 1) {
      if (signal.aborted) throw new DOMException("Consulta cancelada.", "AbortError");
      const { data } = await vehicleRecords.forCustomer(draft.customer_id, page, signal);
      const result = readVehiclePage(data);
      rows.push(...result.rows.filter((row) => Boolean(row.is_active)));
      if (page >= result.pages) return rows;
    }
  }, !origin && access.canRead && draft.customer_id && ["optional", "required"].includes(requirement)
    ? `${branch}:vehicles:${draft.customer_id}` : null);
  const availability = useVehicleRequest(async (signal) => {
    const { data } = await serviceService.availability(branch, draft.service_id,
      { date: draft.date, resource_id: draft.resource_id || undefined }, signal);
    if (!Array.isArray(data?.data?.slots)) throw new Error("Respuesta de disponibilidad inválida.");
    if (!signal.aborted) onTimezone?.(data.data.timezone);
    return data.data;
  }, !direct && draft.date && draft.service_id ? JSON.stringify([branch, draft.service_id, draft.date, draft.resource_id]) : null);
  const set = (key, value) => {
    setError("");
    setDraft((old) => ({ ...old, [key]: value,
      ...(key === "service_id" ? { resource_id: "", vehicle_id: "" } : {}),
      ...(key === "customer_id" ? { vehicle_id: "" } : {}),
      ...(["date", "resource_id", "service_id"].includes(key) ? { time: "" } : {}),
    }));
  };
  const hasSlot = availability.data?.slots.some((slot) => slot.start_time === draft.time);
  const valid = !denied && !newCustomer && draft.customer_id && service.data && ["none", "optional", "required"].includes(requirement) &&
    (requirement !== "required" || draft.vehicle_id) && (!direct || !service.data.requires_resource || draft.resource_id) &&
    (direct || (!availability.loading && hasSlot));
  const submit = (event) => {
    event.preventDefault();
    if (!valid) return;
    run(async (signal) => {
      setError("");
      const context = { service_id: Number(draft.service_id), customer_id: Number(draft.customer_id),
        vehicle_id: requirement === "none" ? null : Number(draft.vehicle_id) || null };
      const resource_id = Number(draft.resource_id) || null;
      const body = direct ? { ...context, resource_id, description: draft.notes || null } :
        { ...(origin ? {} : context), resource_id, booking_date: draft.date, start_time: draft.time, notes: draft.notes || null };
      const signature = JSON.stringify(body);
      if (!attempts.current.has(signature)) attempts.current.set(signature, crypto.randomUUID());
      try {
        const payload = { ...body, idempotency_key: attempts.current.get(signature) };
        const result = direct ? await operations.createOrder(branch, payload, signal)
          : origin ? await operations.nextBooking(branch, origin.id, payload, signal) : await operations.createBooking(branch, payload, signal);
        if (!signal.aborted) onSaved(result);
      } catch (failure) {
        if (signal.aborted) return;
        setError(operationError(failure));
        if ([401, 403].includes(failure.response?.status)) setDenied(true);
        if (failure.response?.data?.errors?.start_time) {
          setDraft((old) => ({ ...old, time: "" }));
          availability.retry();
        }
      }
    });
  };
  return <Stack component="form" onSubmit={submit} spacing={2}>
    {error && <Alert severity="error">{error}</Alert>}
    {!origin ? <>
      <VehicleChoice label="Cliente" value={draft.customer_id} options={customers.data} current={addedCustomer} loading={customers.loading} disabled={busy || newCustomer} onChange={(value) => set("customer_id", value)} />
      <QuickCustomerRegistration open={newCustomer} setOpen={setNewCustomer} disabled={busy} onCreated={(customer) => { setAddedCustomer(customer); set("customer_id", String(customer.id)); }} />
      <Button onClick={customers.retry} disabled={busy}>Actualizar clientes</Button>
      <VehicleChoice label="Servicio" value={draft.service_id} options={services.data?.filter((item) => item.service_type !== "tour")}
        loading={services.loading} disabled={busy} onChange={(value) => set("service_id", value)} />
      {["optional", "required"].includes(requirement) && access.canRead &&
        <VehicleChoice label={requirement === "required" ? "Vehículo obligatorio" : "Vehículo opcional"} value={draft.vehicle_id}
          options={vehicles.data?.map((row) => ({ ...row, name: [row.plates, row.vin].filter(Boolean).join(" · ") }))}
          loading={vehicles.loading} disabled={busy || !draft.customer_id} onChange={(value) => set("vehicle_id", value)} />}
      {requirement === "required" && !access.canRead && <Alert severity="warning">Este servicio requiere acceso a expedientes vehiculares.</Alert>}
      {requirement !== "none" && requirement && access.canWrite && (!pos || access.canReadCatalog) &&
        <Button component={Link} to={vehicleRecordsUrl(branch, "/new")} target="_blank" rel="noopener noreferrer">Registrar vehículo</Button>}
      {vehicles.data && <Button onClick={vehicles.retry} disabled={busy}>Actualizar vehículos</Button>}
    </> : <Typography>Cliente {origin.customer_snapshot?.name ?? origin.customer_id} · {origin.service?.name ?? origin.service_id}</Typography>}
    <VehicleChoice label="Recurso" value={draft.resource_id} current={origin?.resource} options={resources.data}
      loading={resources.loading} disabled={busy} onChange={(value) => set("resource_id", value)} />
    {!direct && <>
      <TextField type="date" label="Fecha" value={draft.date} onChange={(e) => set("date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} disabled={busy} />
      <TextField select label="Horario disponible" value={hasSlot ? draft.time : ""} onChange={(e) => set("time", e.target.value)} disabled={busy || availability.loading}>
        <MenuItem value="">Selecciona un horario</MenuItem>
        {[...new Map((availability.data?.slots ?? []).map((slot) => [slot.start_time, slot])).values()].map((slot) =>
          <MenuItem key={slot.start_time} value={slot.start_time}>{slot.start_time} – {slot.end_time}</MenuItem>)}
      </TextField>
      {availability.data && <Typography variant="body2">{availability.data.timezone}{availability.data.slots.length ? "" : " · Sin horarios disponibles"}</Typography>}
      <Typography variant="body2">Laravel determina si la cita requiere confirmación manual.</Typography>
    </>}
    {[customers, services, service, resources, vehicles, availability].filter((request) => request.error).map((request, index) =>
      <Alert key={index} severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{operationError(request.error)}</Alert>)}
    <TextField label="Observaciones" multiline value={draft.notes} onChange={(e) => set("notes", e.target.value)}
      disabled={busy} slotProps={{ htmlInput: { maxLength: direct ? 10000 : 5000 } }} />
    <Stack direction="row" spacing={1}>
      <Button type="submit" variant="contained" disabled={busy || !valid}>{direct ? "Crear orden" : "Programar cita"}</Button>
      {onCancel && <Button type="button" onClick={onCancel} disabled={busy || newCustomer}>Cerrar</Button>}
    </Stack>
  </Stack>;
}

