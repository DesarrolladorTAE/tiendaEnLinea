// src/components/POS/CartSidebar.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Tooltip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DiscountIcon from "@mui/icons-material/Percent";
import ModalCambioDescuento from "./ModalCambioDescuento";
import { showError } from "../../utils/alerts";

const CARDLIKE = ["td", "tc", "transferencia"];
const METHODS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "td", label: "Tarjeta Débito" },
  { key: "tc", label: "Tarjeta Crédito" },
  { key: "transferencia", label: "Transferencia" },
];

// Normaliza números: quita espacios, cambia coma por punto y valida finito
const toNumber = (v) => {
  if (v == null) return NaN;
  const s = String(v).replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

export default function CartSidebar({
  cart,
  onRemove,
  onCheckout,
  setScannerEnabled,
  setModalDescuentoActivo,
  setCart,
}) {
  // Selección (1 a 3)
  const [selected, setSelected] = useState(["efectivo"]);

  // Estados por método
  const [cashReceived, setCashReceived] = useState(""); // solo si 1 método = efectivo
  const [details, setDetails] = useState({
    efectivo: { amount: "", referencia: "", ultimos4: "" },
    td: { amount: "", referencia: "", ultimos4: "" },
    tc: { amount: "", referencia: "", ultimos4: "" },
    transferencia: { amount: "", referencia: "", ultimos4: "" },
  });

  const [productoEditar, setProductoEditar] = useState(null);

  const total = cart.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const setDetail = (k, patch) =>
    setDetails((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }));

  const selectedCount = selected.length;
  const sumSelected = selected.reduce(
    (acc, m) =>
      acc +
      (Number.isFinite(toNumber(details[m].amount))
        ? toNumber(details[m].amount)
        : 0),
    0
  );

  // Cambios visuales
  const cambioUnico =
    selectedCount === 1 && selected[0] === "efectivo"
      ? Math.max(0, (toNumber(cashReceived) || 0) - total)
      : 0;

  const hasCashInMulti = selectedCount >= 2 && selected.includes("efectivo");

  const cambioMulti =
    selectedCount >= 2 && sumSelected > total && hasCashInMulti
      ? +(sumSelected - total).toFixed(2)
      : 0;

  // Manejo de selección (máx. 3)
  const toggleMethod = (m) => {
    setCashReceived("");
    setSelected((prev) => {
      const exists = prev.includes(m);
      if (exists) {
        const next = prev.filter((x) => x !== m);
        return next.length ? next : ["efectivo"]; // siempre uno
      }
      if (prev.length >= 3) return prev; // tope 3
      return [...prev, m];
    });
  };

  const buildItemsPayload = () =>
    cart.map((item) => ({
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
    }));

  // Recorta sobrepago priorizando efectivo (opcional)
  const recortarExceso = (payments, totalAmount) => {
    let sum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    let exceso = +(sum - totalAmount).toFixed(2);
    if (exceso <= 0) return payments;

    const tryCut = (idx) => {
      const cut = Math.min(exceso, payments[idx].amount);
      payments[idx].amount = +(payments[idx].amount - cut).toFixed(2);
      exceso = +(exceso - cut).toFixed(2);
    };

    // Primero efectivo(s)
    payments.forEach((p, i) => {
      if (exceso > 0 && p.method === "efectivo") tryCut(i);
    });

    // Si aún hay exceso, recorta del último
    if (exceso > 0) tryCut(payments.length - 1);

    return payments;
  };

  const handleConfirm = () => {
    if (cart.length === 0) return;

    let payments = [];

    // Caso A: solo 1 método
    if (selectedCount === 1) {
      const m = selected[0];

      if (m === "efectivo") {
        const recibido = toNumber(cashReceived);
        if (!Number.isFinite(recibido)) {
          showError("Ingresa un monto de efectivo válido.");
          return;
        }
        if (recibido + 0.00001 < total) {
          showError("El efectivo recibido no cubre el total.");
          return;
        }
        const aplicado = Math.min(recibido, total);
        const r = +recibido.toFixed(2);
        payments = [
          {
            method: "efectivo",
            amount: +aplicado.toFixed(2), // aplicado a la venta
            amount: r,  // aliases para backend/ticket
            recibido: r,
            cash_received: r,
            efectivo_recibido: r,
          },
        ];
      } else {
        const { referencia, ultimos4 } = details[m];
        if (
          !referencia?.trim() ||
          (CARDLIKE.includes(m) && (ultimos4 || "").length !== 4)
        ) {
          showError("Completa referencia y últimos 4.");
          return;
        }
        payments = [
          {
            method: m,
            amount: +total.toFixed(2),
            referencia: referencia.trim(),
            ...(CARDLIKE.includes(m) ? { ultimos_4: ultimos4 } : {}),
          },
        ];
      }
    } else {
      // Caso B: 2 o 3 métodos
      for (const m of selected) {
        const { amount, referencia, ultimos4 } = details[m];
        const val = toNumber(amount);
        if (!Number.isFinite(val) || val <= 0) {
          showError("Todos los montos deben ser mayores que 0.");
          return;
        }
        if (CARDLIKE.includes(m)) {
          if (!referencia?.trim() || (ultimos4 || "").length !== 4) {
            const label = METHODS.find((x) => x.key === m)?.label || m;
            showError(`Completa referencia y últimos 4 para ${label}.`);
            return;
          }
        }
      }

      const sumaValida = selected
        .map((m) => toNumber(details[m].amount))
        .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

      if (sumaValida + 0.00001 < total) {
        showError(
          `Los pagos no cubren el total. Faltan $${(total - sumaValida).toFixed(
            2
          )}.`
        );
        return;
      }

      payments = selected.map((m) => {
        const { amount, referencia, ultimos4 } = details[m];
        const val = toNumber(amount);
        const p = { method: m, amount: +val.toFixed(2) };
        if (CARDLIKE.includes(m)) {
          p.referencia = (referencia || "").trim();
          p.ultimos_4 = ultimos4 || "";
        }
        if (m === "efectivo") {
          const r = +val.toFixed(2);
          p.recibido = r;
          p.cash_received = r;
          p.efectivo_recibido = r;
        }
        return p;
      });

      // Si quieres evitar sobrepago neto, recorta priorizando efectivo:
      // payments = recortarExceso(payments, total);
    }

    const data = {
      total_amount: +total.toFixed(2),
      items: buildItemsPayload(),
      payments,
      // Si tu backend acepta "change" a nivel raíz, el hook lo agregará también.
    };

    onCheckout(data);

    // reset capturas
    setCashReceived("");
    setDetails({
      efectivo: { amount: "", referencia: "", ultimos4: "" },
      td: { amount: "", referencia: "", ultimos4: "" },
      tc: { amount: "", referencia: "", ultimos4: "" },
      transferencia: { amount: "", referencia: "", ultimos4: "" },
    });
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
          discount: nuevoProducto.discount,
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
                                    quantity:
                                      Math.floor(Number(prod.quantity)) - 1,
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
                        inputMode: "decimal",
                        style: { textAlign: "center", width: 60 },
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                          setCart((prev) =>
                            prev.map((prod) =>
                              prod.id === item.id
                                ? {
                                    ...prod,
                                    inputValue: val,
                                    quantity:
                                      val === "" || val === "."
                                        ? 0
                                        : parseFloat(val),
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
                                  quantity:
                                    Math.floor(Number(prod.quantity)) + 1,
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
                        setModalDescuentoActivo(true);
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

            {/* ---- Sección de cobro ---- */}
            <Box mt={2} borderTop={1} pt={1} borderColor="divider">
              <Typography variant="subtitle1">
                Total: ${total.toFixed(2)}
              </Typography>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Método(s) de pago (máx. 3)
                </Typography>

                {/* Lista de métodos */}
                <Stack spacing={1.25}>
                  {METHODS.map(({ key, label }) => {
                    const isChecked = selected.includes(key);
                    const d = details[key];

                    return (
                      <Box
                        key={key}
                        sx={{
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={() => toggleMethod(key)}
                                size="small"
                              />
                            }
                            label={label}
                          />
                        </FormGroup>

                        {isChecked && (
                          <Box sx={{ pl: 5, pt: 1 }}>
                            {selectedCount === 1 ? (
                              key === "efectivo" ? (
                                <>
                                  <TextField
                                    label="💵 Efectivo recibido"
                                    type="number"
                                    fullWidth
                                    margin="dense"
                                    value={cashReceived}
                                    onChange={(e) =>
                                      setCashReceived(e.target.value)
                                    }
                                    inputProps={{ min: 0, step: "0.01" }}
                                    onFocus={() => setScannerEnabled?.(false)}
                                    onBlur={() => setScannerEnabled?.(true)}
                                  />
                                  {cambioUnico > 0 && (
                                    <Typography
                                      variant="body2"
                                      sx={{ mt: 0.5, fontWeight: "bold" }}
                                    >
                                      Cambio: ${cambioUnico.toFixed(2)}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                  >
                                    Se cobrará el total con {label}.
                                  </Typography>
                                  <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                  >
                                    <TextField
                                      label="Referencia"
                                      fullWidth
                                      margin="dense"
                                      value={d.referencia}
                                      onChange={(e) =>
                                        setDetail(key, {
                                          referencia: e.target.value,
                                        })
                                      }
                                    />
                                    {CARDLIKE.includes(key) && (
                                      <TextField
                                        label="Últimos 4"
                                        margin="dense"
                                        value={d.ultimos4}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(
                                            /\D/g,
                                            ""
                                          );
                                          if (v.length <= 4)
                                            setDetail(key, { ultimos4: v });
                                        }}
                                        placeholder="2541"
                                        sx={{ width: 160 }}
                                        InputProps={{
                                          startAdornment: (
                                            <Typography
                                              sx={{
                                                mr: 1,
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              **** **** ****
                                            </Typography>
                                          ),
                                        }}
                                      />
                                    )}
                                  </Stack>
                                </>
                              )
                            ) : (
                              <>
                                {CARDLIKE.includes(key) ? (
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Monto"
                                      type="number"
                                      value={d.amount}
                                      onChange={(e) =>
                                        setDetail(key, { amount: e.target.value })
                                      }
                                      inputProps={{ min: 0, step: "0.01" }}
                                      fullWidth
                                      margin="dense"
                                    />
                                    <TextField
                                      label="Referencia"
                                      value={d.referencia}
                                      onChange={(e) =>
                                        setDetail(key, {
                                          referencia: e.target.value,
                                        })
                                      }
                                      fullWidth
                                      margin="dense"
                                    />
                                    <TextField
                                      label="Últimos 4"
                                      value={d.ultimos4}
                                      onChange={(e) => {
                                        const v = e.target.value.replace(
                                          /\D/g,
                                          ""
                                        );
                                        if (v.length <= 4)
                                          setDetail(key, { ultimos4: v });
                                      }}
                                      placeholder="2541"
                                      fullWidth
                                      margin="dense"
                                      InputProps={{
                                        startAdornment: (
                                          <Typography
                                            sx={{ mr: 1, whiteSpace: "nowrap" }}
                                          >
                                            ****
                                          </Typography>
                                        ),
                                      }}
                                    />
                                  </Stack>
                                ) : (
                                  <TextField
                                    label="Monto"
                                    type="number"
                                    value={d.amount}
                                    onChange={(e) =>
                                      setDetail(key, { amount: e.target.value })
                                    }
                                    inputProps={{ min: 0, step: "0.01" }}
                                    fullWidth
                                    margin="dense"
                                  />
                                )}
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Stack>

                {/* Resumen 2-3 métodos */}
                {selectedCount >= 2 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Suma de pagos: <strong>${sumSelected.toFixed(2)}</strong>
                    </Typography>
                    {cambioMulti > 0 && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, fontWeight: "bold" }}
                      >
                        Cambio: ${cambioMulti.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="success"
                  disabled={
                    cart.length === 0 ||
                    (selectedCount === 1 &&
                      selected[0] === "efectivo" &&
                      (!Number.isFinite(toNumber(cashReceived)) ||
                        toNumber(cashReceived) + 0.00001 < total)) ||
                    (selectedCount >= 2 &&
                      (selected
                        .map((m) => toNumber(details[m].amount))
                        .reduce(
                          (a, b) => a + (Number.isFinite(b) ? b : 0),
                          0
                        ) +
                        0.00001 <
                        total))
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
            setModalDescuentoActivo(false);
          }}
          onClose={() => {
            setProductoEditar(null);
            setModalDescuentoActivo(false);
          }}
          onOpen={() => setModalDescuentoActivo(true)}
        />
      )}
    </Box>
  );
}
