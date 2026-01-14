// src/components/POS/Cart.jsx
import React, { useMemo, useState } from "react";
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
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DiscountIcon from "@mui/icons-material/Percent";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";

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
  variant = "desktop", // ✅ "desktop" | "mobile"
}) {
  // ✅ Mobile flag
  const isMobile = variant === "mobile";

  // ✅ Tap-to-edit: en móvil, inputs readonly hasta tocar
  const [activeField, setActiveField] = useState(null);

  const tapToEditProps = (fieldKey, inputMode = "text") => ({
    InputProps: {
      readOnly: isMobile && activeField !== fieldKey,
    },
    inputProps: {
      inputMode,
    },
    onClick: (e) => {
      if (!isMobile) return;
      if (activeField !== fieldKey) {
        e.preventDefault();
        e.stopPropagation();
        setActiveField(fieldKey);
        requestAnimationFrame(() => {
          const input = e.currentTarget.querySelector("input");
          input?.focus();
        });
      }
    },
    onBlur: () => {
      if (!isMobile) return;
      setActiveField(null);
    },
  });

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

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [cart]
  );

  const setDetail = (k, patch) =>
    setDetails((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }));

  const selectedCount = selected.length;

  const sumSelected = useMemo(
    () =>
      selected.reduce((acc, m) => {
        const n = toNumber(details[m].amount);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0),
    [selected, details]
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
            amount: +aplicado.toFixed(2),
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
    }

    const data = {
      total_amount: +total.toFixed(2),
      items: buildItemsPayload(),
      payments,
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
    setActiveField(null);
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

  const paperSx = {
    p: { xs: 1.5, md: 2 },
    borderRadius: 3,
    background: "#fff",
    borderColor: "divider",
    boxShadow: variant === "desktop" ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
  };

  const rootSx = {
    position: variant === "desktop" ? "sticky" : "relative",
    top: variant === "desktop" ? 20 : "auto",
    alignSelf: "start",
    zIndex: 1,
  };

  const inputCommon = {
    onFocus: () => setScannerEnabled?.(false),
    onBlur: () => setScannerEnabled?.(true),
  };

  const disableConfirm =
    cart.length === 0 ||
    (selectedCount === 1 &&
      selected[0] === "efectivo" &&
      (!Number.isFinite(toNumber(cashReceived)) ||
        toNumber(cashReceived) + 0.00001 < total)) ||
    (selectedCount >= 2 &&
      selected
        .map((m) => toNumber(details[m].amount))
        .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) +
        0.00001 <
        total);

  return (
    <Box sx={rootSx}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartRoundedIcon fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Carrito
          </Typography>
          <Chip
            size="small"
            label={`${cart.length} item${cart.length === 1 ? "" : "s"}`}
            sx={{ ml: 0.5 }}
          />
        </Stack>

        <Typography sx={{ fontWeight: 900 }}>${total.toFixed(2)}</Typography>
      </Box>

      <Paper variant="outlined" sx={paperSx}>
        {cart.length === 0 ? (
          <Typography color="text.secondary">Sin artículos</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {/* Items */}
            {cart.map((item) => (
              <Box
                key={`${item.id}-${item.variation_id || "nv"}-${item.size || "ns"}`}
                component="li"
                sx={{
                  py: 1.2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700 }}
                      noWrap
                    >
                      {item.name}{" "}
                      {item.variation?.color ? `· ${item.variation.color}` : ""}{" "}
                      {item.size ? `· ${item.size}` : ""}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      ${Number(item.price || 0).toFixed(2)} c/u · Subtotal: $
                      {(item.price * item.quantity).toFixed(2)}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt: 1 }}
                    >
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
                        <RemoveRoundedIcon fontSize="small" />
                      </IconButton>

                      <TextField
                        value={item.inputValue ?? item.quantity}
                        type="text"
                        size="small"
                        {...inputCommon}
                        {...tapToEditProps(`qty-${item.id}`, "decimal")}
                        inputProps={{
                          ...tapToEditProps(`qty-${item.id}`, "decimal").inputProps,
                          style: { textAlign: "center", width: 72 },
                          pattern: "[0-9]*[.,]?[0-9]*",
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
                        onBlurCapture={() => {
                          setCart((prev) =>
                            prev.map((prod) =>
                              prod.id === item.id
                                ? { ...prod, inputValue: undefined }
                                : prod
                            )
                          );
                        }}
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
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Editar descuento">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setProductoEditar(item);
                          setModalDescuentoActivo?.(true);
                        }}
                      >
                        <DiscountIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => onRemove(item.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            ))}

            {/* ---- Sección de cobro ---- */}
            <Box sx={{ pt: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Total: ${total.toFixed(2)}
              </Typography>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800 }}
                  gutterBottom
                >
                  Método(s) de pago (máx. 3)
                </Typography>

                <Stack spacing={1.25}>
                  {METHODS.map(({ key, label }) => {
                    const isChecked = selected.includes(key);
                    const d = details[key];

                    return (
                      <Box
                        key={key}
                        sx={{
                          p: 1.25,
                          border: "1px solid",
                          borderColor: isChecked ? "primary.main" : "divider",
                          borderRadius: 2,
                          background: isChecked
                            ? "rgba(25,118,210,0.04)"
                            : "#fff",
                          transition: "all 120ms ease",
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
                            label={
                              <Typography sx={{ fontWeight: 700 }}>
                                {label}
                              </Typography>
                            }
                          />
                        </FormGroup>

                        {isChecked && (
                          <Box sx={{ pl: 4.5, pt: 1 }}>
                            {selectedCount === 1 ? (
                              key === "efectivo" ? (
                                <>
                                  <TextField
                                    label="Efectivo recibido"
                                    type="text"
                                    fullWidth
                                    margin="dense"
                                    value={cashReceived}
                                    onChange={(e) =>
                                      setCashReceived(e.target.value)
                                    }
                                    {...inputCommon}
                                    {...tapToEditProps(
                                      "cashReceived",
                                      "decimal"
                                    )}
                                    inputProps={{
                                      ...tapToEditProps(
                                        "cashReceived",
                                        "decimal"
                                      ).inputProps,
                                      pattern: "[0-9]*[.,]?[0-9]*",
                                    }}
                                  />
                                  {cambioUnico > 0 && (
                                    <Typography
                                      variant="body2"
                                      sx={{ mt: 0.5, fontWeight: 900 }}
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
                                    Se cobrará el total con{" "}
                                    <strong>{label}</strong>.
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
                                      {...inputCommon}
                                      {...tapToEditProps(`ref-${key}`, "text")}
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
                                        sx={{ width: { xs: "100%", sm: 170 } }}
                                        {...inputCommon}
                                        {...tapToEditProps(
                                          `ult4-${key}`,
                                          "numeric"
                                        )}
                                        InputProps={{
                                          ...tapToEditProps(
                                            `ult4-${key}`,
                                            "numeric"
                                          ).InputProps,
                                          startAdornment: (
                                            <Typography
                                              sx={{
                                                mr: 1,
                                                whiteSpace: "nowrap",
                                                color: "text.secondary",
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
                                      type="text"
                                      value={d.amount}
                                      onChange={(e) =>
                                        setDetail(key, { amount: e.target.value })
                                      }
                                      fullWidth
                                      margin="dense"
                                      {...inputCommon}
                                      {...tapToEditProps(
                                        `amount-${key}`,
                                        "decimal"
                                      )}
                                      inputProps={{
                                        ...tapToEditProps(
                                          `amount-${key}`,
                                          "decimal"
                                        ).inputProps,
                                        pattern: "[0-9]*[.,]?[0-9]*",
                                      }}
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
                                      {...inputCommon}
                                      {...tapToEditProps(`ref-${key}`, "text")}
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
                                      {...inputCommon}
                                      {...tapToEditProps(
                                        `ult4-${key}`,
                                        "numeric"
                                      )}
                                      InputProps={{
                                        ...tapToEditProps(
                                          `ult4-${key}`,
                                          "numeric"
                                        ).InputProps,
                                        startAdornment: (
                                          <Typography
                                            sx={{
                                              mr: 1,
                                              whiteSpace: "nowrap",
                                              color: "text.secondary",
                                            }}
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
                                    type="text"
                                    value={d.amount}
                                    onChange={(e) =>
                                      setDetail(key, { amount: e.target.value })
                                    }
                                    fullWidth
                                    margin="dense"
                                    {...inputCommon}
                                    {...tapToEditProps(
                                      `amount-${key}`,
                                      "decimal"
                                    )}
                                    inputProps={{
                                      ...tapToEditProps(
                                        `amount-${key}`,
                                        "decimal"
                                      ).inputProps,
                                      pattern: "[0-9]*[.,]?[0-9]*",
                                    }}
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

                {selectedCount >= 2 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Suma de pagos: <strong>${sumSelected.toFixed(2)}</strong>
                    </Typography>
                    {cambioMulti > 0 && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 900 }}>
                        Cambio: ${cambioMulti.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="success"
                  disabled={disableConfirm}
                  onClick={handleConfirm}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 900,
                    textTransform: "none",
                  }}
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
            setModalDescuentoActivo?.(false);
          }}
          onClose={() => {
            setProductoEditar(null);
            setModalDescuentoActivo?.(false);
          }}
          onOpen={() => setModalDescuentoActivo?.(true)}
        />
      )}
    </Box>
  );
}
