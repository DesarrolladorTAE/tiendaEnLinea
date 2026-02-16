import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  Chip,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SecurityIcon from "@mui/icons-material/Security";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// ✅ usa tus alerts (ajusta el path si tu modal está en otra carpeta)
import { showSuccess, showError, alertFromAxiosError } from "../../utils/alerts";

const API_BASE = "https://mitiendaenlineamx.com.mx/api";

/** Formatea moneda MX */
const moneyMX = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

/** respeta espacios; si viene con guiones los cambia por espacios; si viene todo junto lo deja junto */
const formatBankNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (/\s/.test(raw)) return raw.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (/-/.test(raw)) return raw.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  return raw.replace(/[^\d]/g, "");
};

function InfoDot({ title }) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton size="small" sx={{ p: 0.25, opacity: 0.75 }}>
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

const paymentTypeLabel = (t) => {
  const v = String(t || "").toLowerCase();
  if (v === "transferencia") return "Transferencia";
  if (v === "deposito") return "Depósito";
  if (v === "oxxo") return "Pago en OXXO";
  return "Pago";
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

export default function CheckoutPayModal({
  open,
  onClose,
  storeSlug,
  storePhone,
  storeName,
  items,
  total,
  onClearCart,
}) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState({
    store_id: null,
    paypal: null,
    offline: null, // { ok, accounts: [...] }
  });

  const [tab, setTab] = useState("choose"); // paypal | offline

  // Offline form
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    address_details: "",
    notes: "",
    payment_account_id: "",
    shipping_amount: "", // sigue existiendo por si luego lo reactivas
  });

  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState("");

  const hasItems = Array.isArray(items) && items.length > 0;

  // ---------- Lazy load: solo cuando abres modal ----------
  useEffect(() => {
    let alive = true;
    if (!open) return;

    setUiError("");
    setTab("choose");
    setLoading(true);

    (async () => {
      try {
        // 1) resolver store_id por bootstrap
        const boot = await axios.get(`${API_BASE}/public/tienda/${storeSlug}/bootstrap`);
        const store_id = boot?.data?.id_store ?? null;

        if (!store_id) throw new Error("No se pudo obtener la tienda.");

        // 2) cuentas de pago PUBLICAS (máx 3 activas)
        const accountsRes = await axios.get(
          `${API_BASE}/public/stores/${storeSlug}/payment-accounts`
        );

        const offline = {
          ok: !!accountsRes?.data?.ok,
          accounts: Array.isArray(accountsRes?.data?.accounts) ? accountsRes.data.accounts : [],
        };

        // 3) paypal creds (si falla => null)
        let paypal = null;
        try {
          const pp = await axios.get(`${API_BASE}/public/paypal/${store_id}/sdk-credentials`);
          const clientId = pp?.data?.client_id || null;
          if (clientId) {
            paypal = {
              client_id: clientId,
              currency: String(pp?.data?.currency || "MXN").toUpperCase(),
              mode: pp?.data?.mode || "sandbox",
              brand: pp?.data?.brand || storeName || "Mi Tienda",
            };
          }
        } catch {
          paypal = null;
        }

        if (!alive) return;

        setCapabilities({ store_id, paypal, offline });

        // tab default
        if (paypal?.client_id) setTab("paypal");
        else if (offline.ok && offline.accounts.length) setTab("offline");
        else setTab("choose");
      } catch (e) {
        if (!alive) return;
        setUiError("No se pudo cargar la información de pago. Intenta de nuevo.");
        setCapabilities({ store_id: null, paypal: null, offline: null });
        setTab("choose");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, storeSlug, storeName]);

  const paypalProviderOptions = useMemo(() => {
    if (!capabilities?.paypal?.client_id) return null;
    return {
      clientId: capabilities.paypal.client_id,
      currency: capabilities.paypal.currency || "MXN",
      intent: "capture",
      locale: "es_MX",
    };
  }, [capabilities?.paypal?.client_id, capabilities?.paypal?.currency]);

  const canShowPaypal = !!capabilities?.paypal?.client_id;
  const offlineAccounts = capabilities?.offline?.accounts || [];
  const canShowOffline = !!capabilities?.offline?.ok && offlineAccounts.length > 0;

  const convinceText = useMemo(() => {
    return "Paga en segundos y aparta tu pedido antes de que se agote. Tu pago queda registrado y la tienda lo confirma para preparar tu entrega.";
  }, []);

  const orderCount = useMemo(
    () => (Array.isArray(items) ? items.reduce((a, it) => a + (Number(it.qty ?? 1) || 1), 0) : 0),
    [items]
  );

  const offlineSelectedAccount = useMemo(() => {
    const id = String(form.payment_account_id || "");
    return offlineAccounts.find((a) => String(a.id) === id) || null;
  }, [offlineAccounts, form.payment_account_id]);

  const requireMsg = (cond, msg) => (cond ? null : msg);

  // ✅ Obligatorio TODO excepto notas
  // ✅ Comprobante: OBLIGATORIO (porque tú lo marcaste así)
  const validateOffline = () => {
    const errors = [];

    errors.push(requireMsg(form.full_name.trim().length >= 3, "Escribe tu nombre completo."));

    errors.push(
      requireMsg(
        /^\d{10}$/.test(String(form.phone || "").replace(/\D/g, "")),
        "Tu WhatsApp debe tener 10 dígitos."
      )
    );

    errors.push(requireMsg(isValidEmail(form.email), "Escribe un correo válido."));

    errors.push(requireMsg(form.address.trim().length >= 5, "Escribe tu dirección."));

    errors.push(
      requireMsg(
        form.address_details.trim().length >= 3,
        "Agrega referencias o detalles de tu dirección."
      )
    );

    errors.push(requireMsg(!!form.payment_account_id, "Selecciona una cuenta para pagar."));

    // ✅ comprobante obligatorio
    errors.push(requireMsg(!!proofFile, "Sube tu comprobante (JPG/PNG/PDF)."));

    return errors.filter(Boolean);
  };

  const buildOfflinePayload = () => {
    const mappedItems = (items || []).map((it) => ({
      product_id: Number(it.product_id ?? it.id),
      variant_id: it.variant_id ?? it.variation_size_id ?? null,
      warehouse_id: it.warehouse_id ?? null,
      quantity: Number(it.qty ?? 1),
      unit_price: Number(it.price ?? 0),
      original_price: Number(it.original_price ?? it.price ?? 0),
      discount_percent: Number(it.discount_percent ?? it.discount ?? 0),
    }));

    const fd = new FormData();
    fd.append("store_slug", storeSlug);

    // ✅ si tu backend todavía no lo recibe, NO rompe nada; solo lo mandamos
    if (storeName) fd.append("store_name", storeName);
    if (storePhone) fd.append("store_phone", String(storePhone));

    fd.append("full_name", form.full_name.trim());
    fd.append("phone", String(form.phone).replace(/\D/g, ""));
    fd.append("email", String(form.email).trim());
    fd.append("address", form.address.trim());
    fd.append("address_details", form.address_details.trim());
    if (form.notes) fd.append("notes", form.notes); // 👈 único opcional
    fd.append("payment_account_id", String(form.payment_account_id));

    // shipping_amount sigue disponible por si lo reactivas
    if (form.shipping_amount !== "" && form.shipping_amount != null) {
      const n = Number(form.shipping_amount);
      if (Number.isFinite(n)) fd.append("shipping_amount", String(n));
    }

    fd.append("items", JSON.stringify(mappedItems));

    // ✅ comprobante obligatorio
    if (proofFile) fd.append("proof_file", proofFile);

    return fd;
  };

  // ✅ usa SweetAlert2 helpers
  const submitOffline = async () => {
    const errs = validateOffline();
    if (errs.length) {
      showError(errs[0]);
      return;
    }

    setSubmitting(true);
    try {
      const fd = buildOfflinePayload();

      const { data } = await axios.post(`${API_BASE}/public/offline-orders`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data?.ok) {
        showError(data?.message || "No se pudo enviar el pedido.");
        return;
      }

      onClearCart?.();
      onClose?.();

      showSuccess("✅ Listo. Tu pedido fue enviado y está en revisión de pago.");
    } catch (e) {
      alertFromAxiosError(e, "No se pudo enviar el pedido. Revisa tus datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // PayPal
  const paypalCreateOrder = async () => {
    if (!capabilities?.store_id) throw new Error("storeId requerido");
    if (total <= 0) throw new Error("Total inválido");

    const currency = (capabilities?.paypal?.currency || "MXN").toUpperCase();

    const { data } = await axios.post(
      `${API_BASE}/public/paypal/${capabilities.store_id}/order`,
      {
        amount: Number(total.toFixed(2)),
        currency,
        reference_id: `STORE-${capabilities.store_id}-${Date.now()}`,
        items: (items || []).map((it) => ({
          name: String(it.name || "Producto").slice(0, 127),
          quantity: String(Number(it.qty ?? 1) || 1),
          unit_amount: {
            value: Number(it.price ?? 0).toFixed(2),
            currency_code: currency,
          },
          product_id: it.product_id ?? it.id,
          variation_size_id: it.variation_size_id ?? it.variant_id ?? null,
          unit_price: Number(it.price ?? 0).toFixed(2),
        })),
      }
    );

    if (!data?.ok || !data?.order_id) {
      throw new Error(data?.message || "No se pudo crear la orden de PayPal");
    }
    return data.order_id;
  };

  const paypalOnApprove = async (data) => {
    const order_id = data?.orderID;
    if (!order_id) throw new Error("orderID faltante");

    const res = await axios.post(`${API_BASE}/public/paypal/${capabilities.store_id}/capture`, {
      order_id,
    });

    if (!res.data?.ok) {
      showSuccess("✅ Tu pedido está casi listo. Comunícate con la tienda para confirmar el pago.");
      return;
    }

    onClearCart?.();
    onClose?.();
    showSuccess("✅ Pago realizado correctamente.");
  };

  const title = storeName ? `Pagar en ${storeName}` : "Pagar pedido";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          bgcolor: "#fff",
          border: "1px solid rgba(0,0,0,.08)",
          boxShadow: "0 18px 50px rgba(0,0,0,.10)",
        },
      }}
    >
      <DialogTitle sx={{ p: 2.2, color: "#0f172a" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography sx={{ color: "rgba(15,23,42,.70)", fontSize: 12, mt: 0.5 }}>
              {convinceText}
            </Typography>
          </Box>

          <IconButton onClick={onClose} sx={{ color: "rgba(15,23,42,.75)" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ borderColor: "rgba(0,0,0,.08)" }} />

      <DialogContent sx={{ p: { xs: 2, md: 2.5 }, color: "#0f172a" }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: "rgba(15,23,42,.75)", fontSize: 13 }}>
              Preparando opciones de pago…
            </Typography>
          </Stack>
        ) : (
          <>
            {!!uiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uiError}
              </Alert>
            )}

            {/* Resumen */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                mb: 2,
                bgcolor: "rgba(15,23,42,.03)",
                border: "1px solid rgba(15,23,42,.08)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack spacing={0.6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ReceiptLongIcon sx={{ opacity: 0.85 }} />
                    <Typography sx={{ fontWeight: 900 }}>Resumen de tu pedido</Typography>
                    <Chip
                      label={`${orderCount} artículo(s)`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(15,23,42,.06)",
                        color: "#0f172a",
                        borderRadius: 2,
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <Typography sx={{ color: "rgba(15,23,42,.75)", fontSize: 12 }}>
                    Total a pagar: <b style={{ fontSize: 14 }}>{moneyMX(total)}</b>
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<SecurityIcon />}
                    label="Pago seguro"
                    size="small"
                    sx={{
                      bgcolor: "rgba(34,197,94,.12)",
                      color: "#14532d",
                      borderRadius: 2,
                      ".MuiChip-icon": { color: "#14532d" },
                      fontWeight: 800,
                    }}
                  />
                  <Chip
                    icon={<LocalShippingIcon />}
                    label="Confirmación rápida"
                    size="small"
                    sx={{
                      bgcolor: "rgba(59,130,246,.12)",
                      color: "#1e3a8a",
                      borderRadius: 2,
                      ".MuiChip-icon": { color: "#1e3a8a" },
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>

            {!canShowPaypal && !canShowOffline ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: 2.5,
                  bgcolor: "rgba(15,23,42,.03)",
                  border: "1px solid rgba(15,23,42,.08)",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                  Por ahora la tienda no tiene pagos habilitados aquí.
                </Typography>
                <Typography sx={{ color: "rgba(15,23,42,.75)", fontSize: 12 }}>
                  Puedes realizar tu pedido por WhatsApp para que te indiquen cómo pagar.
                </Typography>
              </Paper>
            ) : (
              <>
                {/* Tabs */}
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                  {canShowPaypal && (
                    <Button
                      onClick={() => setTab("paypal")}
                      variant={tab === "paypal" ? "contained" : "outlined"}
                      sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        borderRadius: 2,
                        ...(tab === "paypal"
                          ? { bgcolor: "#0f172a", color: "#fff" }
                          : { borderColor: "rgba(15,23,42,.25)", color: "#0f172a" }),
                      }}
                    >
                      Pagar con PayPal
                    </Button>
                  )}

                  {canShowOffline && (
                    <Button
                      onClick={() => setTab("offline")}
                      variant={tab === "offline" ? "contained" : "outlined"}
                      sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        borderRadius: 2,
                        ...(tab === "offline"
                          ? { bgcolor: "#0f172a", color: "#fff" }
                          : { borderColor: "rgba(15,23,42,.25)", color: "#0f172a" }),
                      }}
                    >
                      Transferencia / Depósito / OXXO
                    </Button>
                  )}
                </Stack>

                {/* PAYPAL */}
                {tab === "paypal" && canShowPaypal && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      border: "1px solid rgba(15,23,42,.10)",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography sx={{ fontWeight: 900 }}>Paga con PayPal</Typography>
                      <Typography sx={{ color: "rgba(15,23,42,.65)", fontSize: 12 }}>
                        {capabilities?.paypal?.currency} · {capabilities?.paypal?.mode}
                      </Typography>
                    </Stack>

                    <Typography sx={{ color: "rgba(15,23,42,.75)", fontSize: 12, mb: 1.5 }}>
                      Recomendado si quieres pagar al instante y confirmar tu pedido más rápido.
                    </Typography>

                    {paypalProviderOptions && (
                      <PayPalScriptProvider options={paypalProviderOptions}>
                        <PayPalButtons
                          style={{ layout: "vertical" }}
                          disabled={!hasItems || total <= 0}
                          createOrder={paypalCreateOrder}
                          onApprove={paypalOnApprove}
                          onError={(err) => {
                            console.error("❌ PayPal error:", err);
                            showError("Ocurrió un error con PayPal. Intenta de nuevo.");
                          }}
                        />
                      </PayPalScriptProvider>
                    )}
                  </Paper>
                )}

                {/* OFFLINE */}
                {tab === "offline" && canShowOffline && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      border: "1px solid rgba(15,23,42,.10)",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 900 }}>
                          Pago por transferencia / depósito / OXXO
                        </Typography>
                        <Chip
                          icon={<SecurityIcon />}
                          label="Comprobante obligatorio"
                          size="small"
                          sx={{
                            bgcolor: "rgba(239,68,68,.12)",
                            color: "#7f1d1d",
                            ".MuiChip-icon": { color: "#7f1d1d" },
                            fontWeight: 800,
                          }}
                        />
                      </Stack>

                      <Typography sx={{ color: "rgba(15,23,42,.75)", fontSize: 12 }}>
                        Selecciona la cuenta a la que vas a pagar y luego llena tus datos para generar el pedido.
                      </Typography>

                      {/* Cards de cuentas */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.6,
                          borderRadius: 2.5,
                          bgcolor: "rgba(15, 23, 42, 0.03)",
                          border: "1px solid rgba(15,23,42,.08)",
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                            1) Selecciona la cuenta a la que vas a pagar
                          </Typography>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                              gap: 1.2,
                              mt: 0.5,
                            }}
                          >
                            {offlineAccounts.map((a) => {
                              const selected = String(form.payment_account_id) === String(a.id);

                              return (
                                <Paper
                                  key={a.id}
                                  role="button"
                                  onClick={() =>
                                    setForm((s) => ({
                                      ...s,
                                      payment_account_id: String(a.id),
                                    }))
                                  }
                                  elevation={0}
                                  sx={{
                                    p: 1.4,
                                    borderRadius: 2.2,
                                    cursor: "pointer",
                                    border: selected
                                      ? "2px solid #0ea5e9"
                                      : "1px solid rgba(15,23,42,.10)",
                                    bgcolor: selected ? "rgba(14,165,233,.08)" : "#fff",
                                    transition: "all .15s ease",
                                    "&:hover": {
                                      transform: "translateY(-2px)",
                                      boxShadow: "0 10px 25px rgba(15,23,42,.10)",
                                    },
                                  }}
                                >
                                  <Stack spacing={0.6}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                      <Chip
                                        label={paymentTypeLabel(a.type)}
                                        size="small"
                                        sx={{
                                          bgcolor: "rgba(15,23,42,.06)",
                                          color: "#0f172a",
                                          fontWeight: 800,
                                        }}
                                      />
                                      {selected && (
                                        <Chip
                                          label="Seleccionada"
                                          size="small"
                                          sx={{
                                            bgcolor: "rgba(14,165,233,.20)",
                                            color: "#0369a1",
                                            fontWeight: 900,
                                          }}
                                        />
                                      )}
                                    </Stack>

                                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                                      {a.bank_name || "Cuenta de pago"}
                                    </Typography>

                                    {!!a.beneficiary_name && (
                                      <Typography sx={{ fontSize: 12, color: "rgba(15,23,42,.80)" }}>
                                        <b>Beneficiario:</b> {a.beneficiary_name}
                                      </Typography>
                                    )}

                                    {!!a.account_number && (
                                      <Typography sx={{ fontSize: 12, color: "rgba(15,23,42,.80)" }}>
                                        <b>Cuenta:</b> {formatBankNumber(a.account_number)}
                                      </Typography>
                                    )}

                                    {!!a.clabe && (
                                      <Typography sx={{ fontSize: 12, color: "rgba(15,23,42,.80)" }}>
                                        <b>CLABE:</b> {formatBankNumber(a.clabe)}
                                      </Typography>
                                    )}

                                    {(a.reference_label || a.reference_value) && (
                                      <Typography sx={{ fontSize: 12, color: "rgba(15,23,42,.80)" }}>
                                        <b>{a.reference_label || "Referencia"}:</b> {a.reference_value || "—"}
                                      </Typography>
                                    )}

                                    {!!a.instructions && (
                                      <Typography sx={{ fontSize: 11.5, color: "rgba(15,23,42,.70)" }}>
                                        {a.instructions}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Box>

                          {!form.payment_account_id && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              Selecciona una cuenta para continuar.
                            </Alert>
                          )}
                        </Stack>
                      </Paper>

                      {!!offlineSelectedAccount && (
                        <Alert severity="success">
                          Vas a pagar a: <b>{offlineSelectedAccount.bank_name || "Cuenta seleccionada"}</b>
                        </Alert>
                      )}

                      <Divider sx={{ borderColor: "rgba(0,0,0,.08)" }} />

                      {/* Form */}
                      <Stack spacing={1.4}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                                Nombre completo
                              </Typography>
                              <InfoDot title="Como aparece en tu comprobante o identificación." />
                            </Stack>
                            <TextField
                              required
                              fullWidth
                              value={form.full_name}
                              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                              placeholder="Ej. Luis Hernández Ramírez"
                              variant="outlined"
                              InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                            />
                          </Box>

                          <Box sx={{ width: { xs: "100%", sm: 220 } }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>WhatsApp</Typography>
                              <InfoDot title="10 dígitos. Aquí te pueden confirmar tu pago." />
                            </Stack>
                            <TextField
                              required
                              fullWidth
                              value={form.phone}
                              onChange={(e) =>
                                setForm((s) => ({
                                  ...s,
                                  phone: String(e.target.value).replace(/[^\d]/g, "").slice(0, 10),
                                }))
                              }
                              placeholder="10 dígitos"
                              variant="outlined"
                              InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                            />
                          </Box>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Correo</Typography>
                              <InfoDot title="Necesario para seguimiento del pedido." />
                            </Stack>
                            <TextField
                              required
                              fullWidth
                              value={form.email}
                              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                              placeholder="Ej. correo@dominio.com"
                              variant="outlined"
                              InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                            />
                          </Box>
                        </Stack>

                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Dirección</Typography>
                            <InfoDot title="Calle, número, colonia y ciudad." />
                          </Stack>
                          <TextField
                            required
                            fullWidth
                            value={form.address}
                            onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                            placeholder="Ej. Av. Principal 123, Col. Centro, CDMX"
                            variant="outlined"
                            InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                          />
                        </Box>

                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                              Referencias / detalles
                            </Typography>
                            <InfoDot title="Entre calles, color de casa, indicaciones." />
                          </Stack>
                          <TextField
                            required
                            fullWidth
                            multiline
                            minRows={2}
                            value={form.address_details}
                            onChange={(e) => setForm((s) => ({ ...s, address_details: e.target.value }))}
                            placeholder="Ej. Puerta negra, tocar timbre, dejar con el guardia…"
                            variant="outlined"
                            InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                          />
                        </Box>

                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Notas (opcional)</Typography>
                            <InfoDot title="Horario para recibir, petición especial, etc." />
                          </Stack>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={form.notes}
                            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                            placeholder="Ej. Entregar después de las 5pm…"
                            variant="outlined"
                            InputProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
                          />
                        </Box>

                        {/* Comprobante */}
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                              Comprobante (Obligatorio)
                            </Typography>
                            <InfoDot title="Sube captura o PDF del pago." />
                          </Stack>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", sm: "center" }}
                          >
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<UploadFileIcon />}
                              sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                fontWeight: 900,
                                borderColor: "rgba(15,23,42,.25)",
                                color: "#0f172a",
                              }}
                            >
                              Subir archivo
                              <input
                                hidden
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  setProofFile(f);
                                }}
                              />
                            </Button>

                            <Typography sx={{ color: "rgba(15,23,42,.75)", fontSize: 12 }}>
                              {proofFile ? `Archivo: ${proofFile.name}` : "No has subido archivo."}
                            </Typography>
                          </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(0,0,0,.08)" }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                          <Button
                            onClick={submitOffline}
                            disabled={submitting || !hasItems}
                            variant="contained"
                            sx={{
                              textTransform: "none",
                              borderRadius: 2.2,
                              fontWeight: 900,
                              px: 2.2,
                              bgcolor: "#0f172a",
                              color: "#fff",
                              "&:hover": { bgcolor: "#111c33" },
                            }}
                          >
                            {submitting ? "Enviando…" : "Enviar pedido para confirmar pago"}
                          </Button>

                          <Typography sx={{ color: "rgba(15,23,42,.70)", fontSize: 12 }}>
                            Al enviar, tu pedido queda en revisión y la tienda lo confirma.
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
