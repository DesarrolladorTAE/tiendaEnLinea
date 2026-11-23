import { tourFormControlsSx } from "./tourFormStyles.mjs";
import React, { useRef, useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getTourStop, removeTourRouteStop, updateTourRouteStop } from "../../services/tours/tourService";
import { showConfirm } from "../../utils/alerts";
import { tourEntityRecord, tourFormError as departureError } from "./tourFormData.mjs";
import TourEntityDialog from "./TourEntityDialog";
import TourRouteStopDialog from "./TourRouteStopDialog";

export default function TourRouteEditor({ context, route, disabled, onChanged }) {
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const locked = disabled || busy;
  const perform = async (operation, message) => {
    if (pending.current || disabled) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await operation();
      if (response) onChanged(response.data?.message || message);
    } catch (err) { setError(departureError(err)); }
    finally { pending.current = false; setBusy(false); }
  };
  const editStop = async (stop) => {
    if (pending.current || disabled) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const { data } = await getTourStop(context, stop.id);
      setEditor({ kind: "stop", record: tourEntityRecord(data, "stop", stop.id) });
    } catch (err) { setError(departureError(err)); }
    finally { pending.current = false; setBusy(false); }
  };
  const saved = (message) => { setEditor(null); onChanged(message); };
  return <Paper variant="outlined" sx={{ ...tourFormControlsSx, p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff", borderColor: "rgba(0,0,0,.1)", borderLeft: "4px solid #f9b233", boxShadow: "0 4px 16px rgba(0,0,0,.04)" }} aria-busy={busy}>
    <Stack spacing={1.5}>
      <Typography variant="h6" fontWeight={900}>{route.name || `Ruta #${route.id}`}</Typography>
      {route.detailError && <Alert severity="warning">No se pudo consultar el detalle de la ruta: {route.detailError}</Alert>}
      <Typography>{route.origin || "Origen sin información"} → {route.destination || "Destino sin información"}</Typography>
      {route.description && <Typography sx={{ whiteSpace: "pre-wrap" }}>{route.description}</Typography>}
      <Typography variant="body2">Utilizada por {route.departures.length} salida(s) de este servicio. Puede utilizarse también en otros tours; los cambios afectan a todas sus salidas.</Typography>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pt: 1 }}>
        <Button type="button" variant="outlined" disabled={locked || !!route.detailError} onClick={() => setEditor({ kind: "route", record: route })}>Editar ruta</Button>
        <Button type="button" variant="outlined" disabled={locked || !!route.error} onClick={() => setEditor({ kind: "association" })}>Agregar parada existente</Button>
        <Button type="button" disabled={locked || !!route.error} onClick={() => setEditor({ kind: "stop" })}>Crear parada</Button>
      </Stack>
      {route.error ? <Alert severity="error">No se pudieron consultar las paradas: {route.error}</Alert> : !route.stops.length ? <Typography>Esta ruta no tiene paradas registradas.</Typography> : <Box component="ol" sx={{ pl: 3, my: 0, "& > li::marker": { color: "#b97400", fontWeight: 900 } }}>
        {route.stops.map((stop, index) => {
          const validStop = Number.isSafeInteger(Number(stop.id)) && Number(stop.id) > 0;
          return <Box component="li" key={`${stop.id}-${index}`} sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5, bgcolor: "#fafaf9", border: "1px solid #e4e4e7", borderRadius: 2, overflowWrap: "anywhere" }}>
            <Typography fontWeight={700}>{stop.name}</Typography>
            <Typography variant="body2">Referencia: {stop.reference || "Sin información"}</Typography>
            <Typography variant="body2">Hora de abordaje: {stop.time?.slice(0, 5) || "Sin información"} · Orden: {stop.order ?? "No informado"}</Typography>
            <Typography variant="body2">Minutos de abordaje: {stop.boardingMinutes ?? "Sin información"} · Ajuste de precio: {stop.priceAdjustment ?? "Sin información"}</Typography>
            {!validStop && <Alert severity="warning">La respuesta no incluye el ID de la parada. Actualiza el listado para poder editarla.</Alert>}
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Button type="button" disabled={locked || !validStop} onClick={() => editStop(stop)}>Editar parada</Button>
              <Button type="button" disabled={locked || !validStop} onClick={() => setEditor({ kind: "association", stop })}>Editar abordaje</Button>
              <Button type="button" aria-label={`Subir ${stop.name}`} disabled={locked || !validStop || index === 0} onClick={() => perform(() => updateTourRouteStop(context, route.id, stop.id, { stop_order: index }), "Orden actualizado.")}>Subir</Button>
              <Button type="button" aria-label={`Bajar ${stop.name}`} disabled={locked || !validStop || index === route.stops.length - 1} onClick={() => perform(() => updateTourRouteStop(context, route.id, stop.id, { stop_order: index + 2 }), "Orden actualizado.")}>Bajar</Button>
              <Button type="button" variant="outlined" color="error" disabled={locked || !validStop} onClick={() => perform(async () => {
                if (!await showConfirm(`¿Quitar ${stop.name} de esta ruta? Se retirará de todas las salidas que usan la ruta. La parada seguirá disponible en el catálogo.`, "Quitar de la ruta")) return null;
                return removeTourRouteStop(context, route.id, stop.id);
              }, "Parada retirada de la ruta.")}>Quitar de la ruta</Button>
            </Stack>
          </Box>;
        })}
      </Box>}
    </Stack>
    {editor && <Box onSubmit={(event) => event.stopPropagation()}>
      {editor.kind === "association" ? <TourRouteStopDialog context={context} route={route} stop={editor.stop} initialStop={editor.initialStop} onClose={() => setEditor(null)} onSaved={saved} /> : <TourEntityDialog context={context} entity={editor.kind} record={editor.record} onClose={() => setEditor(null)} onSaved={(record, message) => {
        if (editor.kind === "stop" && !editor.record && record) {
          setEditor({ kind: "association", initialStop: record });
        } else saved(message);
      }} />}
    </Box>}
  </Paper>;
}
