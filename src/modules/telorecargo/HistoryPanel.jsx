import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { telorecargoPOS, telorecargoStore, downloadRechargeTicket } from "./service";
import { complete, entity, errorMessage, filtersValid, initialDates, money, statusMeta } from "./model";

export function OperationStatus({ operation }) {
  const [label, color] = statusMeta(operation);
  return <Chip size="small" label={label} color={color} variant="outlined" sx={{ maxWidth: "100%", height: "auto", minHeight: 26, "& .MuiChip-label": { whiteSpace: "normal", py: .5 } }} />;
}

export default function HistoryPanel({ mode = "pos", funding = false, onOperation, onFiltersChange, revision = 0 }) {
  const mobile = useMediaQuery("(max-width:899px)");
  const [filters, setFilters] = useState(initialDates);
  const [applied, setApplied] = useState(initialDates);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("");
  const [externalId, setExternalId] = useState("");
  const [resolution, setResolution] = useState("devuelto");
  const [note, setNote] = useState("");
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => { onFiltersChange?.(applied); }, [applied, onFiltersChange]);
  useEffect(() => {
    let alive = true; setBusy(true); setError(""); setResult(null);
    const params = Object.fromEntries(Object.entries({ ...applied, page, per_page: 20 }).filter(([, value]) => value !== ""));
    const request = mode === "store" ? telorecargoStore.history(params) : funding ? telorecargoPOS.fundingHistory(params) : telorecargoPOS.history(params);
    request.then((data) => { if (alive) setResult(data?.data?.current_page ? data.data : data); }).catch((err) => { if (alive) setError(errorMessage(err)); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [mode, funding, applied, page, reload, revision]);

  const change = (key) => (event) => setFilters({ ...filters, [key]: event.target.value });
  async function openDetail(row) {
    setSelected(row); setAction(""); setDetailError(""); setExternalId(""); setNote("");
    if (mode !== "pos") return;
    setDetailBusy(true);
    try {
      const value = entity(await (funding ? telorecargoPOS.fundingDetail(row.id) : telorecargoPOS.detail(row.id)));
      setSelected(value); await onOperation?.(value, funding); setReload((value) => value + 1);
    } catch (err) { setDetailError(errorMessage(err)); }
    finally { setDetailBusy(false); }
  }
  async function manage(event) {
    event.preventDefault(); setDetailBusy(true); setDetailError("");
    try {
      const response = action === "reconcile" ? await telorecargoStore.reconcile(selected.id, externalId.trim()) : await telorecargoStore.resolvePayment(selected.id, resolution, note.trim());
      const value = entity(response); setSelected(value?.id ? value : null); setAction(""); setReload((value) => value + 1);
    } catch (err) { setDetailError(errorMessage(err)); }
    finally { setDetailBusy(false); }
  }
  const ticket = async (row) => { setDetailError(""); setDetailBusy(true); try { await downloadRechargeTicket(row.id); } catch (err) { setDetailError(errorMessage(err)); } finally { setDetailBusy(false); } };
  const rows = Array.isArray(result?.data) ? result.data : [];
  const name = (row) => row.nombre || (row.tipo === "solicitud_saldo" ? "Solicitud de saldo" : row.producto || "Recarga");
  const amount = (row) => row.tipo === "solicitud_saldo" ? row.monto : row.total_cobrar;

  return <Stack spacing={2}>
    <Box component="form" onSubmit={(event) => { event.preventDefault(); try { filtersValid(filters); setError(""); setPage(1); setApplied({ ...filters }); } catch (err) { setError(err.message); } }} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))" }, gap: 1.5 }}>
      <TextField type="date" required label="Desde" value={filters.desde} onChange={change("desde")} InputLabelProps={{ shrink: true }} />
      <TextField type="date" required label="Hasta" value={filters.hasta} onChange={change("hasta")} InputLabelProps={{ shrink: true }} />
      <TextField select label="Estado" value={filters.status} onChange={change("status")}><MenuItem value="">Todos</MenuItem>{["confirmada", "procesando", "en_revision", "reintentable", "rechazada", "pendiente", "confirmado"].map((status) => <MenuItem value={status} key={status}>{statusMeta({ status, sale_id: status === "confirmada" ? 1 : null })[0]}</MenuItem>)}</TextField>
      {mode === "store" && [["pos_location_id", "ID del POS"], ["branch_id", "ID de sucursal"], ["worker_id", "ID del trabajador"]].map(([key, label]) => <TextField key={key} type="number" inputProps={{ min: 1, step: 1 }} label={label} value={filters[key] || ""} onChange={change(key)} />)}
      <Button type="submit" variant="contained" disabled={busy}>Aplicar filtros</Button><Button disabled={busy} onClick={() => setReload((value) => value + 1)}>Actualizar historial</Button>
    </Box>
    {error && <Alert severity="error">{error}</Alert>}
    {(error.includes("La sesión venció") || detailError.includes("La sesión venció")) && <Button component="a" href={mode === "store" ? "/login-register" : "/prueba/pos"}>Iniciar sesión nuevamente</Button>}
    {busy && <Typography role="status">Consultando operaciones…</Typography>}
    {!busy && !rows.length && !error && <Alert severity="info">No hay operaciones en este periodo.</Alert>}
    {mobile ? <Stack spacing={1.5}>{rows.map((row) => <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}><Stack spacing={1}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={800}>{name(row)} · #{row.id}</Typography><Typography fontWeight={800}>{money(amount(row))}</Typography></Stack><OperationStatus operation={row} /><Typography variant="body2">{row.referencia} · {row.created_at}</Typography>{mode === "store" && <Typography variant="body2">{row.pos_name} · {row.worker_name || "Sin vendedor"}</Typography>}<Button onClick={() => openDetail(row)}>Ver detalle / actualizar</Button></Stack></Paper>)}</Stack> : <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>{["Operación", "Fecha", "Teléfono / referencia", "POS / vendedor", "Recarga / abono", "Comisión", "Total", "Estado", ""].map((label, index) => <TableCell key={index}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{name(row)} #{row.id}</TableCell><TableCell>{row.created_at}</TableCell><TableCell>{row.referencia}</TableCell><TableCell>{row.pos_name}<br />{row.worker_name || "Sin vendedor"}</TableCell><TableCell>{money(row.importe_recarga ?? row.monto)}</TableCell><TableCell>{row.tipo === "solicitud_saldo" ? "—" : money(row.comision)}</TableCell><TableCell>{money(amount(row))}</TableCell><TableCell><OperationStatus operation={row} /></TableCell><TableCell><Button onClick={() => openDetail(row)}>Detalle</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
    {result?.last_page > 1 && <Stack direction="row" gap={1} justifyContent="space-between" alignItems="center"><Button disabled={busy || page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Typography variant="body2">{page} / {result.last_page} · {result.total} operaciones</Typography><Button disabled={busy || page >= result.last_page} onClick={() => setPage((value) => value + 1)}>Siguiente</Button></Stack>}
    <Dialog open={Boolean(selected)} onClose={detailBusy ? undefined : () => setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>Operación local #{selected?.id}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <OperationStatus operation={selected} />{detailError && <Alert severity="error">{detailError}</Alert>}
      <Typography>{selected?.nombre || selected?.producto} · {selected?.referencia}</Typography>
      <Typography>POS: {selected?.pos_name || selected?.pos_location_id} · Vendedor: {selected?.worker_name || "Sin asignar"}</Typography>
      <Typography>Recarga / abono: {money(selected?.importe_recarga ?? selected?.monto)} · Comisión: {money(selected?.comision)} · Total: {money(amount(selected || {}))}</Typography>
      <Typography variant="body2">Venta: {selected?.sale_id || "Sin venta registrada"} · Transacción externa: {selected?.external_id || "No disponible"} · Folio: {selected?.folio_proveedor || "No disponible"}</Typography>
      {selected?.pagos?.map((payment, index) => <Typography key={index} variant="body2">{payment.method}: {money(payment.amount)} {payment.referencia ? `· ${payment.referencia}` : ""}</Typography>)}
      {selected?.resolucion_cobro && <Alert severity="info">Cobro resuelto: {selected.resolucion_cobro} · {selected.cobro_resuelto_at}</Alert>}
      {mode === "pos" && <Button disabled={detailBusy} onClick={() => openDetail(selected)}>Consultar estado / recuperar venta</Button>}
      {mode === "pos" && complete(selected) && <Button disabled={detailBusy} onClick={() => ticket(selected)}>Descargar ticket PDF</Button>}
      {mode === "store" && selected?.tipo === "recarga" && !complete(selected) && selected.status !== "rechazada" && <Button disabled={detailBusy} onClick={() => setAction("reconcile")}>Conciliar con transacción conocida</Button>}
      {mode === "store" && selected?.tipo === "recarga" && selected.status === "rechazada" && !selected.sale_id && !selected.resolucion_cobro && <Button disabled={detailBusy} onClick={() => setAction("resolve")}>Registrar resolución del cobro</Button>}
      {action && <Box component="form" onSubmit={manage}><Stack spacing={2}>
        {action === "reconcile" ? <><Alert severity="info">Revisa primero Telorecargo/Taecel. Esta acción verifica la transacción conocida; no realiza otra recarga.</Alert><TextField required label="ID real de la transacción externa" value={externalId} onChange={(event) => setExternalId(event.target.value)} /></> : <><Alert severity="warning">Registra esto únicamente después de devolver realmente el dinero o verificar que no fue cobrado. No ejecuta un reembolso bancario.</Alert><TextField select label="Resolución realizada" value={resolution} onChange={(event) => setResolution(event.target.value)}><MenuItem value="devuelto">Dinero devuelto</MenuItem><MenuItem value="no_cobrado">No se cobró</MenuItem></TextField><TextField label="Nota" required multiline inputProps={{ maxLength: 1000 }} value={note} onChange={(event) => setNote(event.target.value)} /></>}
        <Button type="submit" variant="contained" disabled={detailBusy}>Confirmar {action === "reconcile" ? "conciliación" : "constancia del cobro"}</Button>
      </Stack></Box>}
    </Stack></DialogContent><DialogActions><Button disabled={detailBusy} onClick={() => setSelected(null)}>Cerrar</Button></DialogActions></Dialog>
  </Stack>;
}
