import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    LinearProgress,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";
import TicketPreviewSendModal from "./TicketPreviewSendModal";

const PAYMENT_METHODS = [
    { key: "efectivo", label: "Efectivo" },
    { key: "td", label: "Tarjeta débito" },
    { key: "tc", label: "Tarjeta crédito" },
    { key: "transferencia", label: "Transferencia" },
];

const CARDLIKE = ["td", "tc", "transferencia"];

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function PendingSalesPOS({ cambiarVista, posLocationId }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedSale, setSelectedSale] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);

    const [ticketOpen, setTicketOpen] = useState(false);
    const [ticketSale, setTicketSale] = useState(null);

    const [paymentForm, setPaymentForm] = useState({
        method: "efectivo",
        amount: "",
        referencia: "",
        ultimos_4: "",
    });

    const fetchPendingSales = async () => {
        try {
            setLoading(true);

            const { data } = await axiosClient.get("/v2/sales/pending", {
                params: { pos_location_id: posLocationId },
            });

            const list = data?.sales || [];
            setSales(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error(error);
            showError("No se pudieron cargar las ventas pendientes.");
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingSales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posLocationId]);

    const getPaid = (sale) => {
        if (Number(sale?.paid_amount || 0) > 0) return Number(sale.paid_amount || 0);

        if (Array.isArray(sale?.payments)) {
            return sale.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
        }

        return 0;
    };

    const getPending = (sale) => {
        const total = Number(sale?.total_amount || 0);
        const paid = getPaid(sale);
        return Math.max(0, total - paid);
    };

    const totals = useMemo(() => {
        return sales.reduce(
            (acc, sale) => {
                const total = Number(sale.total_amount || 0);
                const paid = getPaid(sale);
                const pending = Math.max(0, total - paid);

                acc.total += total;
                acc.paid += paid;
                acc.pending += pending;

                return acc;
            },
            { total: 0, paid: 0, pending: 0 }
        );
    }, [sales]);

    const openTicket = (sale) => {
        setTicketSale(sale);
        setTicketOpen(true);
    };

    const openDetails = (sale) => {
        setSelectedSale(sale);
        setDetailsOpen(true);
    };

    const openPayment = (sale) => {
        const pending = getPending(sale);

        setSelectedSale(sale);
        setPaymentForm({
            method: "efectivo",
            amount: pending.toFixed(2),
            referencia: "",
            ultimos_4: "",
        });
        setPaymentOpen(true);
    };

    const closePayment = () => {
        if (savingPayment) return;
        setPaymentOpen(false);
        setPaymentForm({
            method: "efectivo",
            amount: "",
            referencia: "",
            ultimos_4: "",
        });
    };

    const handleAddPayment = async () => {
        if (!selectedSale) return;

        const amount = Number(paymentForm.amount);
        const pending = getPending(selectedSale);

        if (!Number.isFinite(amount) || amount <= 0) {
            showError("Ingresa un monto válido.");
            return;
        }

        if (amount > pending) {
            showError(`El pago excede el saldo pendiente. Máximo: ${money(pending)}`);
            return;
        }

        if (CARDLIKE.includes(paymentForm.method) && !paymentForm.referencia.trim()) {
            showError("Ingresa la referencia del pago.");
            return;
        }

        if (
            (paymentForm.method === "td" || paymentForm.method === "tc") &&
            paymentForm.ultimos_4.length !== 4
        ) {
            showError("Ingresa los últimos 4 dígitos.");
            return;
        }

        try {
            setSavingPayment(true);

            const payload = {
                payments: [
                    {
                        method: paymentForm.method,
                        amount: Number(amount.toFixed(2)),
                        referencia: paymentForm.referencia?.trim() || "",
                        ...(paymentForm.method === "td" || paymentForm.method === "tc"
                            ? { ultimos_4: paymentForm.ultimos_4 }
                            : {}),
                    },
                ],
            };

            const { data } = await axiosClient.post(
                `/v2/sales/${selectedSale.id}/add-payment`,
                payload
            );

            const updatedSale = data?.sale;
            const status = data?.status;
            const remaining = Number(data?.remaining_amount || 0);

            showSuccess(data?.message || "Abono registrado correctamente.");

            setPaymentOpen(false);

            if (status === "paid" || remaining <= 0) {
                setSales((prev) =>
                    prev.filter((sale) => String(sale.id) !== String(selectedSale.id))
                );

                setSelectedSale(updatedSale || { ...selectedSale, status: "paid" });
                setDetailsOpen(false);

                const shouldPrint = window.confirm(
                    "La venta quedó pagada completamente. ¿Deseas imprimir/ver el ticket actualizado?"
                );

                if (shouldPrint) {
                    openTicket(updatedSale || selectedSale);
                }
            } else {
                await fetchPendingSales();
            }
        } catch (error) {
            console.error(error);

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "No se pudo registrar el abono.";

            showError(msg);
        } finally {
            setSavingPayment(false);
        }
    };

    return (
        <Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                mb={2}
            >
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => cambiarVista("menu")}
                    sx={{ borderRadius: 3, fontWeight: 900, textTransform: "none" }}
                >
                    Volver al panel
                </Button>

                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={fetchPendingSales}
                    disabled={loading}
                    sx={{
                        borderRadius: 3,
                        fontWeight: 900,
                        textTransform: "none",
                        background: "linear-gradient(135deg,#f59e0b,#f97316)",
                        boxShadow: "0 12px 28px rgba(245,158,11,.25)",
                    }}
                >
                    Actualizar
                </Button>
            </Stack>

            <Paper
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 5,
                    mb: 2,
                    color: "#111827",
                    background:
                        "linear-gradient(135deg, rgba(255,247,237,1) 0%, rgba(255,255,255,1) 55%)",
                    border: "1px solid rgba(245,158,11,.25)",
                    boxShadow: "0 18px 50px rgba(0,0,0,.08)",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WarningAmberIcon sx={{ color: "#f59e0b" }} />
                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                Ventas pendientes
                            </Typography>
                        </Stack>

                        <Typography color="text.secondary">
                            Controla ventas abiertas, anticipos y saldos por liquidar.
                        </Typography>
                    </Box>

                    <Chip
                        color="warning"
                        label={`${sales.length} venta(s) abierta(s)`}
                        sx={{ fontWeight: 900, alignSelf: { xs: "flex-start", md: "center" } }}
                    />
                </Stack>

                <Grid container spacing={1.5} mt={2}>
                    <Grid item xs={12} md={4}>
                        <SummaryCard title="Total vendido" value={money(totals.total)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SummaryCard title="Pagado / anticipos" value={money(totals.paid)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SummaryCard title="Saldo pendiente" value={money(totals.pending)} danger />
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box textAlign="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : sales.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        borderRadius: 5,
                        textAlign: "center",
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                    <Typography sx={{ fontWeight: 950 }}>
                        No hay ventas pendientes.
                    </Typography>
                    <Typography color="text.secondary">
                        Todas las ventas se encuentran liquidadas.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={1.5}>
                    {sales.map((sale) => {
                        const total = Number(sale.total_amount || 0);
                        const paid = getPaid(sale);
                        const pending = getPending(sale);
                        const progress = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

                        return (
                            <Paper
                                key={sale.id}
                                sx={{
                                    p: 2,
                                    borderRadius: 5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    boxShadow: "0 12px 35px rgba(0,0,0,.06)",
                                    overflow: "hidden",
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    justifyContent="space-between"
                                    spacing={2}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                                                Venta #{sale.id}
                                            </Typography>

                                            <Chip
                                                size="small"
                                                color={paid > 0 ? "warning" : "default"}
                                                label={paid > 0 ? "Con anticipo" : "Sin pago"}
                                                sx={{ fontWeight: 800 }}
                                            />
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary">
                                            Cliente:{" "}
                                            <strong>
                                                {sale.client?.nombre_alias ||
                                                    sale.client?.razon_social ||
                                                    "Público general"}
                                            </strong>
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            Fecha:{" "}
                                            {sale.created_at
                                                ? new Date(sale.created_at).toLocaleString()
                                                : "Sin fecha"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ minWidth: { md: 220 } }}>
                                        <MoneyRow label="Total" value={total} />
                                        <MoneyRow label="Pagado" value={paid} />
                                        <MoneyRow label="Pendiente" value={pending} danger />

                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                mt: 1,
                                                height: 8,
                                                borderRadius: 99,
                                                bgcolor: "rgba(245,158,11,.15)",
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 99,
                                                    bgcolor: progress >= 100 ? "success.main" : "#f59e0b",
                                                },
                                            }}
                                        />
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 1.5 }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => openDetails(sale)}
                                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                                    >
                                        Ver detalles
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        startIcon={<ReceiptLongIcon />}
                                        onClick={() => openTicket(sale)}
                                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                                    >
                                        Ver ticket
                                    </Button>

                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => openPayment(sale)}
                                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                                    >
                                        Abonar / liquidar
                                    </Button>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            <DetailsDialog
                open={detailsOpen}
                sale={selectedSale}
                paid={getPaid(selectedSale)}
                pending={getPending(selectedSale)}
                onClose={() => setDetailsOpen(false)}
                onTicket={() => selectedSale && openTicket(selectedSale)}
                onPayment={() => selectedSale && openPayment(selectedSale)}
            />

            <Dialog open={paymentOpen} onClose={closePayment} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 950 }}>
                    Abonar venta #{selectedSale?.id}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: "rgba(16,185,129,.06)",
                            }}
                        >
                            <MoneyRow label="Total" value={selectedSale?.total_amount} />
                            <MoneyRow label="Pagado" value={getPaid(selectedSale)} />
                            <MoneyRow label="Pendiente" value={getPending(selectedSale)} danger />
                        </Paper>

                        <TextField
                            label="Monto a abonar"
                            type="number"
                            fullWidth
                            value={paymentForm.amount}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                            }
                            inputProps={{ inputMode: "decimal" }}
                        />

                        <TextField
                            select
                            label="Método de pago"
                            fullWidth
                            value={paymentForm.method}
                            onChange={(e) =>
                                setPaymentForm({
                                    method: e.target.value,
                                    amount: paymentForm.amount,
                                    referencia: "",
                                    ultimos_4: "",
                                })
                            }
                        >
                            {PAYMENT_METHODS.map((method) => (
                                <MenuItem key={method.key} value={method.key}>
                                    {method.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {CARDLIKE.includes(paymentForm.method) && (
                            <TextField
                                label="Referencia"
                                fullWidth
                                value={paymentForm.referencia}
                                onChange={(e) =>
                                    setPaymentForm((prev) => ({
                                        ...prev,
                                        referencia: e.target.value,
                                    }))
                                }
                            />
                        )}

                        {(paymentForm.method === "td" || paymentForm.method === "tc") && (
                            <TextField
                                label="Últimos 4 dígitos"
                                fullWidth
                                value={paymentForm.ultimos_4}
                                inputProps={{ maxLength: 4, inputMode: "numeric" }}
                                onChange={(e) =>
                                    setPaymentForm((prev) => ({
                                        ...prev,
                                        ultimos_4: e.target.value.replace(/\D/g, "").slice(0, 4),
                                    }))
                                }
                            />
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={closePayment}
                        disabled={savingPayment}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleAddPayment}
                        disabled={savingPayment}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                    >
                        {savingPayment ? "Guardando..." : "Guardar abono"}
                    </Button>
                </DialogActions>
            </Dialog>

            <TicketPreviewSendModal
                open={ticketOpen}
                sale={ticketSale}
                posLocationId={posLocationId}
                onClose={() => {
                    setTicketOpen(false);
                    setTicketSale(null);
                }}
            />
        </Box>
    );
}

function SummaryCard({ title, value, danger = false }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: danger ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.75)",
            }}
        >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                {title}
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 950, color: danger ? "error.main" : "inherit" }}>
                {value}
            </Typography>
        </Paper>
    );
}

function MoneyRow({ label, value, danger = false }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" color="text.secondary">
                {label}:
            </Typography>
            <Typography
                variant="body2"
                sx={{ fontWeight: 900, color: danger ? "error.main" : "inherit" }}
            >
                {money(value)}
            </Typography>
        </Stack>
    );
}

function DetailsDialog({ open, sale, paid, pending, onClose, onTicket, onPayment }) {
    if (!sale) return null;

    const items = Array.isArray(sale.items) ? sale.items : [];
    const payments = Array.isArray(sale.payments) ? sale.payments : [];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 950 }}>
                Detalles de venta #{sale.id}

                <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Cliente:{" "}
                            {sale.client?.nombre_alias ||
                                sale.client?.razon_social ||
                                "Público general"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Fecha:{" "}
                            {sale.created_at
                                ? new Date(sale.created_at).toLocaleString()
                                : "Sin fecha"}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <MoneyRow label="Total" value={sale.total_amount} />
                        <MoneyRow label="Pagado" value={paid} />
                        <MoneyRow label="Saldo pendiente" value={pending} danger />
                    </Paper>
                    {sale.status === "open" && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 4,
                                bgcolor: "#fff8e1",
                                borderColor: "#ffb300",
                            }}
                        >
                            <Typography sx={{ fontWeight: 950, color: "#e65100", mb: 0.5 }}>
                                ⚠ Venta pendiente de pago
                            </Typography>

                            <Typography variant="body2" sx={{ color: "#6d4c41" }}>
                                Esta venta aún no ha sido liquidada completamente. Se paga en el módulo de
                                ventas pendientes.
                            </Typography>

                            {sale.pending_due_at && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    <b>Fecha compromiso:</b>{" "}
                                    {new Date(sale.pending_due_at).toLocaleString("es-MX", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Typography>
                            )}

                            {sale.pending_note && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    <b>Nota:</b> {sale.pending_note}
                                </Typography>
                            )}
                        </Paper>
                    )}

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                        <Typography sx={{ fontWeight: 950, mb: 1 }}>
                            Productos
                        </Typography>

                        {items.length === 0 ? (
                            <Typography color="text.secondary">Sin productos cargados.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                {items.map((item, index) => {
                                    const name =
                                        item.product?.name ||
                                        item.productVariant?.name ||
                                        item.name ||
                                        `Producto ${index + 1}`;

                                    const qty = Number(item.quantity || 0);
                                    const price = Number(item.unit_price || item.price || 0);

                                    return (
                                        <Stack
                                            key={item.id || index}
                                            direction="row"
                                            justifyContent="space-between"
                                            spacing={2}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 800 }}>{name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Cantidad: {qty} · Precio: {money(price)}
                                                </Typography>
                                            </Box>

                                            <Typography sx={{ fontWeight: 900 }}>
                                                {money(qty * price)}
                                            </Typography>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                        <Typography sx={{ fontWeight: 950, mb: 1 }}>
                            Abonos / pagos
                        </Typography>

                        {payments.length === 0 ? (
                            <Typography color="text.secondary">
                                Esta venta no tiene pagos registrados.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {payments.map((payment, index) => (
                                    <Stack
                                        key={payment.id || index}
                                        direction="row"
                                        justifyContent="space-between"
                                        spacing={2}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 800 }}>
                                                {String(payment.method || "").toUpperCase()}
                                            </Typography>

                                            {!!payment.referencia && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Ref: {payment.referencia}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Typography sx={{ fontWeight: 900 }}>
                                            {money(payment.amount)}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<ReceiptLongIcon />}
                    onClick={onTicket}
                    sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                >
                    Ver ticket
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<PaymentsIcon />}
                    onClick={onPayment}
                    sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
                >
                    Abonar
                </Button>
            </DialogActions>
        </Dialog>
    );
}