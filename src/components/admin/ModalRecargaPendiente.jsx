// src/components/admin/ModalRecargaPendiente.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack
} from "@mui/material";

const ModalRecargaPendiente = ({ open, onClose, recarga, onConfirmar, onRechazar }) => {
  if (!recarga) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revisión de Recarga Manual</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography><strong>Usuario:</strong> {recarga.user?.name}</Typography>
          <Typography><strong>Monto:</strong> ${recarga.monto}</Typography>
          <Typography><strong>Referencia:</strong> {recarga.referencia}</Typography>
          <Typography><strong>Fecha:</strong> {new Date(recarga.fecha_envio).toLocaleString()}</Typography>
          {recarga.comprobante && (
            <>
              <Typography><strong>Comprobante:</strong></Typography>
              <img src={recarga.comprobante} alt="Comprobante" style={{ width: "100%", borderRadius: 8 }} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => onRechazar(recarga.id)}>❌ Rechazar</Button>
        <Button color="success" onClick={() => onConfirmar(recarga.id)}>💰 Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRecargaPendiente;
