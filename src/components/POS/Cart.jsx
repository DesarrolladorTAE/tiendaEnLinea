import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Switch,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DiscountIcon from "@mui/icons-material/Percent";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";

import ModalCambioDescuento from "./ModalCambioDescuento";
import ItemWorkerAssign from "./ItemWorkerAssign";
import SaleClientAssign from "./SaleClientAssign";
import PendingSaleModal from "./PendingSaleModal";
import IsrRetentionPreview from "./IsrRetentionPreview";

import { showError } from "../../utils/alerts";
import axiosClient from "../../config/axiosClientPOS";

const CARDLIKE = ["td", "tc", "transferencia"];
const METHODS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "td", label: "Tarjeta Débito" },
  { key: "tc", label: "Tarjeta Crédito" },
  { key: "transferencia", label: "Transferencia" },
];

const toNumber = (v) => {
  if (v == null) return NaN;
  const s = String(v).replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const getCartKey = (item) =>
  String(
    item?.cart_key ??
      item?.cartKey ??
      item?.line_id ??
      item?.lineId ??
      item?.id,
  );

const getBaseProductId = (item) => {
  const raw = String(
    item?.product_id ?? item?.base_id ?? item?.baseId ?? item?.id ?? "",
  );
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
  posLocationId,
  variant = "desktop",
}) {
  const isMobile = variant === "mobile";

  const paperRef = useRef(null);
  const [kb, setKb] = useState(0);

  const [selected, setSelected] = useState(["efectivo"]);
  const [cashReceived, setCashReceived] = useState("");
  const [details, setDetails] = useState({
    efectivo: { amount: "", referencia: "", ultimos4: "" },
    td: { amount: "", referencia: "", ultimos4: "" },
    tc: { amount: "", referencia: "", ultimos4: "" },
    transferencia: { amount: "", referencia: "", ultimos4: "" },
  });

  const [productoEditar, setProductoEditar] = useState(null);

  const [posWorkers, setPosWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [retentionInfo, setRetentionInfo] = useState(null);

  const [openQuickClient, setOpenQuickClient] = useState(false);
  const [savingQuickClient, setSavingQuickClient] = useState(false);
  const [submittingSale, setSubmittingSale] = useState(false);

  const [pendingSale, setPendingSale] = useState(false);
  const [openPendingModal, setOpenPendingModal] = useState(false);
  const [pendingHasAdvance, setPendingHasAdvance] = useState(false);
  const [pendingAdvancePayment, setPendingAdvancePayment] = useState(null);
  const [editingAdvance, setEditingAdvance] = useState(false);

  const [pendingDueAt, setPendingDueAt] = useState(null);
  const [pendingNote, setPendingNote] = useState("");

  const [creditSale, setCreditSale] = useState(false);
  const [creditAccount, setCreditAccount] = useState(null);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const [quickClientForm, setQuickClientForm] = useState({
    nombre_alias: "",
    telefono: "",
  });

  useEffect(() => {
    if (!isMobile) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const compute = () => {
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

  useEffect(() => {
    if (!isMobile) return;

    const onFocusIn = (e) => {
      const el = e.target;
      if (!el) return;

      const tag = (el.tagName || "").toLowerCase();
      if (tag !== "input" && tag !== "textarea" && !el.isContentEditable)
        return;

      try {
        el.scrollIntoView({ block: "center", inline: "nearest" });
      } catch {}
      ensureVisible(el);
    };

    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [isMobile, ensureVisible]);

  useEffect(() => {
    if (!posLocationId) {
      setPosWorkers([]);
      return;
    }

    let cancelled = false;

    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const { data } = await axiosClient.get("/workers/simple-by-pos", {
          params: { pos_location_id: posLocationId },
        });

        if (!cancelled) {
          setPosWorkers(Array.isArray(data?.data) ? data.data : []);
        }
      } catch {
        if (!cancelled) setPosWorkers([]);
      } finally {
        if (!cancelled) setLoadingWorkers(false);
      }
    };

    fetchWorkers();

    return () => {
      cancelled = true;
    };
  }, [posLocationId]);

  const fetchClients = useCallback(async () => {
    if (!posLocationId) {
      setClients([]);
      setSelectedClient(null);
      return [];
    }

    setLoadingClients(true);
    try {
      const { data } = await axiosClient.get("/clientes/simple", {
        params: { pos_location_id: posLocationId },
      });

      const list = Array.isArray(data?.data) ? data.data : [];
      setClients(list);
      return list;
    } catch {
      setClients([]);
      return [];
    } finally {
      setLoadingClients(false);
    }
  }, [posLocationId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const loadCreditAccount = async () => {
      if (!selectedClient?.id) {
        setCreditSale(false);
        setCreditAccount(null);
        return;
      }

      setLoadingCredit(true);

      try {
        const { data } = await axiosClient.get(
          `/pos/credit-client/${selectedClient.id}`,
        );
        setCreditAccount(data?.account || null);
      } catch {
        setCreditAccount(null);
      } finally {
        setLoadingCredit(false);
      }
    };

    loadCreditAccount();
  }, [selectedClient?.id]);

  const handleRetentionChange = useCallback((info) => {
    setRetentionInfo(info);
  }, []);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      ),
    [cart],
  );

  const appliesIsrRetention = Boolean(retentionInfo?.applies_retention);

  const isrRetentionTotal = appliesIsrRetention
    ? Number(retentionInfo?.calculation?.isr_retention_total || 0)
    : 0;

  const payableTotal = appliesIsrRetention
    ? Number(retentionInfo?.calculation?.net_total_amount ?? total)
    : total;

  const amountToPay = Number(payableTotal.toFixed(6));

  const payableTotalRounded = Number(payableTotal.toFixed(6));

  const hasCreditAccount = Boolean(creditAccount?.id);
  const creditActive = Boolean(creditAccount?.is_active);
  const creditLimit = Number(creditAccount?.credit_limit || 0);
  const currentBalance = Number(creditAccount?.current_balance || 0);
  const isUnlimitedCredit = creditLimit === 0;
  const availableCredit = isUnlimitedCredit
    ? Infinity
    : Math.max(0, creditLimit - currentBalance);

  const canUseCredit =
    Boolean(selectedClient?.id) &&
    hasCreditAccount &&
    creditActive &&
    (isUnlimitedCredit || availableCredit >= amountToPay);

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
        original_price: Number.isFinite(original)
          ? +original
          : parseFloat(item.price),
        discount_percent: parseFloat(item.discount || 0),
        warehouse_id: item.warehouse_id ?? null,
        worker_id: item.worker_id ?? null,
      };
    });

  const resetAfterSuccessfulSale = () => {
    setCart([]);
    setSelectedClient(null);
    setCashReceived("");
    setSelected(["efectivo"]);
    setDetails({
      efectivo: { amount: "", referencia: "", ultimos4: "" },
      td: { amount: "", referencia: "", ultimos4: "" },
      tc: { amount: "", referencia: "", ultimos4: "" },
      transferencia: { amount: "", referencia: "", ultimos4: "" },
    });
    setProductoEditar(null);
    setOpenQuickClient(false);
    setQuickClientForm({
      nombre_alias: "",
      telefono: "",
    });
    setScannerEnabled?.(true);

    setPendingSale(false);
    setPendingHasAdvance(false);
    setOpenPendingModal(false);
    setPendingAdvancePayment(null);
    setEditingAdvance(false);

    setPendingDueAt(null);
    setPendingNote("");

    setCreditSale(false);
    setCreditAccount(null);
  };

  const processCheckout = async () => {
    if (cart.length === 0 || submittingSale) return;

    if (creditSale) {
      if (!selectedClient?.id) {
        return showError("Selecciona un cliente para vender a fiado.");
      }

      if (!creditAccount?.id) {
        return showError("Este cliente no tiene cuenta de fiado configurada.");
      }

      if (!creditAccount?.is_active) {
        return showError("La cuenta de fiado del cliente está desactivada.");
      }

      if (!isUnlimitedCredit && total > availableCredit) {
        return showError(
          `El cliente no tiene crédito suficiente. Disponible: $${availableCredit.toFixed(2)}`,
        );
      }
    }

    let payments = [];

    if (creditSale) {
      payments = [];
    } else if (pendingSale) {
      if (!pendingHasAdvance) {
        payments = [];
      } else {
        if (!pendingAdvancePayment) {
          return showError(
            "Selecciona o registra el anticipo de la venta pendiente.",
          );
        }

        payments = [pendingAdvancePayment];
      }
    } else {
      if (selectedCount === 1) {
        const m = selected[0];

        if (m === "efectivo") {
          const recibido = toNumber(cashReceived);

          if (!Number.isFinite(recibido)) {
            return showError("Ingresa un monto de efectivo válido.");
          }

          if (recibido + 0.00001 < total) {
            return showError("El efectivo recibido no cubre el total.");
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

          if (!Number.isFinite(val) || val <= 0) {
            return showError("Todos los montos deben ser mayores que 0.");
          }

          if (CARDLIKE.includes(m)) {
            if (!referencia?.trim() || (ultimos4 || "").length !== 4) {
              const label = METHODS.find((x) => x.key === m)?.label || m;
              return showError(
                `Completa referencia y últimos 4 para ${label}.`,
              );
            }
          }
        }

        const sumaValida = selected
          .map((m) => toNumber(details[m].amount))
          .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

        if (sumaValida + 0.00001 < total) {
          return showError(
            `Los pagos no cubren el total. Faltan $${(total - sumaValida).toFixed(2)}.`,
          );
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
    }

    const data = {
      total_amount: +total.toFixed(2),
      client_id: selectedClient?.id ?? null,
      items: buildItemsPayload(),
      payments,

      is_pending_sale: creditSale ? true : pendingSale,
      pending_has_advance: creditSale ? false : pendingHasAdvance,
      pending_due_at: creditSale
        ? creditAccount?.payment_due_date || null
        : pendingDueAt,
      pending_note: creditSale
        ? "Venta registrada a fiado desde POS."
        : pendingNote,

      is_credit_sale: creditSale,
      credit_due_at: creditSale
        ? creditAccount?.payment_due_date || null
        : null,
    };

    try {
      setSubmittingSale(true);
      await onCheckout(data);
      resetAfterSuccessfulSale();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo registrar la venta.";
      showError(msg);
    } finally {
      setSubmittingSale(false);
    }
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

  const handleOpenQuickClient = () => {
    setQuickClientForm({
      nombre_alias: "",
      telefono: "",
    });
    setOpenQuickClient(true);
    setScannerEnabled?.(false);
  };

  const handleCloseQuickClient = () => {
    if (savingQuickClient) return;
    setOpenQuickClient(false);
    setScannerEnabled?.(true);
  };

  const handleSaveQuickClient = async () => {
    const nombre_alias = quickClientForm.nombre_alias.trim();
    const telefono = quickClientForm.telefono.trim();

    if (!posLocationId) {
      showError("No se encontró el POS actual.");
      return;
    }

    if (!nombre_alias) {
      showError("Ingresa el nombre o alias del cliente.");
      return;
    }

    if (!telefono) {
      showError("Ingresa el teléfono del cliente.");
      return;
    }

    try {
      setSavingQuickClient(true);

      const { data } = await axiosClient.post("/clientes/quick-store", {
        pos_location_id: posLocationId,
        nombre_alias,
        telefono,
      });

      const nuevoCliente = data?.cliente ?? data;

      const refreshed = await fetchClients();

      let clienteSeleccionado =
        refreshed.find((c) => String(c.id) === String(nuevoCliente?.id)) ||
        nuevoCliente ||
        null;

      if (clienteSeleccionado) {
        setSelectedClient(clienteSeleccionado);
      }

      setOpenQuickClient(false);
      setQuickClientForm({ nombre_alias: "", telefono: "" });
      setScannerEnabled?.(true);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo crear el cliente.";
      showError(msg);
    } finally {
      setSavingQuickClient(false);
    }
  };

  const paymentInvalid =
    selectedCount === 1 &&
    selected[0] === "efectivo" &&
    (!Number.isFinite(toNumber(cashReceived)) ||
      toNumber(cashReceived) + 0.00001 < total);

  const multiInvalid =
    selectedCount >= 2 &&
    selected
      .map((m) => toNumber(details[m].amount))
      .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) +
      0.00001 <
      total;

  const disableConfirm =
    cart.length === 0 ||
    submittingSale ||
    (creditSale && !canUseCredit) ||
    (!creditSale &&
      ((pendingSale && pendingHasAdvance && !pendingAdvancePayment) ||
        (!pendingSale && (paymentInvalid || multiInvalid))));

  const paperSx = {
    p: { xs: 1.5, md: 2 },
    borderRadius: 3,
    background: "#fff",
    borderColor: "divider",
    boxShadow: variant === "desktop" ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
    ...(isMobile
      ? {
          height: "auto",
          maxHeight: "none",
          overflow: "visible",
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

  return (
    <>
      <Box sx={rootSx}>
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
              Carrito!
            </Typography>
            <Chip
              size="small"
              label={`${cart.length} item${cart.length === 1 ? "" : "s"}`}
              sx={{ ml: 0.5 }}
            />
          </Stack>

          <Typography sx={{ fontWeight: 900 }}>${total.toFixed(2)}</Typography>
        </Box>

        <Box
          sx={{
            mb: 1.5,
            p: 1.25,
            border: "1px solid",
            borderColor: pendingSale ? "warning.main" : "divider",
            borderRadius: 2,
            bgcolor: pendingSale ? "rgba(255,152,0,0.08)" : "#fff",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={pendingSale}
                disabled={creditSale}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPendingSale(checked);

                  if (checked) {
                    setCreditSale(false);
                    setOpenPendingModal(true);
                    setScannerEnabled?.(false);
                  } else {
                    setPendingHasAdvance(false);
                    setOpenPendingModal(false);
                    setScannerEnabled?.(true);
                  }
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 900 }}>
                  Venta pendiente
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Actívalo si el cliente no pagará completo por ahora.
                </Typography>
              </Box>
            }
          />

          {pendingSale && (
            <Chip
              size="small"
              color="warning"
              sx={{ mt: 1, fontWeight: 800 }}
              label={pendingHasAdvance ? "Con anticipo" : "Sin anticipo"}
            />
          )}
        </Box>

        <Paper ref={paperRef} variant="outlined" sx={paperSx}>
          {cart.length === 0 ? (
            <Typography color="text.secondary">Sin artículos</Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {cart.map((item) => {
                const cartKey = getCartKey(item);

                return (
                  <Box
                    key={cartKey}
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
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700 }}
                          noWrap
                        >
                          {item.display_name || item.name}
                        </Typography>

                        {!!item.warehouse_name && (
                          <Typography variant="caption" color="text.secondary">
                            Almacén: <b>{item.warehouse_name}</b>
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          ${Number(item.price || 0).toFixed(2)} c/u · Subtotal:
                          $
                          {(
                            Number(item.price || 0) * Number(item.quantity || 0)
                          ).toFixed(2)}
                        </Typography>

                        {!loadingWorkers && posWorkers.length > 0 && (
                          <ItemWorkerAssign
                            workers={posWorkers}
                            value={item.worker_id || null}
                            onChange={(workerId, workerObj) => {
                              setCart((prev) =>
                                prev.map((prod) =>
                                  getCartKey(prod) === cartKey
                                    ? {
                                        ...prod,
                                        worker_id: workerId,
                                        worker: workerObj,
                                      }
                                    : prod,
                                ),
                              );
                            }}
                          />
                        )}

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 1 }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (Number(item.quantity) > 1) {
                                setCart((prev) =>
                                  prev.map((prod) =>
                                    getCartKey(prod) === cartKey
                                      ? {
                                          ...prod,
                                          quantity:
                                            Math.floor(Number(prod.quantity)) -
                                            1,
                                        }
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
                                          quantity:
                                            val === "" || val === "."
                                              ? 0
                                              : parseFloat(val),
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
                                    getCartKey(prod) === cartKey
                                      ? { ...prod, inputValue: undefined }
                                      : prod,
                                  )
                                  .filter((prod) => {
                                    if (getCartKey(prod) !== cartKey)
                                      return true;
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
                                    ? {
                                        ...prod,
                                        quantity:
                                          Math.floor(Number(prod.quantity)) + 1,
                                      }
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
                          <IconButton
                            size="small"
                            onClick={() => onRemove(cartKey)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}

              <Box sx={{ pt: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  Total: ${total.toFixed(2)}
                </Typography>

                <Box sx={{ mt: 1.2 }}>
                  {!loadingClients && clients.length > 0 && (
                    <SaleClientAssign
                      clients={clients}
                      value={selectedClient}
                      onChange={setSelectedClient}
                      loading={loadingClients}
                    />
                  )}

                  <IsrRetentionPreview
                    clientId={selectedClient?.id ?? null}
                    totalAmount={total}
                    onChange={handleRetentionChange}
                  />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 1 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddAlt1RoundedIcon />}
                      onClick={handleOpenQuickClient}
                      fullWidth={isMobile}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      Crear cliente rápido
                    </Button>

                    {selectedClient && (
                      <Button
                        variant="text"
                        color="inherit"
                        onClick={() => setSelectedClient(null)}
                        fullWidth={isMobile}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                      >
                        Quitar cliente
                      </Button>
                    )}
                  </Stack>
                </Box>

                {selectedClient && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.25,
                      border: "1px solid",
                      borderColor: creditSale ? "primary.main" : "divider",
                      borderRadius: 2,
                      bgcolor: creditSale ? "rgba(25,118,210,0.06)" : "#fff",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={creditSale}
                          disabled={loadingCredit || !creditActive}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCreditSale(checked);

                            if (checked) {
                              setPendingSale(false);
                              setPendingHasAdvance(false);
                              setPendingAdvancePayment(null);
                              setPendingDueAt(null);
                              setPendingNote("");
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>
                            Venta a Crédito
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {loadingCredit
                              ? "Validando cuenta de fiado..."
                              : !hasCreditAccount
                                ? "Este cliente no tiene fiado configurado."
                                : !creditActive
                                  ? "Fiado desactivado para este cliente."
                                  : isUnlimitedCredit
                                    ? "Fiado activo sin límite."
                                    : `Disponible: $${availableCredit.toFixed(2)}`}
                          </Typography>
                        </Box>
                      }
                    />

                    {creditSale && (
                      <Chip
                        size="small"
                        color="primary"
                        sx={{ mt: 1, fontWeight: 800 }}
                        label={
                          creditAccount?.payment_due_date
                            ? `Fecha de pago: ${String(creditAccount.payment_due_date).slice(0, 10)}`
                            : "Sin fecha límite"
                        }
                      />
                    )}
                  </Box>
                )}

                {!pendingSale && !creditSale && (
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
                              borderColor: isChecked
                                ? "primary.main"
                                : "divider",
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
                                        inputProps={{
                                          inputMode: "decimal",
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

                                      <Stack spacing={1.2}>
                                        <TextField
                                          label="Referencia"
                                          fullWidth
                                          margin="dense"
                                          value={d.referencia || ""}
                                          onChange={(e) =>
                                            setDetail(key, {
                                              referencia: e.target.value,
                                            })
                                          }
                                          {...inputCommon}
                                        />

                                        {CARDLIKE.includes(key) && (
                                          <Box
                                            sx={{
                                              mt: 0.25,
                                              p: 1.2,
                                              border: "1px dashed",
                                              borderColor: "divider",
                                              borderRadius: 2,
                                              bgcolor: "background.paper",
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                display: "block",
                                                color: "text.secondary",
                                                mb: 0.8,
                                                fontWeight: 700,
                                                letterSpacing: 1,
                                              }}
                                            >
                                              **** **** ****{" "}
                                              {d.ultimos4?.padEnd(4, "_") ||
                                                "____"}
                                            </Typography>

                                            <TextField
                                              label="Últimos 4"
                                              type="tel"
                                              fullWidth
                                              size="small"
                                              margin="dense"
                                              value={d.ultimos4 || ""}
                                              onChange={(e) => {
                                                const v = String(
                                                  e.target.value || "",
                                                )
                                                  .replace(/\D/g, "")
                                                  .slice(0, 4);
                                                setDetail(key, { ultimos4: v });
                                              }}
                                              placeholder="1234"
                                              helperText="Ingresa solo los últimos 4 dígitos"
                                              {...inputCommon}
                                              inputProps={{
                                                maxLength: 4,
                                                inputMode: "numeric",
                                                pattern: "[0-9]*",
                                              }}
                                            />
                                          </Box>
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
                                          value={d.amount || ""}
                                          onChange={(e) =>
                                            setDetail(key, {
                                              amount: e.target.value,
                                            })
                                          }
                                          fullWidth
                                          margin="dense"
                                          {...inputCommon}
                                          inputProps={{
                                            inputMode: "decimal",
                                            pattern: "[0-9]*[.,]?[0-9]*",
                                          }}
                                        />

                                        <TextField
                                          label="Referencia"
                                          value={d.referencia || ""}
                                          onChange={(e) =>
                                            setDetail(key, {
                                              referencia: e.target.value,
                                            })
                                          }
                                          fullWidth
                                          margin="dense"
                                          {...inputCommon}
                                        />

                                        <TextField
                                          label="Últimos 4"
                                          type="tel"
                                          value={d.ultimos4 || ""}
                                          onChange={(e) => {
                                            const v = String(
                                              e.target.value || "",
                                            )
                                              .replace(/\D/g, "")
                                              .slice(0, 4);
                                            setDetail(key, { ultimos4: v });
                                          }}
                                          placeholder="1234"
                                          helperText="Ingresa solo los últimos 4 dígitos"
                                          fullWidth
                                          size="small"
                                          margin="dense"
                                          {...inputCommon}
                                          inputProps={{
                                            maxLength: 4,
                                            inputMode: "numeric",
                                            pattern: "[0-9]*",
                                          }}
                                        />
                                      </Stack>
                                    ) : (
                                      <TextField
                                        label="Monto"
                                        type="text"
                                        value={d.amount || ""}
                                        onChange={(e) =>
                                          setDetail(key, {
                                            amount: e.target.value,
                                          })
                                        }
                                        fullWidth
                                        margin="dense"
                                        {...inputCommon}
                                        inputProps={{
                                          inputMode: "decimal",
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
                          Suma de pagos:{" "}
                          <strong>${sumSelected.toFixed(2)}</strong>
                        </Typography>
                        {cambioMulti > 0 && (
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.5, fontWeight: 900 }}
                          >
                            Cambio: ${cambioMulti.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {pendingSale && pendingHasAdvance && pendingAdvancePayment && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "warning.main",
                      bgcolor: "rgba(255,152,0,0.08)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      Anticipo registrado
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Método: <strong>{pendingAdvancePayment.method}</strong>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Anticipo:{" "}
                      <strong>
                        ${Number(pendingAdvancePayment.amount || 0).toFixed(2)}
                      </strong>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Restante:{" "}
                      <strong>
                        $
                        {Math.max(
                          0,
                          total - Number(pendingAdvancePayment.amount || 0),
                        ).toFixed(2)}
                      </strong>
                    </Typography>

                    {pendingDueAt && (
                      <Typography variant="body2" color="text.secondary">
                        Fecha compromiso:{" "}
                        <strong>
                          {new Date(pendingDueAt).toLocaleString("es-MX")}
                        </strong>
                      </Typography>
                    )}

                    {pendingNote && (
                      <Typography variant="body2" color="text.secondary">
                        Nota: <strong>{pendingNote}</strong>
                      </Typography>
                    )}

                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ mt: 1, textTransform: "none", fontWeight: 800 }}
                      onClick={() => {
                        setEditingAdvance(true);
                        setOpenPendingModal(true);
                        setScannerEnabled?.(false);
                      }}
                    >
                      Editar anticipo
                    </Button>
                  </Box>
                )}

                {pendingSale && !pendingHasAdvance && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "warning.main",
                      bgcolor: "rgba(255,152,0,0.08)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      Venta pendiente sin anticipo
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Total pendiente: <strong>${total.toFixed(2)}</strong>
                    </Typography>

                    {pendingDueAt && (
                      <Typography variant="body2" color="text.secondary">
                        Fecha compromiso:{" "}
                        <strong>
                          {new Date(pendingDueAt).toLocaleString("es-MX")}
                        </strong>
                      </Typography>
                    )}

                    {pendingNote && (
                      <Typography variant="body2" color="text.secondary">
                        Nota: <strong>{pendingNote}</strong>
                      </Typography>
                    )}

                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ mt: 1, textTransform: "none", fontWeight: 800 }}
                      onClick={() => {
                        setEditingAdvance(false);
                        setOpenPendingModal(true);
                        setScannerEnabled?.(false);
                      }}
                    >
                      Editar pendiente
                    </Button>
                  </Box>
                )}

                <Button
                  variant="contained"
                  color={
                    creditSale ? "primary" : pendingSale ? "warning" : "success"
                  }
                  disabled={disableConfirm}
                  onClick={processCheckout}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 900,
                    textTransform: "none",
                  }}
                >
                  {submittingSale
                    ? "Procesando..."
                    : creditSale
                      ? "Guardar venta a Credito"
                      : pendingSale
                        ? "Guardar venta pendiente"
                        : "Confirmar pago"}
                </Button>
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

      <PendingSaleModal
        open={openPendingModal}
        total={total}
        startInAdvance={editingAdvance}
        initialPayment={pendingAdvancePayment}
        initialDueAt={pendingDueAt}
        initialNote={pendingNote}
        onClose={() => {
          setOpenPendingModal(false);
          setEditingAdvance(false);
          setScannerEnabled?.(true);
        }}
        onSelectAdvance={(payload) => {
          setPendingSale(true);
          setCreditSale(false);
          setPendingHasAdvance(true);
          setPendingAdvancePayment(payload.payment);
          setPendingDueAt(payload.pending_due_at);
          setPendingNote(payload.pending_note || "");
          setOpenPendingModal(false);
          setEditingAdvance(false);
          setScannerEnabled?.(true);
        }}
        onSelectNoPayment={(payload) => {
          setPendingSale(true);
          setCreditSale(false);
          setPendingHasAdvance(false);
          setPendingAdvancePayment(null);
          setPendingDueAt(payload.pending_due_at);
          setPendingNote(payload.pending_note || "");
          setOpenPendingModal(false);
          setEditingAdvance(false);
          setScannerEnabled?.(true);
        }}
      />

      <Dialog
        open={openQuickClient}
        onClose={handleCloseQuickClient}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Crear cliente rápido</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre / alias"
              value={quickClientForm.nombre_alias}
              onChange={(e) =>
                setQuickClientForm((prev) => ({
                  ...prev,
                  nombre_alias: e.target.value,
                }))
              }
              fullWidth
              autoFocus
            />

            <TextField
              label="Teléfono"
              value={quickClientForm.telefono}
              onChange={(e) =>
                setQuickClientForm((prev) => ({
                  ...prev,
                  telefono: e.target.value,
                }))
              }
              fullWidth
              inputProps={{ inputMode: "tel" }}
            />

            <Typography variant="caption" color="text.secondary">
              Solo se guardará si la tienda todavía tiene espacio según el plan.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseQuickClient}
            disabled={savingQuickClient}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveQuickClient}
            disabled={savingQuickClient}
            sx={{ textTransform: "none", fontWeight: 800 }}
            startIcon={
              savingQuickClient ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
          >
            {savingQuickClient ? "Guardando..." : "Crear cliente"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
