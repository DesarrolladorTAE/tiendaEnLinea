import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Pagination, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTienda } from "../../context/TiendaContext";
import { canReceiveTransfer, transferItemName, destinationLabel, transferCollection, transferError, transfersApi } from "../../services/admin/inventoryTransfers";
import { notifyInventoryChanged } from "../../utils/inventoryEvents";
import NewInventoryTransferDialog from "./NewInventoryTransferDialog";
import { warehouseDialogStyles, warehouseGrid, warehousePanel } from "./warehouseStyles";

const statuses = { pending: "En tránsito", accepted: "Aceptado", rejected: "Rechazado" };
const branchName = (row, side, branches = []) => row[`${side}_branch`]?.name || row[`${side}_branch_name`] || row[`${side}_branch_snapshot`]?.name || branches.find(branch => Number(branch.id) === Number(row[`${side}_branch_id`]))?.name || `Sucursal #${row[`${side}_branch_id`] ?? "—"}`;
const folio = row => row.document_name || row.document_title || row.folio || row.transfer_number || row.reference || `Traspaso #${row.id}`;
const array = value => Array.isArray(value) ? value : [];
const date = value => value ? new Date(value).toLocaleString("es-MX") : "—";

export default function InventoryTransfers({ branch, onChanged }) {
  const { tienda } = useTienda();
  const [branches, setBranches] = useState([]); const [branchError, setBranchError] = useState("");
  const [revision, setRevision] = useState(0); const [direction, setDirection] = useState("outgoing"); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, rows: [], lastPage: 1, error: "" });
  const [creating, setCreating] = useState(false); const [selected, setSelected] = useState(null); const [notice, setNotice] = useState("");
  const [folioQuery, setFolioQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setBranchError("");
    transfersApi.branches(tienda?.id, controller.signal).then(rows => { if (!controller.signal.aborted) setBranches(rows); }).catch(e => { if (!controller.signal.aborted) setBranchError(transferError(e)); });
    return () => controller.abort();
  }, [tienda?.id, revision]);
  useEffect(() => {
    const controller = new AbortController(); setState({ loading: true, rows: [], lastPage: 1, error: "" });
    transfersApi.list({ branch_id: branch.id, direction, ...(status ? { status } : {}), page, per_page: 12 }, controller.signal).then(body => {
      if (controller.signal.aborted) return;
      const result = transferCollection(body, "transfers");
      if (page > result.lastPage) { setPage(Math.max(1, result.lastPage)); return; }
      setState({ ...result, loading: false, error: "" });
    }).catch(e => { if (!controller.signal.aborted) setState({ loading: false, rows: [], lastPage: 1, error: transferError(e) }); });
    return () => controller.abort();
  }, [branch.id, direction, status, page, revision]);
  const refresh = () => { setRevision(v => v + 1); notifyInventoryChanged(); onChanged?.(); };
  const visibleRows = state.rows.filter(row => folio(row).toLocaleLowerCase("es").includes(folioQuery.trim().toLocaleLowerCase("es")));
  return <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}><Box><Typography variant="h5" fontWeight={800}>Traspasos entre sucursales</Typography><Typography variant="body2" color="text.secondary">Envía mercancía, revisa recepciones y consulta sus comprobantes.</Typography></Box><Button variant="contained" disabled={!branches.some(row => Number(row.id) !== Number(branch.id) && ![false, 0, "0"].includes(row.is_active))} onClick={() => setCreating(true)}>Nuevo traspaso</Button></Stack>
    {branchError && <Alert severity="error" action={<Button onClick={() => setRevision(v => v + 1)}>Reintentar</Button>}>{branchError}</Alert>}
    {!branchError && branches.length === 1 && <Alert severity="info">Necesitas otra sucursal activa de la misma tienda para crear un traspaso.</Alert>}
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    <Stack direction="row" flexWrap="wrap" gap={1} role="group" aria-label="Consulta de traspasos">{[["outgoing", "Enviados"], ["incoming", "Recibidos"], ["all", "Historial"]].map(([value, label]) => <Button key={value} variant={direction === value ? "contained" : "outlined"} aria-pressed={direction === value} onClick={() => { setDirection(value); setPage(1); }}>{label}</Button>)}</Stack>
    <Stack direction={{ xs: "column", sm: "row" }} gap={1}><TextField select size="small" label="Estado" value={status} sx={{ width: { xs: "100%", sm: 250 } }} onChange={e => { setStatus(e.target.value); setPage(1); }}><MenuItem value="">Todos los estados</MenuItem>{Object.entries(statuses).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField size="small" label="Filtrar folio en esta página" value={folioQuery} onChange={e => setFolioQuery(e.target.value)} /><Button variant="outlined" onClick={() => setRevision(v => v + 1)}>Actualizar</Button></Stack>
    {state.loading ? <CircularProgress aria-label="Cargando traspasos" /> : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{state.error}</Alert> : !visibleRows.length ? <Alert severity="info">No hay traspasos con estos filtros en esta página.</Alert> : <Box sx={warehouseGrid}>{visibleRows.map(row => <Card key={row.id} variant="outlined" sx={{ borderRadius: 3 }}><CardContent><Stack spacing={1.5}>
      <Stack direction="row" gap={1} justifyContent="space-between" flexWrap="wrap"><Typography fontWeight={800}>{folio(row)}</Typography><Chip size="small" label={statuses[row.status] || row.status} color={row.status === "accepted" ? "success" : row.status === "rejected" ? "error" : "warning"} /></Stack>
      <Typography sx={{ overflowWrap: "anywhere" }}>{branchName(row, "source", branches)} → {branchName(row, "destination", branches)}</Typography><Typography variant="body2">Destino: {destinationLabel(row)}</Typography>
      <Typography variant="caption" color="text.secondary">{date(row.created_at)}</Typography>
      <Button variant="outlined" onClick={() => setSelected(row.id)}>Ver detalle y comprobante</Button>
    </Stack></CardContent></Card>)}</Box>}
    {state.lastPage > 1 && <Pagination page={page} count={state.lastPage} size="small" onChange={(_, next) => setPage(next)} />}
    {creating && <NewInventoryTransferDialog key={branch.id} branch={branch} branches={branches} onClose={() => { setCreating(false); setRevision(v => v + 1); }} onSaved={() => { setCreating(false); setPage(1); refresh(); setNotice("Traspaso enviado. Las existencias están en tránsito."); }} />}
    {selected && <TransferDetail id={selected} branchId={branch.id} branches={branches} onClose={() => setSelected(null)} onChanged={refresh} />}
  </Stack>;
}

function TransferDetail({ id, branchId, branches, onClose, onChanged }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [record, setRecord] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  const [action, setAction] = useState(""); const [notes, setNotes] = useState(""); const [busy, setBusy] = useState(false); const [pdf, setPdf] = useState(""); const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRecord(null);
    transfersApi.detail(id, controller.signal).then(row => { if (!controller.signal.aborted) setRecord(row); }).catch(e => { if (!controller.signal.aborted) setError(transferError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf); }, [pdf]);
  const canReceive = canReceiveTransfer(record, branchId);
  const decide = async () => {
    if (pending.current || !canReceive || !action || (action === "reject" && !notes.trim())) return;
    pending.current = true; setBusy(true); setError("");
    try { await transfersApi.decide(id, action, notes.trim()); setAction(""); setNotes(""); setRevision(v => v + 1); onChanged(); }
    catch (e) { setError(transferError(e)); setAction(""); setRecord(null); }
    finally { pending.current = false; setBusy(false); }
  };
  const [pdfAction, setPdfAction] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const document = async download => {
    if (pending.current) return; pending.current = true; setBusy(true); setPdfAction(download ? "download" : "view"); setPdfError(null);
    try {
      const blob = await transfersApi.pdf(id, download); const url = URL.createObjectURL(blob);
      if (download) { const a = window.document.createElement("a"); a.href = url; a.download = `traspaso-${id}.pdf`; window.document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      else setPdf(url);
    } catch (e) { setPdfError({ message: transferError(e), download }); }
    finally { pending.current = false; setBusy(false); setPdfAction(null); }
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="md" onClose={busy ? undefined : onClose} sx={warehouseDialogStyles}>
    <DialogTitle>{record ? folio(record) : `Traspaso #${id}`}</DialogTitle><DialogContent><Stack spacing={2}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button disabled={busy} onClick={() => setRevision(v => v + 1)}>Actualizar</Button>}>{error}</Alert>}
      {pdfError && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button disabled={busy} onClick={() => document(pdfError.download)}>Reintentar PDF</Button>}>{pdfError.message}</Alert>}
      {loading ? <CircularProgress /> : record && <>
        <Chip sx={{ alignSelf: "flex-start" }} label={statuses[record.status] || record.status} color={record.status === "pending" ? "warning" : record.status === "accepted" ? "success" : "error"} />
        <Typography fontWeight={800}>{branchName(record, "source", branches)} → {branchName(record, "destination", branches)}</Typography>
        <Typography>Destino: {destinationLabel(record)}</Typography>
        <Typography variant="body2">Enviado: {date(record.created_at)}</Typography>
        <Typography sx={{ whiteSpace: "pre-wrap" }}>Observaciones: {record.notes || "Sin observaciones"}</Typography>
        <Typography variant="h6" fontWeight={800}>Mercancía</Typography>
        {array(record.items).map((item, index) => <Box key={item.id || index} sx={warehousePanel}><Typography fontWeight={800}>{transferItemName(item)}</Typography><Typography variant="body2">{item.variant_name || item.source_variant_name || item.variant_snapshot?.name || item.source_variant?.name || item.variant?.name || "Producto simple"} · SKU: {item.sku || item.product_sku || item.product?.sku || "—"} · OE: {item.oe || item.oe_number || item.product_snapshot?.oe_number || "—"}</Typography><Typography>Cantidad: {item.quantity} · Origen: {item.source_warehouse?.name || item.source_warehouse_name || (item.source_warehouse_id ? `Almacén #${item.source_warehouse_id}` : "Inventario global")}</Typography></Box>)}
        <Typography variant="h6" fontWeight={800}>Historial de eventos</Typography>
        {!array(record.events).length && <Typography variant="body2">Sin eventos adicionales.</Typography>}
        {array(record.events).map((event, index) => <Box key={event.id || index} sx={warehousePanel}><Typography fontWeight={700}>{statuses[event.action || event.event_type || event.type] || event.action || event.event_type || event.type || "Movimiento"}</Typography><Typography variant="caption">{date(event.created_at)} · {event.actor_name || event.actor?.name || ""}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{event.notes || ""}</Typography></Box>)}
        {record.status === "pending" && !canReceive && <Alert severity="info">Para aceptar o rechazar este traspaso, entra a la sucursal destino: {branchName(record, "destination", branches)} y consulta Recibidos.</Alert>}
        {canReceive && !action && <Stack direction={{ xs: "column", sm: "row" }} gap={1}><Button disabled={busy} variant="contained" onClick={() => { setAction("accept"); setNotes(""); }}>Revisar y aceptar</Button><Button disabled={busy} color="error" variant="outlined" onClick={() => { setAction("reject"); setNotes(""); }}>Rechazar envío</Button></Stack>}
        {canReceive && action && <Box sx={warehousePanel}><Stack spacing={2}><Alert severity="warning">{action === "accept" ? "Se recibirá toda la mercancía en el inventario destino. Revisa las cantidades antes de confirmar." : "Se rechazará el envío completo y las unidades se reintegrarán inmediatamente al inventario de origen."}</Alert><TextField label={action === "reject" ? "Motivo del rechazo (obligatorio)" : "Observaciones de recepción"} required={action === "reject"} multiline minRows={2} value={notes} disabled={busy} onChange={e => setNotes(e.target.value)} /><Stack direction={{ xs: "column", sm: "row" }} gap={1}><Button disabled={busy} onClick={() => setAction("")}>Volver</Button><Button disabled={busy || (action === "reject" && !notes.trim())} color={action === "reject" ? "error" : "primary"} variant="contained" onClick={decide}>{busy ? "Procesando…" : action === "accept" ? "Confirmar recepción completa" : "Confirmar rechazo y reintegro"}</Button></Stack></Stack></Box>}
      </>}
    </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={onClose}>Cerrar</Button><Button disabled={busy || !record} variant="outlined" aria-busy={pdfAction === "view"} startIcon={pdfAction === "view" ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={() => document(false)}>{pdfAction === "view" ? "Generando PDF..." : "Ver PDF"}</Button><Button disabled={busy || !record} variant="contained" aria-busy={pdfAction === "download"} startIcon={pdfAction === "download" ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={() => document(true)}>{pdfAction === "download" ? "Descargando..." : "Descargar PDF"}</Button></DialogActions>
    {pdf && <Dialog open fullScreen={mobile} fullWidth maxWidth="lg" onClose={() => setPdf("")} sx={warehouseDialogStyles}><DialogTitle>Comprobante de traspaso ? {record ? folio(record) : `#${id}`}</DialogTitle><DialogContent><Box component="iframe" title="PDF del traspaso" src={pdf} sx={{ border: 0, width: "100%", height: "70dvh" }} /><Button component="a" href={pdf} target="_blank" rel="noopener noreferrer">Abrir PDF en otra pestaña</Button></DialogContent><DialogActions><Button onClick={() => setPdf("")}>Cerrar PDF</Button></DialogActions></Dialog>}
  </Dialog>;
}
