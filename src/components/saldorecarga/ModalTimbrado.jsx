import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import axios from "../../axiosConfig";
import Swal from "sweetalert2";

const usosCfdi = [
  { value: "G01", label: "Adquisición de mercancías" },
  { value: "G03", label: "Gastos en general" },
  { value: "S01", label: "Sin efectos fiscales" },
];

const ModalTimbrado = ({ open, onClose, compra, onFacturada }) => {
  const [timbrando, setTimbrando] = useState(false);
  const [timbradoOk, setTimbradoOk] = useState(false);
  const [error, setError] = useState("");
  const [usoCfdi, setUsoCfdi] = useState("G03");

  useEffect(() => {
    if (!open) {
      setTimbrando(false);
      setTimbradoOk(false);
      setError("");
      setUsoCfdi("G03");
    }
  }, [open]);

  if (!compra) return null;

  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const isLastDay = now.toDateString() === lastDayOfMonth.toDateString();
  const isBefore11PM = now.getHours() < 23;
  const canTimbrar = !isLastDay || (isLastDay && isBefore11PM);

  const handleTimbrar = async () => {
    setTimbrando(true);
    setError("");
    setTimbradoOk(false);

    try {
      const { data } = await axios.post("/timbrar-factura", {
        transaccion_id: compra.id,
        uso_cfdi: usoCfdi,
      });

      if (!data.ok) {
        throw new Error(data.message || "Error en el timbrado");
      }

      setTimbradoOk(true);
      onClose();

      Swal.fire({
        icon: "success",
        title: "🎉 Compra facturada",
        text: "Tu factura ha sido emitida correctamente.",
      });

      if (typeof onFacturada === "function") onFacturada();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error al timbrar";
      setError(msg);
      onClose();

      Swal.fire({
        icon: "error",
        title: "❌ Error al facturar",
        text: msg,
      });
    }

    setTimbrando(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongIcon color="primary" />
        Facturar Compra
        <Box flex={1} />
        <Button
          onClick={onClose}
          size="small"
          color="inherit"
          sx={{ minWidth: 0 }}
        >
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

        <TextField
          select
          label="Uso CFDI"
          fullWidth
          size="small"
          sx={{ mt: 2 }}
          value={usoCfdi}
          onChange={(e) => setUsoCfdi(e.target.value)}
        >
          {usosCfdi.map((op) => (
            <MenuItem key={op.value} value={op.value}>
              {op.label} - {op.value}
            </MenuItem>
          ))}
        </TextField>

        <Box my={2}>
          <Typography color="info.main" variant="body2">
            Para emitir la factura asegúrate de tener tus datos fiscales
            correctos. No podrás timbrar esta compra una segunda vez.
          </Typography>
          <Typography color="info.main" variant="body2">
            Si presentas problemas, contacta a soporte contacto@telorecargo.com.
          </Typography>
          <Typography color="info.main" variant="body2">
            Recibirás tu factura por correo electrónico una vez timbrada.
          </Typography>
        </Box>

        {!canTimbrar && (
          <Typography color="warning.main" sx={{ mt: 2 }}>
            ⚠️ El periodo para facturar ha expirado. Solo puedes timbrar hasta
            antes de las 11:00 PM del último día de cada mes.
          </Typography>
        )}

        {timbrando && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={22} />
            <Typography variant="body2">
              Facturando, espera un momento…
            </Typography>
          </Box>
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
          onClick={handleTimbrar}
          variant="contained"
          color="primary"
          disabled={timbrando || timbradoOk || !canTimbrar}
          startIcon={<ReceiptLongIcon />}
        >
          Facturar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalTimbrado;
