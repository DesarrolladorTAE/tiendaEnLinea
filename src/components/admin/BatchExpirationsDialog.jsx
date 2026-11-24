import React, { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { batchError, batchExpiryLabel } from "../../utils/batchInventory";
import { adminSectionDialog } from "./AdminSectionOption";

export default function BatchExpirationsDialog({ branchId, onClose }) {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState("");
  const [days, setDays] = useState(30);
  const [daysInput, setDaysInput] = useState("30");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [warehouseError, setWarehouseError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    axiosClient.get(`/branches/${branchId}/warehouses`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setWarehouses(data.data ?? data.list ?? []); })
      .catch(err => { if (!controller.signal.aborted) setWarehouseError(batchError(err)); });
    return () => controller.abort();
  }, [branchId]);

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError("");
    axiosClient.get("/batch-expirations", { params: { branch_id: branchId, days, page, per_page: 20, ...(warehouse && { warehouse_id: warehouse }) }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setResult(data); })
      .catch(err => { if (!controller.signal.aborted) setError(batchError(err)); });
    return () => controller.abort();
  }, [branchId, days, page, warehouse, revision]);

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" sx={adminSectionDialog} aria-labelledby="batch-expirations-title">
      <DialogTitle id="batch-expirations-title">Caducidades de la sucursal</DialogTitle>
      <DialogContent dividers>
        <Stack gap={2} sx={{ pt: 0.5 }}>
          {warehouseError && <Alert severity="warning">El filtro por almacén no está disponible. {warehouseError}</Alert>}
          <Stack component="form" direction={{ xs: "column", sm: "row" }} gap={1.5} onSubmit={event => {
            event.preventDefault();
            if (!/^\d+$/.test(daysInput) || Number(daysInput) > 365) return;
            setDays(Number(daysInput));
            setPage(1);
            setRevision(value => value + 1);
          }}>
            <TextField type="number" fullWidth required label="Días por consultar" helperText="Incluye lotes vencidos. Usa 0 para consultar hasta hoy."
              value={daysInput} onChange={e => setDaysInput(e.target.value)} inputProps={{ min: 0, max: 365, step: 1 }} />
            <TextField select fullWidth label="Almacén" value={warehouse}
              helperText={warehouse ? "Incluye lotes sin almacén asignado de esta sucursal." : undefined}
              onChange={e => { setWarehouse(e.target.value); setPage(1); }}>
              <MenuItem value="">Todas las ubicaciones</MenuItem>
              {warehouses.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
            </TextField>
            <Button type="submit" sx={{ alignSelf: { sm: "flex-start" } }}>Consultar</Button>
          </Stack>
          {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setRevision(value => value + 1)}>Reintentar</Button>}>{error}</Alert>}
          {!result && !error && <CircularProgress size={24} />}
          {result?.data?.length === 0 && <Typography>Sin caducidades registradas en este periodo.</Typography>}
          {result?.data?.map((row, index) => <Paper variant="outlined" key={`${row.batch_id}-${index}`} sx={{ p: 1.5, overflowWrap: "anywhere" }}>
            <Typography fontWeight={800}>{row.name} · {row.batch_number}</Typography>
            <Typography variant="body2">{batchExpiryLabel(row)} · {row.expiry_precision !== "day" || !row.expires_on
              ? "Fecha exacta sin confirmar" : row.expires_on.slice(0, 10) <= today ? "Vencido" : "Próximo a vencer"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {row.sku || "Sin SKU"} · {row.warehouse_id == null ? "Sin almacén asignado" : warehouses.find(item => String(item.id) === String(row.warehouse_id))?.name || `Almacén #${row.warehouse_id}`} · Físico: {row.on_hand_qty} · Cuarentena: {row.quarantine_qty}
            </Typography>
          </Paper>)}
          {result?.last_page > 1 && <Pagination count={result.last_page} page={page} onChange={(_, value) => setPage(value)} />}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  );
}
