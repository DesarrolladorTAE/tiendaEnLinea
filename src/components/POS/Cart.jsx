// src/components/POS/Cart.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

// ✅ Clave única por línea de carrito (variante/almacén/lo-que-sea)
const getCartKey = (item) =>
  String(item?.cart_key ?? item?.cartKey ?? item?.line_id ?? item?.lineId ?? item?.id);

// ✅ ID real del producto (si viene "123-v5" o "123-w9" regresa 123)
const getBaseProductId = (item) => {
  const raw = String(item?.product_id ?? item?.base_id ?? item?.baseId ?? item?.id ?? "");
  const m = raw.match(/^(\d+)(?:-(?:v|w)\d+)?$/);
  return m ? Number(m[1]) : Number(raw) || null;
};

const getVariantId = (item) =>
  item?.variant_id ?? item?.variation_id ?? item?.variant?.id ?? null;

export default function CartSidebar({
  cart,
  onRemove,
  onCheckout,
  setScannerEnabled,
  setModalDescuentoActivo,
  setCart,
  variant = "desktop", // "desktop" | "mobile"
}) {
  const isMobile = variant === "mobile";

  // ✅ Scroll container real
  const paperRef = useRef(null);

  // ✅ alto del teclado estimado (visualViewport)
  const [kb, setKb] = useState(0);

  useEffect(() => {
    if (!isMobile) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const compute = () => {
      // kb aproximado: diferencia entre innerHeight y viewport visible
      const raw = window.innerHeight - vv.height - (vv.offsetTop || 0);
      setKb(raw > 0 ? Math.round(raw) : 0);
    };

    compute();
    vv.addEventListener("resize", compute);
    vv.addEventListener("scroll", compute);
    window.addEventListener("orientationchange", compute);

    return () => {
      vv.removeEventListener("resize", compute);
      vv.removeEventListener("scroll", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [isMobile]);

  // ✅ Scroll suave para que el input quede visible dentro del Paper
  const ensureVisible = useCallback(
    (inputEl) => {
      if (!isMobile) return;
      const scroller = paperRef.current;
      if (!scroller || !inputEl) return;

      const doScroll = () => {
        try {
          const sRect = scroller.getBoundingClientRect();
          const tRect = inputEl.getBoundingClientRect();

          const topPad = 16;
          const bottomPad = 24;
          const keyboard = kb || 0;

          const visibleTop = sRect.top + topPad;
          const visibleBottom = sRect.bottom - keyboard - bottomPad;

          if (tRect.bottom > visibleBottom) {
            scroller.scrollTo({
              top: scroller.scrollTop + (tRect.bottom - visibleBottom),
              behavior: "smooth",
            });
          } else if (tRect.top < visibleTop) {
            scroller.scrollTo({
              top: Math.max(0, scroller.scrollTop - (visibleTop - tRect.top)),
              behavior: "smooth",
            });
          }
        } catch {}
      };

      requestAnimationFrame(doScroll);
      setTimeout(doScroll, 250);
    },
    [isMobile, kb],
  );

  // ✅ iOS/Android: cuando se enfoque cualquier input, lo centramos
  useEffect(() => {
    if (!isMobile) return;

    const onFocusIn = (e) => {
      const el = e.target;
      if (!el) return;

      const tag = (el.tagName || "").toLowerCase();
      if (tag !== "input" && tag !== "textarea" && !el.isContentEditable) return;

      // scrollIntoView ayuda en Safari
      try {
        el.scrollIntoView({ block: "center", inline: "nearest" });
      } catch {}
      ensureVisible(el);
    };

    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [isMobile, ensureVisible]);

  // ✅ Selección (1 a 3)
  const [selected, setSelected] = useState(["efectivo"]);

  // Estados por método
  const [cashReceived, setCashReceived] = useState("");
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
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      ),
    [cart],
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
    [selected, details],
  );

  // Cambio visual
  const cambioUnico =
    selectedCount === 1 && selected[0] === "efectivo"
      ? Math.max(0, (toNumber(cashReceived) || 0) - total)
      : 0;

  const hasCashInMulti = selectedCount >= 2 && selected.includes("efectivo");

  const cambioMulti =
    selectedCount >= 2 && sumSelected > total && hasCashInMulti
      ? +(sumSelected - total).toFixed(2)
      : 0;

  const toggleMethod = (m) => {
    setCashReceived("");
    setSelected((prev) => {
      const exists = prev.includes(m);
      if (exists) {
        const next = prev.filter((x) => x !== m);
        return next.length ? next : ["efectivo"];
      }
      if (prev.length >= 3) return prev;
      return [...prev, m];
    });
  };

  const buildItemsPayload = () =>
    cart.map((item) => {
      const baseId = getBaseProductId(item);
      const variantId = getVariantId(item);

      const original = toNumber(
        item.original_price ??
          item.price_original ??
          item.base_price ??
          item.precio_base ??
          item.precio_sin_descuento ??
          item.original ??
          item.originalPrice,
      );

      return {
        product_id: baseId,
        variant_id: variantId || null,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.price),
        original_price: Number.isFinite(original) ? +original : parseFloat(item.price),
        discount_percent: parseFloat(item.discount || 0),
        warehouse_id: item.warehouse_id ?? null,
      };
    });

  const handleConfirm = () => {
    if (cart.length === 0) return;

    let payments = [];

    if (selectedCount === 1) {
      const m = selected[0];

      if (m === "efectivo") {
        const recibido = toNumber(cashReceived);
        if (!Number.isFinite(recibido)) return showError("Ingresa un monto de efectivo válido.");
        if (recibido + 0.00001 < total) return showError("El efectivo recibido no cubre el total.");

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
        if (!referencia?.trim() || (CARDLIKE.includes(m) && (ultimos4 || "").length !== 4)) {
          return showError("Completa referencia y últimos 4.");
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
      for (const m of selected) {
        const { amount, referencia, ultimos4 } = details[m];
        const val = toNumber(amount);

        if (!Number.isFinite(val) || val <= 0) return showError("Todos los montos deben ser mayores que 0.");

        if (CARDLIKE.includes(m)) {
          if (!referencia?.trim() || (ultimos4 || "").length !== 4) {
            const label = METHODS.find((x) => x.key === m)?.label || m;
            return showError(`Completa referencia y últimos 4 para ${label}.`);
          }
        }
      }

      const sumaValida = selected
        .map((m) => toNumber(details[m].amount))
        .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

      if (sumaValida + 0.00001 < total) {
        return showError(`Los pagos no cubren el total. Faltan $${(total - sumaValida).toFixed(2)}.`);
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

    setCashReceived("");
    setDetails({
      efectivo: { amount: "", referencia: "", ultimos4: "" },
      td: { amount: "", referencia: "", ultimos4: "" },
      tc: { amount: "", referencia: "", ultimos4: "" },
      transferencia: { amount: "", referencia: "", ultimos4: "" },
    });
  };

  const aplicarCambioProducto = (nuevoProducto) => {
    const newKey = getCartKey(nuevoProducto);

    const actualizado = cart.map((item) => {
      const itemKey = getCartKey(item);
      if (itemKey !== newKey) return item;

      return {
        ...item,
        price: nuevoProducto.price,
        discount: nuevoProducto.discount,
        original_price:
          nuevoProducto.original_price ??
          nuevoProducto.price_original ??
          item.original_price ??
          item.price_original ??
          item.original_price,
      };
    });

    setCart(actualizado);
  };

  // ✅ Un solo contenedor scrolleable (Paper)
  const paperSx = {
    p: { xs: 1.5, md: 2 },
    borderRadius: 3,
    background: "#fff",
    borderColor: "divider",
    boxShadow: variant === "desktop" ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
    ...(isMobile
      ? {
          height: "100%",
          maxHeight: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          paddingBottom: `calc(${kb}px + 24px + env(safe-area-inset-bottom))`,
        }
      : {}),
  };

  const rootSx = {
    position: variant === "desktop" ? "sticky" : "relative",
    top: variant === "desktop" ? 20 : "auto",
    alignSelf: "start",
    zIndex: 1,
  };

  const inputCommon = {
    onFocus: (e) => {
      setScannerEnabled?.(false);
      if (isMobile) {
        const input =
          e.currentTarget?.tagName === "INPUT"
            ? e.currentTarget
            : e.currentTarget.querySelector?.("input");
        ensureVisible(input);
      }
    },
    onBlur: () => setScannerEnabled?.(true),
  };

  const disableConfirm =
    cart.length === 0 ||
    (selectedCount === 1 &&
      selected[0] === "efectivo" &&
      (!Number.isFinite(toNumber(cashReceived)) || toNumber(cashReceived) + 0.00001 < total)) ||
    (selectedCount >= 2 &&
      selected
        .map((m) => toNumber(details[m].amount))
        .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) +
        0.00001 <
        total);

  return (
    <Box sx={rootSx}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartRoundedIcon fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Carrito!
          </Typography>
          <Chip size="small" label={`${cart.length} item${cart.length === 1 ? "" : "s"}`} sx={{ ml: 0.5 }} />
        </Stack>

        <Typography sx={{ fontWeight: 900 }}>${total.toFixed(2)}</Typography>
      </Box>

      <Paper ref={paperRef} variant="outlined" sx={paperSx}>
        {cart.length === 0 ? (
          <Typography color="text.secondary">Sin artículos</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {/* Items */}
            {cart.map((item) => {
              const cartKey = getCartKey(item);

              return (
                <Box
                  key={cartKey}
                  component="li"
                  sx={{ py: 1.2, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {item.display_name || item.name}
                      </Typography>

                      {!!item.warehouse_name && (
                        <Typography variant="caption" color="text.secondary">
                          Almacén: <b>{item.warehouse_name}</b>
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary" display="block">
                        ${Number(item.price || 0).toFixed(2)} c/u · Subtotal: $
                        {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (Number(item.quantity) > 1) {
                              setCart((prev) =>
                                prev.map((prod) =>
                                  getCartKey(prod) === cartKey
                                    ? { ...prod, quantity: Math.floor(Number(prod.quantity)) - 1 }
                                    : prod,
                                ),
                              );
                            } else {
                              onRemove(cartKey);
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
                          inputProps={{
                            style: { textAlign: "center", width: 72 },
                            inputMode: "decimal",
                            pattern: "[0-9]*[.,]?[0-9]*",
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val)) {
                              setCart((prev) =>
                                prev.map((prod) =>
                                  getCartKey(prod) === cartKey
                                    ? {
                                        ...prod,
                                        inputValue: val,
                                        quantity: val === "" || val === "." ? 0 : parseFloat(val),
                                      }
                                    : prod,
                                ),
                              );
                            }
                          }}
                          onBlurCapture={() => {
                            setCart((prev) =>
                              prev
                                .map((prod) =>
                                  getCartKey(prod) === cartKey ? { ...prod, inputValue: undefined } : prod,
                                )
                                .filter((prod) => {
                                  if (getCartKey(prod) !== cartKey) return true;
                                  return Number(prod.quantity || 0) > 0;
                                }),
                            );
                          }}
                        />

                        <IconButton
                          size="small"
                          onClick={() => {
                            setCart((prev) =>
                              prev.map((prod) =>
                                getCartKey(prod) === cartKey
                                  ? { ...prod, quantity: Math.floor(Number(prod.quantity)) + 1 }
                                  : prod,
                              ),
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
                            setProductoEditar({ ...item, cart_key: cartKey });
                            setModalDescuentoActivo?.(true);
                          }}
                        >
                          <DiscountIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => onRemove(cartKey)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}

            {/* ---- Sección de cobro ---- */}
            <Box sx={{ pt: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Total: ${total.toFixed(2)}
              </Typography>

              <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} gutterBottom>
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
                          background: isChecked ? "rgba(25,118,210,0.04)" : "#fff",
                          transition: "all 120ms ease",
                        }}
                      >
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={isChecked} onChange={() => toggleMethod(key)} size="small" />}
                            label={<Typography sx={{ fontWeight: 700 }}>{label}</Typography>}
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
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    {...inputCommon}
                                    inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" }}
                                  />
                                  {cambioUnico > 0 && (
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 900 }}>
                                      Cambio: ${cambioUnico.toFixed(2)}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Se cobrará el total con <strong>{label}</strong>.
                                  </Typography>

                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <TextField
                                      label="Referencia"
                                      fullWidth
                                      margin="dense"
                                      value={d.referencia}
                                      onChange={(e) => setDetail(key, { referencia: e.target.value })}
                                      {...inputCommon}
                                    />

                                    {CARDLIKE.includes(key) && (
                                      <TextField
                                        label="Últimos 4"
                                        type="tel"
                                        margin="dense"
                                        value={d.ultimos4}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(/\D/g, "");
                                          if (v.length <= 4) setDetail(key, { ultimos4: v });
                                        }}
                                        placeholder="2541"
                                        sx={{ width: { xs: "100%", sm: 170 } }}
                                        {...inputCommon}
                                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                        InputProps={{
                                          startAdornment: (
                                            <Typography sx={{ mr: 1, whiteSpace: "nowrap", color: "text.secondary" }}>
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
                                      onChange={(e) => setDetail(key, { amount: e.target.value })}
                                      fullWidth
                                      margin="dense"
                                      {...inputCommon}
                                      inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" }}
                                    />
                                    <TextField
                                      label="Referencia"
                                      value={d.referencia}
                                      onChange={(e) => setDetail(key, { referencia: e.target.value })}
                                      fullWidth
                                      margin="dense"
                                      {...inputCommon}
                                    />
                                    <TextField
                                      label="Últimos 4"
                                      type="tel"
                                      value={d.ultimos4}
                                      onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, "");
                                        if (v.length <= 4) setDetail(key, { ultimos4: v });
                                      }}
                                      placeholder="2541"
                                      fullWidth
                                      margin="dense"
                                      {...inputCommon}
                                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                      InputProps={{
                                        startAdornment: (
                                          <Typography sx={{ mr: 1, whiteSpace: "nowrap", color: "text.secondary" }}>
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
                                    onChange={(e) => setDetail(key, { amount: e.target.value })}
                                    fullWidth
                                    margin="dense"
                                    {...inputCommon}
                                    inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" }}
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
                  sx={{ mt: 2, py: 1.2, borderRadius: 2, fontWeight: 900, textTransform: "none" }}
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