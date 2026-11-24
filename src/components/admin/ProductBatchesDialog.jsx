import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { batchError, batchExpiryLabel, batchIdentity, decimalQuantity } from "../../utils/batchInventory";
import { hasProductVariants, productStock, usesWarehouses } from "../../utils/productInventory";
import BatchIdentityFields from "./BatchIdentityFields";
import { adminSectionDialog, adminSectionPrimaryAction } from "./AdminSectionOption";

const newKey = () => Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, "0")).join("");
let nextRowId = 0;
const initialRow = () => ({ key: ++nextRowId, expiry_precision: "day" });
const initialSettings = { batch_tracking_enabled: false, expiration_required: false, stock_rotation_policy: "fefo" };
const labelWarehouse = row => row.warehouse_id ? `Almacén #${row.warehouse_id}` : row.branch_id ? "Sin almacén" : "Sin saldo";
const options = [
  ["balances", "Lotes y saldos"], ["settings", "Configuración"], ["opening", "Apertura conciliada"],
  ["create", "Crear lote sin saldo"], ["availability", "Consultar disponibilidad"], ["movements", "Movimientos"], ["adjust", "Ajustar saldo"],
];

export default function ProductBatchesDialog({ product, branchId, onClose, onChanged }) {
  const path = `/admin/products/${product.id}`;
  const [detail, setDetail] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [batches, setBatches] = useState(null);
  const [settings, setSettings] = useState(initialSettings);
  const [mode, setMode] = useState("balances");
  const [entry, setEntry] = useState({});
  const [rows, setRows] = useState(() => [initialRow()]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [movementFilter, setMovementFilter] = useState("");
  const [movements, setMovements] = useState(null);
  const operation = useRef(null);
  const variants = Array.isArray(detail?.variants) ? detail.variants : [];
  const warehouseMode = usesWarehouses(detail);
  const variantMode = hasProductVariants(detail);
  const adjustmentRows = (batches ?? []).filter(row => row.branch_id == null || String(row.branch_id) === String(branchId));
  const adjustmentRow = adjustmentRows.find(row => String(row.id) === entry.batchId && String(row.warehouse_id ?? "") === entry.location);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([
      axiosClient.get(`${path}/batches`, config),
      axiosClient.get(`/admin/productos/${product.id}`, config),
      axiosClient.get(`/branches/${branchId}/warehouses`, config),
    ]).then(([batchResponse, productResponse, warehouseResponse]) => {
      if (controller.signal.aborted) return;
      setBatches(batchResponse.data.data);
      setSettings({ ...initialSettings, ...batchResponse.data.settings });
      setDetail({ ...product, ...(productResponse.data.data ?? productResponse.data) });
      setWarehouses(warehouseResponse.data.data ?? warehouseResponse.data.list ?? []);
    }).catch(err => { if (!controller.signal.aborted) setError(batchError(err)); });
    return () => controller.abort();
  }, [path, product, branchId, revision]);

  useEffect(() => {
    if (mode !== "movements") return undefined;
    const controller = new AbortController();
    setMovements(null);
    axiosClient.get(`${path}/batch-movements`, {
      params: { page, per_page: 20, ...(movementFilter && { batch_id: movementFilter }) }, signal: controller.signal,
    }).then(({ data }) => { if (!controller.signal.aborted) setMovements(data); })
      .catch(err => { if (!controller.signal.aborted) setError(batchError(err)); });
    return () => controller.abort();
  }, [mode, path, page, movementFilter, revision]);

  const selectMode = value => {
    setMode(value);
    setEntry({});
    setError("");
    setMessage("");
  };
  const updateEntry = changes => setEntry(previous => ({ ...previous, ...changes }));
  const operationKey = (kind, payload) => {
    const signature = JSON.stringify([kind, payload]);
    if (operation.current?.signature !== signature) operation.current = { signature, key: `${kind}_${newKey()}` };
    return operation.current.key;
  };
  const getQuantity = value => {
    const quantity = decimalQuantity(value);
    if (!quantity) throw new Error("Ingresa una cantidad positiva con hasta tres decimales.");
    return quantity;
  };
  const dimensions = (row, withWarehouse) => ({
    ...(variantMode && { variant_id: Number(row.variant_id) || null }),
    ...(withWarehouse && warehouseMode && { warehouse_id: Number(row.warehouse_id) || null }),
  });
  const scopeFields = (row, change, withWarehouse) => (
    <>
      {variantMode && <TextField select required label="Variante" value={row.variant_id ?? ""} onChange={e => change({ variant_id: e.target.value })}>
        {variants.map(item => <MenuItem key={item.id} value={item.id}>{item.name || item.sku || `Variante #${item.id}`}</MenuItem>)}
      </TextField>}
      {withWarehouse && warehouseMode && <TextField select required label="Almacén" value={row.warehouse_id ?? ""} onChange={e => change({ warehouse_id: e.target.value })}>
        {warehouses.map(item => <MenuItem key={item.id} value={item.id}>{item.name || `Almacén #${item.id}`}</MenuItem>)}
      </TextField>}
    </>
  );

  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (mode === "availability") {
        const { data } = await axiosClient.get(`${path}/batch-availability`, { params: dimensions(entry, true) });
        setMessage(`Disponible para venta: ${data.data.available}`);
        return;
      }
      let response;
      if (mode === "settings") {
        response = await axiosClient.patch(`${path}/batch-settings`, {
          batch_tracking_enabled: Boolean(settings.batch_tracking_enabled),
          expiration_required: Boolean(settings.expiration_required),
          stock_rotation_policy: settings.stock_rotation_policy,
        });
      } else if (mode === "opening") {
        const entries = rows.map(row => ({
          ...batchIdentity({ ...row, ...(settings.expiration_required && { expiry_precision: "day" }) }),
          ...dimensions(row, true), quantity: getQuantity(row.quantity),
        }));
        response = await axiosClient.post(`${path}/batches/opening`, { entries, operation_key: operationKey("apertura", entries) });
        setRows([initialRow()]);
      } else if (mode === "create") {
        response = await axiosClient.post(`${path}/batches`, { ...batchIdentity(entry), ...dimensions(entry, false) });
        setEntry({});
      } else if (mode === "adjust") {
        const row = adjustmentRow;
        const reason = entry.reason?.trim() || "";
        if (!row || reason.length < 3) throw new Error("Selecciona el lote y escribe un motivo de al menos tres caracteres.");
        const warehouse_id = row.warehouse_id ?? (warehouseMode ? Number(entry.warehouse_id) : null);
        if (warehouseMode && !warehouse_id) throw new Error("Selecciona el almacén del ajuste.");
        const payload = { batch_id: row.id, warehouse_id, movement_type: entry.movement_type ?? "quarantine",
          quantity: getQuantity(entry.quantity), reason };
        response = await axiosClient.post("/batch-adjustments", { ...payload, operation_key: operationKey("ajuste", payload) });
        setEntry({});
      }
      operation.current = null;
      setMessage(response?.data?.message || "Cambios guardados.");
      setRevision(value => value + 1);
      onChanged?.();
    } catch (err) {
      setError(batchError(err));
    } finally {
      setSaving(false);
    }
  };

  const editable = !["balances", "movements"].includes(mode);
  const uniqueBatches = [...new Map((batches ?? []).map(row => [row.id, row])).values()];
  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md" sx={adminSectionDialog} aria-labelledby="product-batches-title">
      <DialogTitle id="product-batches-title">Lotes · {product.name}</DialogTitle>
      <DialogContent dividers>
        <Stack gap={2} sx={{ pt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          {!batches ? (error ? <Button onClick={() => { setError(""); setRevision(value => value + 1); }}>Reintentar</Button> : <CircularProgress size={24} />) : <>
            <TextField select label="Sección" value={mode} disabled={saving} onChange={event => selectMode(event.target.value)}>
              {options.map(([value, label]) => <MenuItem key={value} value={value}
                disabled={["create", "availability", "adjust"].includes(value) && !settings.batch_tracking_enabled}>{label}</MenuItem>)}
            </TextField>
            {mode === "balances" && <>
              <Typography variant="body2" color="text.secondary">Control por lotes {settings.batch_tracking_enabled ? "activo" : "inactivo"}. Los saldos físicos incluyen reservas y cuarentena.</Typography>
              {batches.length === 0 && <Typography>Sin lotes registrados.</Typography>}
              {batches.map((row, index) => <Paper variant="outlined" key={`${row.id}-${index}`} sx={{ p: 1.5, overflowWrap: "anywhere" }}>
                <Typography fontWeight={800}>{row.batch_number} · {labelWarehouse(row)}</Typography>
                <Typography variant="body2">Caducidad: {batchExpiryLabel(row)} · Estado: {row.status} {row.variant_id ? `· Variante #${row.variant_id}` : ""}</Typography>
                <Typography variant="body2">Físico: {row.on_hand_qty ?? "—"} · Reservado: {row.reserved_qty ?? "—"} · Cuarentena: {row.quarantine_qty ?? "—"}</Typography>
              </Paper>)}
            </>}
            {mode === "movements" && <>
              <TextField select label="Lote" value={movementFilter} onChange={e => { setMovementFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Todos los lotes</MenuItem>
                {uniqueBatches.map(row => <MenuItem key={row.id} value={row.id}>{row.batch_number}</MenuItem>)}
              </TextField>
              {!movements && !error && <CircularProgress size={24} />}
              {movements?.data?.length === 0 && <Typography>Sin movimientos registrados.</Typography>}
              {movements?.data?.map(row => <Paper variant="outlined" key={row.id} sx={{ p: 1.5, overflowWrap: "anywhere" }}>
                <Typography fontWeight={800}>{row.batch_number} · {row.movement_type}</Typography>
                <Typography variant="body2">{row.occurred_at} · {labelWarehouse(row)}{row.reason ? ` · ${row.reason}` : ""}</Typography>
                <Typography variant="body2">Físico: {row.delta_on_hand} · Reservado: {row.delta_reserved} · Cuarentena: {row.delta_quarantine}</Typography>
              </Paper>)}
              {movements?.last_page > 1 && <Pagination count={movements.last_page} page={page} onChange={(_, value) => setPage(value)} />}
            </>}
            {editable && <Stack component="form" id="product-batches-form" onSubmit={submit} gap={2}>
              {mode === "settings" && <>
                <Alert severity="info">Si el producto ya tiene existencias, usa Apertura conciliada para activar el control por lotes.</Alert>
                <FormControlLabel label="Control por lotes" control={<Checkbox checked={Boolean(settings.batch_tracking_enabled)}
                  onChange={e => setSettings(previous => ({ ...previous, batch_tracking_enabled: e.target.checked }))} />} />
                <FormControlLabel label="Caducidad obligatoria" control={<Checkbox checked={Boolean(settings.expiration_required)}
                  onChange={e => setSettings(previous => ({ ...previous, expiration_required: e.target.checked }))} />} />
                <TextField select label="Rotación" value={settings.stock_rotation_policy}
                  onChange={e => setSettings(previous => ({ ...previous, stock_rotation_policy: e.target.value }))}>
                  <MenuItem value="fefo">FEFO · Primero en caducar</MenuItem><MenuItem value="fifo">FIFO · Primero en entrar</MenuItem>
                </TextField>
              </>}
              {mode === "opening" && <>
                <Alert severity="info">Distribuye todas las existencias actuales entre lotes. Las cantidades deben cuadrar por variante y ubicación.</Alert>
                {rows.map((row, index) => {
                  const change = values => setRows(previous => previous.map(item => item.key === row.key ? { ...item, ...values } : item));
                  const target = (!variantMode || row.variant_id) && (!warehouseMode || row.warehouse_id)
                    ? productStock(detail, { variantId: row.variant_id || null, warehouseId: row.warehouse_id || null }) : null;
                  return <Paper key={row.key} variant="outlined" sx={{ p: 1.5 }}><Stack gap={1.5}>
                    <Typography fontWeight={800}>Partida {index + 1}</Typography>
                    {scopeFields(row, change, true)}
                    {target != null && <Typography variant="body2" color="text.secondary">Saldo agregado de esta ubicación: {target}</Typography>}
                    <BatchIdentityFields value={row} onChange={change} exactOnly={Boolean(settings.expiration_required)} disabled={saving} />
                    <TextField required label="Cantidad conciliada" value={row.quantity ?? ""} inputProps={{ inputMode: "decimal" }}
                      onChange={e => change({ quantity: e.target.value })} />
                    {rows.length > 1 && <Button onClick={() => setRows(previous => previous.filter(item => item.key !== row.key))}>Quitar partida</Button>}
                  </Stack></Paper>;
                })}
                <Button variant="outlined" disabled={rows.length >= 500} onClick={() => setRows(previous => [...previous, initialRow()])}>Agregar partida</Button>
              </>}
              {mode === "create" && <>{scopeFields(entry, updateEntry, false)}<BatchIdentityFields value={entry} onChange={updateEntry} disabled={saving} /></>}
              {mode === "availability" && <>{scopeFields(entry, updateEntry, true)}<Typography variant="body2">Consulta el saldo vendible confirmado por el servidor.</Typography></>}
              {mode === "adjust" && <>
                <TextField select required label="Lote y ubicación" value={entry.batchId ? `${entry.batchId}:${entry.location}` : ""}
                  onChange={e => { const [batchId, location] = e.target.value.split(":"); updateEntry({ batchId, location, warehouse_id: "" }); }}>
                  {adjustmentRows.map(row => <MenuItem key={`${row.id}:${row.warehouse_id ?? ""}`} value={`${row.id}:${row.warehouse_id ?? ""}`}>
                    {row.batch_number} · {labelWarehouse(row)}{row.variant_id ? ` · Variante #${row.variant_id}` : ""}
                  </MenuItem>)}
                </TextField>
                {warehouseMode && adjustmentRow && adjustmentRow.warehouse_id == null && (
                  <TextField select required label="Almacén del ajuste" value={entry.warehouse_id ?? ""} onChange={e => updateEntry({ warehouse_id: e.target.value })}>
                    {warehouses.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                  </TextField>
                )}
                <TextField select label="Movimiento" value={entry.movement_type ?? "quarantine"} onChange={e => updateEntry({ movement_type: e.target.value })}>
                  <MenuItem value="increase">Aumentar saldo</MenuItem><MenuItem value="decrease">Disminuir saldo</MenuItem>
                  <MenuItem value="quarantine">Enviar a cuarentena</MenuItem><MenuItem value="release">Liberar cuarentena</MenuItem>
                </TextField>
                <TextField required label="Cantidad" value={entry.quantity ?? ""} inputProps={{ inputMode: "decimal" }} onChange={e => updateEntry({ quantity: e.target.value })} />
                <TextField required label="Motivo" value={entry.reason ?? ""} inputProps={{ maxLength: 500 }} onChange={e => updateEntry({ reason: e.target.value })} />
              </>}
            </Stack>}
          </>}
        </Stack>
      </DialogContent>
      <DialogActions disableSpacing>
        <Button onClick={onClose} disabled={saving}>Cerrar</Button>
        {batches && editable && <Button type="submit" form="product-batches-form" variant="contained" sx={adminSectionPrimaryAction} disabled={saving}>
          {saving ? "Procesando…" : mode === "availability" ? "Consultar" : "Guardar"}
        </Button>}
      </DialogActions>
    </Dialog>
  );
}
