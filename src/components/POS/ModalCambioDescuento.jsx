// components/POS/ModalCambioDescuento.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { showError, showSuccess } from "../../utils/alerts";

const steps = ["Cambiar Descuento", "Éxito"];

const ModalCambioDescuento = ({ open, onClose, product, onApply, onOpen }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [discount, setDiscount] = useState(""); // en porcentaje
  const [discountedPrice, setDiscountedPrice] = useState(""); // precio final

  const original = parseFloat(product.price_original || product.price);

  const resetState = () => {
    setActiveStep(0);
    setDiscount(product.discount ?? "");
    setDiscountedPrice(
      product.discount
        ? parseFloat((original * (1 - product.discount / 100)).toFixed(2))
        : ""
    );
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (!value || isNaN(value)) {
      setDiscount("");
      setDiscountedPrice("");
      return;
    }

    const porcentaje = parseFloat(value);
    if (porcentaje < 0 || porcentaje > 100) return;

    const precio = parseFloat((original * (1 - porcentaje / 100)).toFixed(2));
    setDiscount(value);
    setDiscountedPrice(precio);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!value || isNaN(value)) {
      setDiscountedPrice("");
      setDiscount("");
      return;
    }

    const precio = parseFloat(value);
    if (precio <= 0 || precio > original) return;

    const porcentaje = parseFloat((100 - (precio / original) * 100).toFixed(2));
    setDiscountedPrice(value);
    setDiscount(porcentaje);
  };

  const aplicarDescuento = () => {
    const precio = parseFloat(discountedPrice);
    const porcentaje = parseFloat(discount);

    if (isNaN(precio) || precio <= 0 || precio > original) {
      return showError("Precio con descuento inválido");
    }

    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      return showError("Descuento inválido");
    }

    onApply({
      ...product,
      price: precio,
      discount_percent: porcentaje, // 👈 este es el nombre correcto
      original_price: original,
    });

    showSuccess("Descuento aplicado correctamente");
    setActiveStep(1);
  };

  useEffect(() => {
    if (open) {
      resetState();
      if (typeof onOpen === "function") onOpen();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar descuento</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box mt={2}>
            <TextField
              id="input-descuento"
              label="Descuento (%)"
              type="number"
              fullWidth
              value={discount}
              onChange={handleDiscountChange}
              margin="normal"
              inputProps={{ inputMode: "decimal", min: 0, max: 100 }}
              autoFocus
            />
            <TextField
              label="Precio final"
              type="number"
              fullWidth
              value={discountedPrice}
              onChange={handlePriceChange}
              margin="normal"
              inputProps={{
                inputMode: "decimal",
                min: 0,
                max: original,
              }}
            />
            <Box mt={1} fontSize={12} color="gray">
              Precio original: ${original.toFixed(2)}
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box mt={2}>
            <p>✅ El descuento fue aplicado con éxito.</p>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cerrar
        </Button>

        {activeStep === 0 && (
          <Button onClick={aplicarDescuento} color="success">
            Aplicar cambios
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalCambioDescuento;
