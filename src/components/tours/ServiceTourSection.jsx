import { tourFormControlsSx, tourMenuProps } from "./tourFormStyles.mjs";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getDeparture, getDepartures, getRouteStops, getTourRoute, getTourRoutes } from "../../services/tours/tourService";
import { departureCollection, departureError, departureRecord } from "./departureUtils";
import { tourRouteId, tourRouteRecord, tourStopRows, usedTourRoutes } from "./tourFormData.mjs";
import DepartureCard from "./DepartureCard";
import DepartureFormDialog from "./DepartureFormDialog";
import TourEntityDialog from "./TourEntityDialog";
import TourRouteEditor from "./TourRouteEditor";

export default function ServiceTourSection({ branchId, serviceId, disabled = false, embedded = false }) {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, departures: [], routes: [], warnings: [], error: "" });
  const [editor, setEditor] = useState(null);
  const [opening, setOpening] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [routeEditor, setRouteEditor] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [catalog, setCatalog] = useState({ rows: [], loading: true, error: "" });
  const detailRequest = useRef(null);
  const context = { branchId, serviceId, mode: "store" };

  useEffect(() => () => detailRequest.current?.abort(), []);

  useEffect(() => {
    if (!serviceId) return;
    let active = true; const controller = new AbortController();
    setCatalog({ rows: [], loading: true, error: "" });
    getTourRoutes({ branchId, serviceId, mode: "store", signal: controller.signal }).then((rows) => {
      if (active) setCatalog({ rows, loading: false, error: "" });
    }).catch((error) => { if (active) setCatalog({ rows: [], loading: false, error: departureError(error) }); });
    return () => { active = false; controller.abort(); };
  }, [branchId, serviceId, revision]);

  useEffect(() => {
    if (!serviceId) return;
    let active = true;
    const controller = new AbortController();
    const options = { branchId, serviceId, mode: "store", signal: controller.signal };
    setState({ loading: true, departures: [], routes: [], warnings: [], error: "" });
    const load = async () => {
      const departures = [];
      let page = 1;
      let lastPage = 1;
      do {
        const { data } = await getDepartures(options, { page });
        const collection = departureCollection(data);
        departures.push(...collection.rows);
        lastPage = collection.lastPage;
        page += 1;
      } while (page <= lastPage);
      const warnings = [];
      const used = usedTourRoutes(departures, []);
      if (selectedRouteId && !used.some((route) => String(route.id) === String(selectedRouteId))) used.push({ id: selectedRouteId, departures: [] });
      const routes = await Promise.all(used.map(async (route) => {
        const results = await Promise.allSettled([getTourRoute(options, route.id), getRouteStops(options, route.id)]);
        let record = route;
        let detailError = "";
        try {
          if (results[0].status === "rejected") throw results[0].reason;
          record = { ...route, ...tourRouteRecord(results[0].value.data, route.id) };
        } catch (error) { detailError = departureError(error); }
        return { ...record, detailError,
          stops: results[1].status === "fulfilled" ? tourStopRows(results[1].value) : [],
          error: results[1].status === "rejected" ? departureError(results[1].reason) : "" };
      }));
      if (active) setState({ loading: false, departures, routes, warnings, error: "" });
    };
    load().catch((error) => {
      if (active) setState({ loading: false, departures: [], routes: [], warnings: [], error: departureError(error) });
    });
    return () => { active = false; controller.abort(); };
  }, [branchId, serviceId, revision, selectedRouteId]);

  const changed = (message) => { setNotice(message || "Cambios guardados."); setRevision((value) => value + 1); };

  const editDeparture = async (departure) => {
    if (opening || disabled) return;
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setOpening(true); setActionError("");
    try {
      const { data } = await getDeparture({ ...context, signal: controller.signal }, departure.id);
      if (!controller.signal.aborted) setEditor({ departure: departureRecord(data) });
    } catch (error) { if (!controller.signal.aborted) setActionError(departureError(error)); }
    finally { if (!controller.signal.aborted) setOpening(false); }
  };

  return <Paper variant="outlined" sx={{ ...tourFormControlsSx, mt: embedded ? 0 : 3, p: embedded ? 0 : { xs: 2, sm: 3 }, border: embedded ? 0 : undefined, borderRadius: 3, bgcolor: "#fff", color: "#000", borderTop: embedded ? 0 : "4px solid #f9b233" }}>
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={900}>Rutas, salidas y paradas del tour</Typography>
      {!serviceId ? <Alert severity="info">Guarda el servicio para agregar sus salidas y asociarlas con las rutas disponibles. Después de crearlo continuarás aquí para configurarlo.</Alert> : <>
        <Typography variant="body2">Cada ruta, parada y salida se guarda con su propio botón. Los datos generales se guardan con «Guardar cambios».</Typography>
        {notice && <Alert severity="info" onClose={() => setNotice("")}>{notice}</Alert>}
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Button type="button" variant="contained" disabled={disabled || state.loading || opening} onClick={() => setEditor({ departure: null })}>Nueva salida</Button>
          <Button type="button" disabled={disabled || state.loading || opening} onClick={() => setRevision((value) => value + 1)}>Actualizar rutas y paradas</Button>
          <Button type="button" variant="outlined" disabled={disabled || state.loading || opening} onClick={() => setRouteEditor(true)}>Crear ruta</Button>
        </Stack>
        {catalog.error && <Alert severity="warning">No se pudo consultar el catálogo de rutas: {catalog.error}</Alert>}
        <TextField SelectProps={{ MenuProps: tourMenuProps }} select label="Consultar y administrar otra ruta" value={selectedRouteId} disabled={disabled || catalog.loading || state.loading} helperText="Para asociar una ruta al servicio, selecciónala al crear o editar una salida." onChange={(event) => setSelectedRouteId(event.target.value)}>
          <MenuItem value="">Rutas utilizadas por las salidas</MenuItem>
          {selectedRouteId && !catalog.rows.some((route) => String(route.id) === String(selectedRouteId)) && <MenuItem value={selectedRouteId}>Ruta #{selectedRouteId}</MenuItem>}
          {catalog.rows.map((route) => <MenuItem key={route.id} value={route.id}>{route.name}</MenuItem>)}
        </TextField>
        {actionError && <Alert severity="error">{actionError}</Alert>}
        {opening && <CircularProgress size={24} aria-label="Cargando salida" />}
        {state.loading ? <CircularProgress aria-label="Cargando salidas, rutas y paradas" /> : state.error ? <Alert severity="error">{state.error}</Alert> : <>
          {state.warnings.map((warning) => <Alert key={warning} severity="warning">{warning}</Alert>)}
          <Typography variant="h6" fontWeight={900} sx={{ borderBottom: "2px solid #f9b233", pb: 1 }}>Salidas</Typography>
          {!state.departures.length && <Alert severity="info">Este tour todavía no tiene salidas.</Alert>}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {state.departures.map((departure) => {
              const route = state.routes.find((item) => String(item.id) === String(tourRouteId(departure)));
              return <Box key={departure.id} sx={{ display: "flex", flexDirection: "column", "& > .MuiCard-root": { height: "auto", flex: 1 } }}>
                <DepartureCard departure={{ ...departure, tour_route: route || departure.tour_route || departure.route }} mode="store" />
                <Button type="button" variant="outlined" fullWidth sx={{ mt: 1 }} disabled={disabled || opening} onClick={() => editDeparture(departure)}>Editar salida y ruta asociada</Button>
              </Box>;
            })}
          </Box>
          <Typography variant="h6" fontWeight={800}>Rutas y paradas</Typography>
          {!state.routes.length && <Typography>No hay rutas asociadas a las salidas de este tour.</Typography>}
          {state.routes.map((route) => <TourRouteEditor key={route.id} context={context} route={route} disabled={disabled || opening} onChanged={changed} />)}
        </>}
      </>}
    </Stack>
    {/* Dialogs use a portal, but submit events still bubble through the React tree. */}
    {routeEditor && <Box onSubmit={(event) => event.stopPropagation()}><TourEntityDialog context={context} entity="route" onClose={() => setRouteEditor(false)} onSaved={(record, message) => { setRouteEditor(false); if (record) setSelectedRouteId(record.id); changed(message); }} /></Box>}
    {editor && <Box onSubmit={(event) => event.stopPropagation()}>
      <DepartureFormDialog context={context} departure={editor.departure} onClose={() => setEditor(null)} onSessionExpired={() => navigate("/login-register", { replace: true })} onSaved={() => { setEditor(null); setRevision((value) => value + 1); }} />
    </Box>}
  </Paper>;
}
