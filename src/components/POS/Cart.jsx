import useSaleShipment from "../../hooks/POS/useSaleShipment";
import ShipmentFields from "../checkout/ShipmentFields";
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
  FormControlLabel,
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
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
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
  checkoutBlocked = false,
  setScannerEnabled,
  setModalDescuentoActivo,
  setCart,
  posLocationId,
  variant = "desktop",
  classic = false,
}) {
  const isMobile = variant === "mobile";
  const shipment = useSaleShipment(posLocationId);

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
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
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
    let active = true;
    setCreditSale(false);
    setCreditAccount(null);
    if (!selectedClient?.id) { setLoadingCredit(false); return () => { active = false; }; }
    setLoadingCredit(true);
    axiosClient.get(`/pos/credit-client/${selectedClient.id}`)
      .then(({ data }) => { if (active) setCreditAccount(data?.account || null); })
      .catch(() => { if (active) setCreditAccount(null); })
      .finally(() => { if (active) setLoadingCredit(false); });
    return () => { active = false; };
  }, [selectedClient?.id]);

  const changeSaleClient = (client) => {
    if (String(client?.id ?? "") !== String(selectedClient?.id ?? "")) { setCreditSale(false); setCreditAccount(null); setLoadingCredit(Boolean(client?.id)); }
    setSelectedClient(client);
  };

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

  // const payableTotalRounded = Number(payableTotal.toFixed(6));

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
      ? Math.max(0, (toNumber(cashReceived) || 0) - amountToPay)
      : 0;

  const hasCashInMulti = selectedCount >= 2 && selected.includes("efectivo");

  const cambioMulti =
    selectedCount >= 2 && sumSelected > amountToPay && hasCashInMulti
      ? Number((sumSelected - amountToPay).toFixed(6))
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

      const quantity = toNumber(item.quantity);

      const unitPrice = toNumber(item.price);

      const discount = toNumber(item.discount || 0);

      return {
        product_id: baseId,
        variant_id: variantId || null,

        quantity: Number.isFinite(quantity) ? quantity.toFixed(3) : "0.000",

        unit_price: Number.isFinite(unitPrice)
          ? unitPrice.toFixed(6)
          : "0.000000",

        original_price: Number.isFinite(original)
          ? original.toFixed(6)
          : Number.isFinite(unitPrice)
            ? unitPrice.toFixed(6)
            : "0.000000",

        discount_percent: Number.isFinite(discount)
          ? discount.toFixed(2)
          : "0.00",

        warehouse_id: item.warehouse_id ?? null,

        worker_id: item.worker_id ?? null,
      };
    });

  const resetAfterSuccessfulSale = () => {
    setCheckoutStep(0);
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
    if (cart.length === 0 || submittingSale || checkoutBlocked) return;

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

      if (!isUnlimitedCredit && amountToPay > availableCredit) {
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

          if (recibido + 0.000001 < amountToPay) {
            return showError("El efectivo recibido no cubre el total a pagar.");
          }

          const recibido6 = recibido.toFixed(6);

          payments = [
            {
              method: "efectivo",
              amount: recibido6,
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
              amount: amountToPay.toFixed(6),
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

        if (sumaValida + 0.000001 < amountToPay) {
          return showError(
            `Los pagos no cubren el total. Faltan $${Math.max(
              0,
              amountToPay - sumaValida,
            ).toFixed(2)}.`,
          );
        }

        payments = selected.map((m) => {
          const { amount, referencia, ultimos4 } = details[m];

          const value = toNumber(amount);

          const payment = {
            method: m,
            amount: value.toFixed(6),
          };

          if (CARDLIKE.includes(m)) {
            payment.referencia = (referencia || "").trim();

            payment.ultimos_4 = ultimos4 || "";
          }

          return payment;
        });
      }
    }

    const data = {
      total_amount: total.toFixed(6),
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
      const delivery = await shipment.build();
      if (delivery) data.shipment = delivery;
      const sale = await onCheckout(data, { client: selectedClient, creditAccount, creditSale, payableTotal: amountToPay, availableCredit: isUnlimitedCredit ? null : availableCredit, currentBalance });
      if (!sale) return;
      shipment.reset();
      resetAfterSuccessfulSale();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message || "No se pudo registrar la venta.";
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
        discount: nuevoProducto.discount_percent ?? nuevoProducto.discount,
        discount_percent: nuevoProducto.discount_percent ?? nuevoProducto.discount,
        manual_discount: true,
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
    setScannerEnabled?.(!openClientDialog);
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
        changeSaleClient(clienteSeleccionado);
      }

      setOpenQuickClient(false);
      setQuickClientForm({ nombre_alias: "", telefono: "" });
      setScannerEnabled?.(!openClientDialog);
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
      toNumber(cashReceived) + 0.000001 < amountToPay);

  const multiInvalid =
    selectedCount >= 2 &&
    selected
      .map((method) => toNumber(details[method].amount))
      .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0) +
      0.000001 <
      amountToPay;

  const disableConfirm =
    checkoutBlocked ||
    cart.length === 0 ||
    submittingSale ||
    (creditSale && !canUseCredit) ||
    (!creditSale &&
      ((pendingSale && pendingHasAdvance && !pendingAdvancePayment) ||
        (!pendingSale && (paymentInvalid || multiInvalid))));

  const paperSx = {
    display: "block",
    alignItems: "start",
    borderRadius: 3,
    overflow: "hidden",
    background: "#fff",
    borderColor: "rgba(25,28,32,0.12)",
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

  const togglePendingSale = () => {
    if (pendingSale) {
      setPendingSale(false);
      setPendingHasAdvance(false);
      setOpenPendingModal(false);
      setScannerEnabled?.(true);
    } else {
      setPendingSale(true);
      setCreditSale(false);
      setOpenPendingModal(true);
      setScannerEnabled?.(false);
    }
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
      <Box sx={{ containerType: "inline-size" }}>
        <Paper ref={paperRef} variant="outlined" sx={paperSx}>
          {classic ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShoppingCartRoundedIcon fontSize="small" />
                <Typography component="h3" sx={{ fontWeight: 900, fontSize: 21 }}>Carrito</Typography>
                <Chip size="small" label={`${cart.length} producto(s)`} />
              </Stack>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography fontWeight={900}>${amountToPay.toFixed(2)}</Typography>
              </Box>
            </Stack>
          ) : (
          <Box component="nav" aria-label="Pasos de la venta" sx={{ px: { xs: 1, sm: 1.5 }, pt: 1, pb: 1.25, bgcolor: "#1c1f24" }}>
            <Stack direction="row" spacing={0.5}>
              {[{ label: "Orden", Icon: ShoppingCartRoundedIcon }, { label: "Cliente", Icon: PersonOutlineRoundedIcon }, { label: "Pago", Icon: PaymentsRoundedIcon }].map(({ label, Icon }, index) => (
                <Button key={label} onClick={() => setCheckoutStep(index)} disabled={!cart.length && index > 0} aria-current={checkoutStep === index ? "step" : undefined} sx={{ flex: 1, minWidth: 0, px: 0.5, py: 1, gap: 0.5, color: checkoutStep === index ? "#1c1f24" : "#fff", bgcolor: checkoutStep === index ? "#ffba08" : "transparent", borderRadius: 2, textTransform: "none", fontWeight: 800, fontSize: { xs: "0.7rem", sm: "0.8rem" }, "&:hover": { bgcolor: checkoutStep === index ? "#e9a900" : "#34383e" } }}>
                  {index < checkoutStep ? <CheckRoundedIcon fontSize="small" /> : <Icon fontSize="small" />} {label}
                </Button>
              ))}
            </Stack>
            <Box role="progressbar" aria-label="Progreso de la venta" aria-valuemin={1} aria-valuemax={3} aria-valuenow={checkoutStep + 1} sx={{ height: 4, mt: 1, bgcolor: "#4a4d51", borderRadius: 2, overflow: "hidden" }}><Box sx={{ width: `${(checkoutStep + 1) / 3 * 100}%`, height: "100%", bgcolor: "#ffba08", transition: "width .2s ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} /></Box>
          </Box>
          )}
          {cart.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2, gridColumn: "1 / -1" }}>Sin artículos</Typography>
          ) : (
            <>
              {classic && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1, borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
                  <Switch checked={pendingSale} onChange={togglePendingSale} disabled={creditSale} inputProps={{ "aria-label": "Venta pendiente" }} />
                  <Box>
                    <Typography fontWeight={800}>Venta pendiente</Typography>
                    <Typography variant="caption" color="text.secondary">Actívalo si el cliente no pagará completo por ahora.</Typography>
                  </Box>
                </Stack>
              )}
              {(classic || checkoutStep === 0) && <Box component="ul" aria-label="Artículos del carrito" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {cart.map((item) => {
                  const cartKey = getCartKey(item);

                  return (
                    <Box
                      key={cartKey}
                      component="li"
                      sx={{
                        px: 1.75,
                        py: 1.5,
                        borderLeft: "3px solid #ffba08",
                        "&:nth-of-type(even)": { bgcolor: "#fafafa" },
                        "&:hover": { bgcolor: "rgba(255,186,8,0.07)" },
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
                            sx={{ fontWeight: 900, color: "#1c1f24", overflowWrap: "anywhere" }}
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
                            {item.quantity} × ${Number(item.price || 0).toFixed(2)} · $
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
                            sx={{ mt: 0.25 }}
                          >
                            <IconButton
                              size="small"
                              aria-label="Reducir cantidad"
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
                                style: { textAlign: "center", width: 42, padding: "3px 4px" },
                                "aria-label": "Piezas de " + (item.display_name || item.name),
                                inputMode: "decimal",
                                pattern: "[0-9]*[.,]?[0-9]*",
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*\.?\d*$/.test(val)) {
                                  const qty = val === "" || val === "." ? 0 : parseFloat(val);
                                  if (qty > Number(item.stock_available ?? 0)) {
                                    showError("La cantidad supera las existencias de la variante y almacén seleccionados.");
                                    return;
                                  }
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
                              aria-label="Aumentar cantidad"
                              disabled={Math.floor(Number(item.quantity)) + 1 > Number(item.stock_available ?? 0)}
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
                              sx={{ color: "#795900", bgcolor: "#fff2c6", borderRadius: 2 }}
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
                              sx={{ bgcolor: "#fff0ef", borderRadius: 2 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>}

              <Box component="section" aria-label="Cobro" sx={{
                minWidth: 0, p: { xs: 1.5, sm: 2 }, bgcolor: classic ? "#fff" : "#fffdf7",
                borderTop: 1, borderColor: "divider",

              }}>
                {checkoutStep > 0 && <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, color: "text.secondary" }}><Typography variant="body2" fontWeight={700}>Artículos</Typography><Typography variant="body2" fontWeight={900}>{cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</Typography></Stack>}
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  {appliesIsrRetention ? "Total a recibir" : "Total"}
                </Typography>
                <Typography variant={classic ? "h6" : "h4"} sx={{ fontWeight: 900, fontVariantNumeric: "tabular-nums", mb: 1.5 }}>
                  ${amountToPay.toFixed(2)}
                </Typography>

                <Box sx={{ display: classic || checkoutStep === 1 ? "block" : "none" }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>{classic ? "Cliente de la venta" : "Cliente y tipo de venta"}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                  <Button variant="outlined" startIcon={<PersonOutlineRoundedIcon />} onClick={() => { setOpenClientDialog(true); setScannerEnabled?.(false); }} sx={{ flex: 1, minWidth: 0, justifyContent: "flex-start", textTransform: "none", fontWeight: 800, borderRadius: 2, color: "#1c1f24", borderColor: "#d5d5d5", bgcolor: "#fff", "&:hover": { borderColor: "#ffba08", bgcolor: "#fff8e5" } }}>{selectedClient?.nombre_alias || selectedClient?.name || selectedClient?.nombre || (classic ? "Seleccionar cliente" : "Cliente")}</Button>
                  {!classic && <Tooltip title={pendingSale ? "Quitar venta pendiente" : "Venta pendiente"}><span><IconButton aria-label="Venta pendiente" aria-pressed={pendingSale} color={pendingSale ? "warning" : "default"} disabled={creditSale} onClick={togglePendingSale}><PendingActionsRoundedIcon /></IconButton></span></Tooltip>}
                </Stack>
                {selectedClient && <Box sx={{ mt: 1, p: 1.25, border: "1px solid #e7d9ad", borderRadius: 1, bgcolor: "#fffaf0" }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{selectedClient.nombre_alias || selectedClient.name || selectedClient.nombre}</Typography>
                  {selectedClient.telefono && <Typography variant="caption" display="block" color="text.secondary">{selectedClient.telefono}</Typography>}
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 800, color: creditSale ? "#795900" : "text.secondary" }}>
                    {loadingCredit ? "Consultando fiado..." : creditSale ? (isUnlimitedCredit ? "Venta a fiado - sin límite" : `Venta a fiado - disponible: $${availableCredit.toFixed(2)}`) : !hasCreditAccount ? "Sin cuenta de fiado" : !creditActive ? "Fiado desactivado" : isUnlimitedCredit ? "Fiado disponible sin límite" : `Fiado disponible: $${availableCredit.toFixed(2)}`}
                  </Typography>
                  {creditSale && <Typography variant="caption" display="block">Saldo anterior: ${currentBalance.toFixed(2)}</Typography>}
                  {creditSale && creditAccount?.payment_due_date && <Typography variant="caption" display="block">Fecha de pago: {String(creditAccount.payment_due_date).slice(0, 10)}</Typography>}
                </Box>}
                {pendingSale && <Chip size="small" color="warning" sx={{ mt: 1 }} label={pendingHasAdvance ? "Pendiente con anticipo" : "Pendiente sin anticipo"} />}
                  <Box sx={{ my: 2 }}>
                    {shipment.loading && <Typography role="status">Consultando opciones de envío…</Typography>}
                    {shipment.error && <Typography color="error">{shipment.error} <Button onClick={shipment.refresh}>Reintentar envíos</Button></Typography>}
                    <ShipmentFields config={shipment.config} value={shipment.values} onChange={shipment.setValues} disabled={submittingSale} />
                    {shipment.values.shipping_method_id && !shipment.config?.enabled && <Button disabled={submittingSale} onClick={shipment.reset}>Quitar entrega seleccionada</Button>}
                  </Box>
                <IsrRetentionPreview clientId={selectedClient?.id ?? null} totalAmount={total} onChange={handleRetentionChange} />
                <Dialog open={openClientDialog} onClose={() => { setOpenClientDialog(false); setScannerEnabled?.(true); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1.5, sm: 4 }, "& .MuiDialogActions-root": { p: 2 }, "& .MuiButton-root": { textTransform: "none", fontWeight: 800 } } }}>
                  <DialogTitle sx={{ bgcolor: "#1c1f24", color: "#ffba08", fontWeight: 900, borderTop: "4px solid #ffba08" }}>Cliente</DialogTitle>
                  <DialogContent dividers>
                  {!loadingClients && clients.length > 0 && (
                    <SaleClientAssign
                      clients={clients}
                      value={selectedClient}
                      onChange={changeSaleClient}
                      loading={loadingClients}
                    />
                  )}

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
                        onClick={() => changeSaleClient(null)}
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
                            Fiado
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
                      <Stack spacing={0.7} sx={{ mt: 1 }}>
                        <Chip
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 800 }}
                          label={
                            creditAccount?.payment_due_date
                              ? `Fecha de pago: ${String(
                                  creditAccount.payment_due_date,
                                ).slice(0, 10)}`
                              : "Sin fecha límite"
                          }
                        />

                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Monto a crédito: ${amountToPay.toFixed(2)}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                )}

                  </DialogContent>
                  <DialogActions><Button onClick={() => { setOpenClientDialog(false); setScannerEnabled?.(true); }}>Listo</Button></DialogActions>
                </Dialog>

                </Box>
                <Box sx={{ display: classic || checkoutStep === 2 ? "block" : "none" }}>
                {!pendingSale && !creditSale && (
                  <Box sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 1, "& fieldset": { borderColor: "#b9b9b9" }, "&:hover fieldset": { borderColor: "#1c1f24" }, "&.Mui-focused fieldset": { borderColor: "#d49a00" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#775800" } }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800 }}
                      gutterBottom
                    >
                      Método(s) de pago (máx. 3)
                    </Typography>

                    <Stack spacing={0.75}>
                      {METHODS.map(({ key, label }) => {
                        const isChecked = selected.includes(key);
                        const d = details[key];

                        return (
                          <Box key={key}>
                            <Button
                              fullWidth
                              variant="outlined"
                              aria-pressed={isChecked}
                              disabled={!isChecked && selectedCount >= 3}
                              onClick={() => toggleMethod(key)}
                              sx={{ minHeight: 48, justifyContent: "flex-start", textTransform: "none", fontWeight: 800, borderRadius: 1, borderColor: isChecked ? "#d49a00" : "#c8c8c8", color: "#1c1f24", bgcolor: isChecked ? "#fff4d0" : "#fff", "&:hover": { bgcolor: "#fff5d9", borderColor: "#d49a00" }, "&.Mui-disabled": { color: "#888", borderColor: "#dedede" } }}
                            >
                              {isChecked ? <CheckBoxRoundedIcon aria-hidden="true" sx={{ mr: 1.25, color: "#b48100" }} /> : <CheckBoxOutlineBlankRoundedIcon aria-hidden="true" sx={{ mr: 1.25, color: "#777" }} />}
                              {label}
                            </Button>

                            {isChecked && (
                              <Box sx={{ p: 1.25, pt: 0.75, mb: 0.5, border: "1px solid #e5d6ab", borderTop: 0, borderRadius: "0 0 4px 4px", bgcolor: "#fffdf7" }}>
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
                                        Se cobrarán{" "}
                                        <strong>
                                          ${amountToPay.toFixed(2)}
                                        </strong>{" "}
                                        con <strong>{label}</strong>.
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

                </Box>
                <Box sx={{ display: classic || checkoutStep === 2 ? "block" : "none" }}>
                {selectedClient && <Box sx={{ mb: 1.5, p: 1.25, bgcolor: "#fff8e5", border: "1px solid #e7d9ad", borderRadius: 1 }}><Typography variant="body2" fontWeight={900}>{selectedClient.nombre_alias || selectedClient.name || selectedClient.nombre}</Typography>{selectedClient.telefono && <Typography variant="caption" display="block">{selectedClient.telefono}</Typography>}<Typography variant="caption" display="block">{creditSale ? (isUnlimitedCredit ? "Venta a fiado - sin límite" : `Venta a fiado - disponible: ${availableCredit.toFixed(2)}`) : pendingSale ? "Venta pendiente" : "Venta de contado"}</Typography>{creditSale && creditAccount?.payment_due_date && <Typography variant="caption" display="block">Fecha de pago: {String(creditAccount.payment_due_date).slice(0, 10)}</Typography>}</Box>}
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
                          amountToPay -
                            Number(pendingAdvancePayment.amount || 0),
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
                      Total pendiente:
                      <strong>${amountToPay.toFixed(2)}</strong>
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
                    bgcolor: "#ffba08", color: "#1c1f24", boxShadow: "none",
                    "&:hover": { bgcolor: "#e9a900" },
                  }}
                >
                  {submittingSale
                    ? "Procesando..."
                    : creditSale
                      ? `Guardar crédito $${amountToPay.toFixed(2)}`
                      : pendingSale
                        ? `Guardar pendiente $${amountToPay.toFixed(2)}`
                        : `Cobrar $${amountToPay.toFixed(2)}`}
                </Button>
                </Box>
                {!classic && <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  {checkoutStep > 0 && <Button variant="outlined" color="inherit" onClick={() => setCheckoutStep(checkoutStep - 1)} sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 800 }}>Anterior</Button>}
                  {checkoutStep < 2 && <Button variant="contained" onClick={() => setCheckoutStep(checkoutStep + 1)} sx={{ flex: 1, bgcolor: "#ffba08", color: "#1c1f24", borderRadius: 2, textTransform: "none", fontWeight: 900, boxShadow: "none", "&:hover": { bgcolor: "#e9a900" } }}>Continuar</Button>}
                </Stack>}
              </Box>
            </>
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
        total={amountToPay}
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
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1.5, sm: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, bgcolor: "#1c1f24", color: "#ffba08", borderTop: "4px solid #ffba08" }}>Crear cliente rápido</DialogTitle>

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
