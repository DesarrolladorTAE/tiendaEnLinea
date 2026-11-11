import React, { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { vehicleRange } from "../../utils/vehicleCompatibility";
export default function VehicleDetailsDialog({ product, branchId, onClose }) {
  const [state, setState] = useState({ loading: true, rows: [], error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, rows: [], error: "" });
    axiosClient.get(`/admin/products/${product.id}/vehicle-compatibilities`, { params: { branch_id: branchId }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setState({ loading: false, rows: data.data?.vehicle_compatibilities || [], error: "" }); })
      .catch(() => { if (!controller.signal.aborted) setState({ loading: false, rows: [], error: "No se pudieron cargar las compatibilidades." }); });
    return () => controller.abort();
  }, [product.id, branchId, revision]);
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
    <DialogTitle>Compatibilidades vehiculares</DialogTitle><DialogContent>
      <Typography fontWeight={700} sx={{ mb: 2 }}>{product.name} · {product.sku}</Typography>
      {state.loading ? <CircularProgress aria-label="Cargando compatibilidades" /> : state.error ? <Alert severity="error">{state.error}<Button onClick={() => setRevision(v => v + 1)}>Reintentar</Button></Alert> : state.rows.length ? <Stack spacing={1}>{state.rows.map((row, i) => <Alert icon={false} severity="info" key={row.id || i}><strong>{row.vehicle_brand} {row.vehicle_model}</strong><Typography variant="body2">{vehicleRange(row)}</Typography></Alert>)}</Stack> : <Typography>Sin compatibilidades registradas</Typography>}
    </DialogContent><DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>;
}
