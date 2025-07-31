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
import { showError, showSuccess } from "../../utils/alerts"; // ajusta la ruta si es necesario


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
  const [referencia, setReferencia] = useState("");
  const [ultimos4, setUltimos4] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cambio = Math.max(0, parseFloat(cashReceived || 0) - total);

  const handleConfirm = () => {
    // ✅ Validación para métodos con tarjeta
    if (
      (paymentMethod === "td" || paymentMethod === "tc") &&
      (!referencia.trim() || ultimos4.length !== 4)
    ) {
      showError("Por favor, completa la referencia y los 4 dígitos de la tarjeta.");
      return;
    }

    // ✅ Armar el objeto de venta
    const data = {
      payment_method: paymentMethod,
      total_amount: total,
      paid_amount:
        paymentMethod === "efectivo" ? parseFloat(cashReceived) : total,
      items: cart.map((item) => ({
        product_id: item.id,
        variation_size_id: item.variation_id || null,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.price),
        original_price:
          parseFloat(
            item.original_price ||
              item.base_price ||
              item.precio_base ||
              item.precio_sin_descuento ||
              item.original ||
              item.originalPrice
          ) || parseFloat(item.price),
        discount_percent: parseFloat(item.discount || 0),
      })),
    };

    // ✅ Agregar referencia y últimos 4 dígitos si aplica
    if (paymentMethod === "td" || paymentMethod === "tc") {
      data.referencia = referencia.trim();
      data.ultimos_4 = ultimos4;
    }

    onCheckout(data);

    // ✅ Limpiar estados
    setCashReceived("");
    setPaymentMethod("efectivo");
    setReferencia("");
    setUltimos4("");
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
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {item.name} {item.variation?.color}{" "}
                      {item.size ? `- ${item.size}` : ""}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => {
                        if (item.quantity > 1) {
                          setCart((prev) =>
                            prev.map((prod) =>
                              prod.id === item.id
                                ? {
                                    ...prod,
                                    quantity: Math.floor(prod.quantity) - 1,
                                  }
                                : prod
                            )
                          );
                        }
                      }}
                    >
                      -
                    </IconButton>

                    <TextField
                      value={item.inputValue ?? item.quantity}
                      type="text"
                      inputProps={{
                        inputMode: "decimal", // importante para móviles
                        style: { textAlign: "center", width: 60 },
                      }}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Solo permitir números válidos, incluyendo punto decimal solo
                        if (/^\d*\.?\d*$/.test(val)) {
                          setCart((prev) =>
                            prev.map((prod) =>
                              prod.id === item.id
                                ? {
                                    ...prod,
                                    inputValue: val, // estado temporal mientras escribe
                                    quantity:
                                      val === "" || val === "."
                                        ? 0
                                        : parseFloat(val), // actualizar quantity real solo si es válido
                                  }
                                : prod
                            )
                          );
                        }
                      }}
                      onBlur={() => {
                        setCart((prev) =>
                          prev.map((prod) =>
                            prod.id === item.id
                              ? { ...prod, inputValue: undefined }
                              : prod
                          )
                        );
                      }}
                      size="small"
                    />

                    <IconButton
                      size="small"
                      onClick={() => {
                        setCart((prev) =>
                          prev.map((prod) =>
                            prod.id === item.id
                              ? {
                                  ...prod,
                                  quantity: Math.floor(prod.quantity) + 1,
                                }
                              : prod
                          )
                        );
                      }}
                    >
                      +
                    </IconButton>
                  </Box>

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

                {(paymentMethod === "td" || paymentMethod === "tc") && (
                  <>
                    <TextField
                      label="Número de Referencia"
                      fullWidth
                      margin="normal"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                    />
                    <TextField
                      label="Últimos 4 dígitos"
                      fullWidth
                      margin="normal"
                      value={ultimos4}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // Solo números
                        if (val.length <= 4) setUltimos4(val);
                      }}
                      placeholder="2541"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, whiteSpace: "nowrap" }}>
                            **** **** ****
                          </Typography>
                        ),
                      }}
                    />
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
