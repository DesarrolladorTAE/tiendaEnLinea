import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Button,
  Divider,
  Box,
} from "@mui/material";
import { BsFillCreditCard2FrontFill } from "react-icons/bs";

export default function PaymentDialog({ open, onClose, total, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [cashReceived, setCashReceived] = useState("");

  const cambio = Math.max(0, parseFloat(cashReceived || 0) - total);

  const handleConfirm = () => {
    const data = {
      metodo: paymentMethod,
      monto: total,
      efectivoRecibido: paymentMethod === "efectivo" ? parseFloat(cashReceived) : null,
      cambio: paymentMethod === "efectivo" ? cambio : 0,
    };
    onConfirm(data);
    setCashReceived("");
    setPaymentMethod("efectivo");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: "bold",
          fontSize: "1.25rem",
        }}
      >
        <BsFillCreditCard2FrontFill />
        Método de Pago
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setCashReceived("");
          }}
        >
          <FormControlLabel value="efectivo" control={<Radio />} label="Efectivo" />
          <FormControlLabel value="td" control={<Radio />} label="Tarjeta Débito" />
          <FormControlLabel value="tc" control={<Radio />} label="Tarjeta Crédito" />
        </RadioGroup>

        {paymentMethod === "efectivo" && (
          <>
            <TextField
              label="💵 Efectivo recibido"
              type="number"
              fullWidth
              margin="normal"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Total a pagar: <strong>${total.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
              Cambio: ${cambio.toFixed(2)}
            </Typography>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={paymentMethod === "efectivo" && parseFloat(cashReceived || 0) < total}
          onClick={handleConfirm}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
