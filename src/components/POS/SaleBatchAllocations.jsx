import React, { useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClientPOS";
import { batchError, batchExpiryLabel, fetchSaleBatchAllocations } from "../../utils/batchInventory";

export default function SaleBatchAllocations({ saleId, lines }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const rows = await fetchSaleBatchAllocations(axiosClient, saleId);
      setItems(rows.filter(row => row.batches.length));
    } catch (err) {
      setError(batchError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack gap={1}>
        {!items && <Button onClick={load} disabled={busy} sx={{ alignSelf: "flex-start", textTransform: "none" }}>
          {busy ? "Consultando lotes…" : "Ver lotes de la venta"}
        </Button>}
        {error && <Alert severity="error">{error}</Alert>}
        {items?.length === 0 && <Typography variant="body2">Esta venta no registró asignaciones de lotes.</Typography>}
        {items?.map(row => {
          const line = lines.find(item => String(item.id ?? item.sale_item_id) === String(row.sale_item_id));
          return <Stack key={row.sale_item_id} gap={0.5}>
            <Typography fontWeight={800}>{line?.product?.name || line?.product_name || `Producto #${row.product_id}`}</Typography>
            {row.batches.map((batch, index) => <Typography key={`${batch.batch_id}-${index}`} variant="body2">
              {batch.batch_number} · Caducidad {batchExpiryLabel(batch)} · {batch.warehouse_id ? `Almacén #${batch.warehouse_id}` : "Sin almacén"} ·
              Vendido: {batch.quantity} · Devuelto: {batch.returned_qty} · Pendiente: {batch.remaining_qty}
            </Typography>)}
          </Stack>;
        })}
      </Stack>
    </Paper>
  );
}
