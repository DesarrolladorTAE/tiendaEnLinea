import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";

const usosCFDI = [
  { clave: "G01", descripcion: "Adquisición de mercancías" },
  { clave: "G03", descripcion: "Gastos en general" },
  { clave: "S01", descripcion: "Sin efectos fiscales" },
];

const ModalAutofactura = ({
  open,
  onClose,
  onSubmit,
  monto,
  fecha,
  concepto,
}) => {
  const [usoCFDI, setUsoCFDI] = useState("G03");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onSubmit({ usoCFDI });
      onClose(); // cerrar modal si fue exitoso
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Ocurrió un error inesperado.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          bgcolor: "white",
          p: 4,
          width: 500,
          mx: "auto",
          my: "10%",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" mb={2}>
          🧾 Facturar Compra
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Typography>
          <strong>Monto:</strong> ${parseFloat(monto).toFixed(2)}
        </Typography>
        <Typography>
          <strong>Fecha:</strong> {fecha}
        </Typography>
        <Typography>
          <strong>Concepto:</strong> {concepto}
        </Typography>

        <TextField
          select
          fullWidth
          label="Uso CFDI"
          value={usoCFDI}
          onChange={(e) => setUsoCFDI(e.target.value)}
          sx={{ mt: 2 }}
        >
          {usosCFDI.map((uso) => (
            <MenuItem key={uso.clave} value={uso.clave}>
              {uso.descripcion} - {uso.clave}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="body2" mt={2} color="text.secondary">
          Para emitir la factura asegúrate de tener tus datos fiscales
          correctos. No podrás timbrar esta compra una segunda vez.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Si presentas problemas, contacta a soporte{" "}
          <strong>contacto@mitiendaenlineamx.com</strong>.
        </Typography>

        <Box mt={3} textAlign="right">
          <Button onClick={onClose} sx={{ mr: 2 }} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={18} />}
          >
            {isSubmitting ? "Timbrando..." : "📤 Facturar"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalAutofactura;
