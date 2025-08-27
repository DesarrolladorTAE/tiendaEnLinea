// src/pages/superadmin/components/TimbrarPGModal.jsx
import React, { useMemo, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Divider } from "@mui/material";
import dayjs from "dayjs";
import axios from "../../../config/axiosSuperadmin";

export default function TimbrarPGModal({ open, onClose, seleccion, onOk, onError, rowsAll = [] }) {
  const [loading, setLoading] = useState(false);

  // resumen (opcional) para mostrar totales y conteo por tienda
  const { total, porTienda } = useMemo(() => {
    const setSel = new Set(seleccion);
    const elegidas = rowsAll.filter(r => setSel.has(r.id));
    const total = elegidas.reduce((acc, it) => acc + Number(it.monto || 0), 0);
    const mapa = {};
    elegidas.forEach(it => { mapa[it.tienda] = (mapa[it.tienda] || 0) + 1; });
    return { total, porTienda: mapa };
  }, [seleccion, rowsAll]);

  const enviar = async () => {
    setLoading(true);
    try {
      const payload = { subscription_ids: seleccion };
      const res = await axios.post("admin/timbrar-pg", payload);
      if (res?.data?.ok) {
        onOk(`PG timbrado folio ${res.data.folio}`);
        onClose();
      } else {
        onError(res?.data?.message || "Error al timbrar PG");
      }
    } catch (e) {
      console.error(e);
      onError("Error al timbrar PG");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar timbrado a Público en General</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Se agruparán <b>{seleccion.length}</b> suscripciones en un solo CFDI a Público en General.
          </Typography>
          <Typography variant="body2">Total estimado: <b>${total.toFixed(2)} MXN</b></Typography>
          {!!Object.keys(porTienda).length && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">Conteo por tienda:</Typography>
              {Object.entries(porTienda).map(([t, c]) => (
                <Typography key={t} variant="caption">• {t}: {c}</Typography>
              ))}
            </>
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Solo se timbra si cada suscripción sigue dentro de su mes de compra (hasta {dayjs().endOf("month").format("DD MMM YYYY")} según su fecha).
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={enviar} variant="contained" disabled={loading || seleccion.length === 0}>
          {loading ? "Timbrando..." : "Timbrar PG"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
