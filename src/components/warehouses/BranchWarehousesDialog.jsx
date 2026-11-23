import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTienda } from "../../context/TiendaContext";
import { transferError, transfersApi } from "../../services/admin/inventoryTransfers";
import { warehouseDialogStyles, warehouseGrid, warehousePanel } from "./warehouseStyles";

export default function BranchWarehousesDialog({ currentBranch, onClose, onSelect }) {
  const { tienda } = useTienda();
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [branches, setBranches] = useState([]); const [branchId, setBranchId] = useState(String(currentBranch.id));
  const [rows, setRows] = useState([]); const [loadingBranches, setLoadingBranches] = useState(true); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoadingBranches(true); setError("");
    transfersApi.branches(tienda?.id, controller.signal).then(data => { if (!controller.signal.aborted) setBranches(data); }).catch(e => { if (!controller.signal.aborted) setError(transferError(e)); }).finally(() => { if (!controller.signal.aborted) setLoadingBranches(false); });
    return () => controller.abort();
  }, [tienda?.id, revision]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setRows([]);
    transfersApi.warehouses(branchId, controller.signal).then(data => { if (!controller.signal.aborted) setRows(data); }).catch(e => { if (!controller.signal.aborted) setError(transferError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [branchId, revision]);
  const branch = branches.find(row => String(row.id) === branchId);
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="md" onClose={onClose} sx={warehouseDialogStyles}><DialogTitle>Sucursales y almacenes de tu tienda</DialogTitle><DialogContent><Stack spacing={2}>
    {error && <Alert severity="error" action={<Button onClick={() => setRevision(v => v + 1)}>Reintentar</Button>}>{error}</Alert>}
    <TextField select size="small" label="Sucursal" value={branches.some(row => String(row.id) === branchId) ? branchId : ""} disabled={loadingBranches} onChange={e => { setBranchId(String(e.target.value)); setError(""); }}>{branches.map(row => <MenuItem key={row.id} value={String(row.id)}>{row.name || `Sucursal #${row.id}`}{[false, 0, "0"].includes(row.is_active) ? " · Inactiva" : ""}</MenuItem>)}</TextField>
    {loading || loadingBranches ? <CircularProgress /> : !rows.length ? <Alert severity="info">Esta sucursal no tiene almacenes.</Alert> : <Box sx={warehouseGrid}>{rows.map(row => <Box key={row.id} sx={warehousePanel}><Typography fontWeight={800}>{row.name}</Typography><Typography variant="body2">{row.code || "Sin código"} · {[false, 0, "0"].includes(row.is_active) ? "Inactivo" : "Activo"}</Typography><Typography variant="body2" color="text.secondary">{[row.address_line1, row.city, row.state].filter(Boolean).join(", ") || "Dirección de sucursal"}</Typography></Box>)}</Box>}
  </Stack></DialogContent><DialogActions><Button onClick={onClose}>Cerrar</Button><Button variant="contained" disabled={!branch || loadingBranches} onClick={() => onSelect(branch)}>Trabajar en esta sucursal</Button></DialogActions></Dialog>;
}
