// src/components/admin/DetalleTransaccion.jsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent,
  Typography, Stack
} from "@mui/material";

const DetalleTransaccion = ({ open, onClose, transaccion }) => {
  if (!transaccion) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle de Transacción #{transaccion.id}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography><strong>ID Usuario:</strong> {transaccion.user_id ?? "No asignado"}</Typography>
          <Typography><strong>Monto:</strong> ${parseFloat(transaccion.monto).toFixed(2)}</Typography>
          <Typography><strong>Estado:</strong> {transaccion.estado}</Typography>
          <Typography><strong>Tipo de Pago:</strong> {transaccion.tipo_pago}</Typography>
          <Typography><strong>Referencia:</strong> {transaccion.referencia || "N/A"}</Typography>
          <Typography><strong>Fecha de Solicitud:</strong> {new Date(transaccion.created_at).toLocaleString()}</Typography>
          {transaccion.comprobante && (
            <>
              <Typography><strong>Comprobante:</strong></Typography>
              <img
                src={transaccion.comprobante}
                alt="Comprobante"
                style={{ width: "100%", borderRadius: 8 }}
              />
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleTransaccion;
