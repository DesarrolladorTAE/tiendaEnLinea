import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";

const ModalTimbrado = ({
  open,
  onClose,
  compra,
  onTimbrar,
  timbrando,
  timbradoOk,
  error
}) => {
  if (!compra) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongIcon color="primary" />
        Facturar Compra
        <Box flex={1} />
        <Button onClick={onClose} size="small" color="inherit" sx={{ minWidth: 0 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          <strong>Monto:</strong> ${parseFloat(compra.monto).toFixed(2)}
        </Typography>
        <Typography gutterBottom>
          <strong>Referencia:</strong> {compra.referencia}
        </Typography>
        <Typography gutterBottom>
          <strong>Fecha:</strong> {new Date(compra.created_at).toLocaleString()}
        </Typography>
        <Typography gutterBottom>
          <strong>Estatus:</strong> {compra.status}
        </Typography>

        {/* Aquí puedes pedir el RFC, mostrar preview, o cualquier campo extra */}
        <Box my={2}>
          <Typography color="info.main" variant="body2">
            Para emitir la factura asegúrate de tener tus datos fiscales correctos, ya qe no podras timbrar esta compra una seguda vez.
          </Typography>
          <Typography color="info.main" variant="body2">
            Si presentas problemas, contacta a soporte.
          </Typography>
        </Box>

        {timbrando && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={22} />
            <Typography variant="body2">Facturando, espera un momento…</Typography>
          </Box>
        )}

        {timbradoOk && (
          <Typography color="success.main" sx={{ mt: 2 }}>
            🎉 ¡La compra ha sido facturada correctamente!
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            ⚠️ {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={() => onTimbrar(compra)}
          variant="contained"
          color="primary"
          disabled={timbrando || timbradoOk}
          startIcon={<ReceiptLongIcon />}
        >
          Facturar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalTimbrado;
