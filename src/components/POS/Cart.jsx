import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DiscountIcon from "@mui/icons-material/Percent";
import ModalCambioDescuento from "./ModalCambioDescuento";

export default function CartSidebar({
  cart,
  onRemove,
  onCheckout,
  setScannerEnabled,
  setModalDescuentoActivo,
  setCart,
}) {
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [cashReceived, setCashReceived] = useState("");
  const [productoEditar, setProductoEditar] = useState(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cambio = Math.max(0, parseFloat(cashReceived || 0) - total);

  const handleConfirm = () => {
    const data = {
      payment_method: paymentMethod,
      total_amount: total,
      paid_amount:
        paymentMethod === "efectivo" ? parseFloat(cashReceived) : total,
      items: cart.map((item) => ({
        product_id: item.id,
        variation_size_id: item.variation_id || null,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        original_price:
          parseFloat(
            item.original_price ||
              item.base_price ||
              item.precio_base ||
              item.precio_sin_descuento ||
              item.original ||
              item.originalPrice
          ) || parseFloat(item.price), // fallback
        discount_percent: parseFloat(item.discount || 0), // toma de 'discount'

      })),
    };

    // console.log(
    //   "🧾 Datos enviados a la venta:\n",
    //   JSON.stringify(data, null, 2)
    // );

    onCheckout(data);
    setCashReceived("");
    setPaymentMethod("efectivo");
  };

  const aplicarCambioProducto = (nuevoProducto) => {
    const actualizado = cart.map((item) => {
      const mismaVariacion =
        item.id === nuevoProducto.id &&
        item.size === nuevoProducto.size &&
        item.variation?.color === nuevoProducto.variation?.color;

      if (mismaVariacion) {
        return {
          ...item,
          price: nuevoProducto.price,
          discount: nuevoProducto.discount, // guarda como 'discount'
          original_price: nuevoProducto.original_price,
        };
      }

      return item;
    });

    setCart(actualizado);
  };

  return (
    <Box sx={{ position: "sticky", top: 20, alignSelf: "start", zIndex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Carrito
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {cart.length === 0 ? (
          <Typography color="text.secondary">Sin artículos</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
            {cart.map((item) => (
              <Box
                key={item.id}
                component="li"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Box>
                  <Typography variant="body2">
                    {item.name} {item.variation?.color}{" "}
                    {item.size ? `- ${item.size}` : ""} x{item.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Tooltip title="Editar descuento">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setProductoEditar(item);
                        setModalDescuentoActivo(true); // ✅ Activamos manualmente aquí también
                      }}
                    >
                      <DiscountIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={() => onRemove(item.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}

            <Box mt={2} borderTop={1} pt={1} borderColor="divider">
              <Typography variant="subtitle1">
                Total: ${total.toFixed(2)}
              </Typography>
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Método de Pago
                </Typography>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setCashReceived("");
                  }}
                >
                  <FormControlLabel
                    value="efectivo"
                    control={<Radio />}
                    label="Efectivo"
                  />
                  <FormControlLabel
                    value="td"
                    control={<Radio />}
                    label="Tarjeta Débito"
                  />
                  <FormControlLabel
                    value="tc"
                    control={<Radio />}
                    label="Tarjeta Crédito"
                  />
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
                      onFocus={() => setScannerEnabled(false)}
                      onBlur={() => setScannerEnabled(true)}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Total a pagar: <strong>${total.toFixed(2)}</strong>
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 1, fontWeight: "bold" }}
                    >
                      Cambio: ${cambio.toFixed(2)}
                    </Typography>
                  </>
                )}

                <Button
                  variant="contained"
                  color="success"
                  disabled={
                    cart.length === 0 ||
                    (paymentMethod === "efectivo" &&
                      parseFloat(cashReceived || 0) < total)
                  }
                  onClick={handleConfirm}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Confirmar pago
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {productoEditar && (
        <ModalCambioDescuento
          open={!!productoEditar}
          product={productoEditar}
          onApply={(nuevoProducto) => {
            aplicarCambioProducto(nuevoProducto);
            setProductoEditar(null);
            setModalDescuentoActivo(false); // ❗ Al cerrar
          }}
          onClose={() => {
            setProductoEditar(null);
            setModalDescuentoActivo(false); // ❗ Al cerrar
          }}
          onOpen={() => setModalDescuentoActivo(true)} // ❗ Nuevo
        />
      )}
    </Box>
  );
}
