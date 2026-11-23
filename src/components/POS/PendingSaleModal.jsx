import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack,
    Typography,
    DialogActions,
    useMediaQuery,
    TextField,
    MenuItem,
    Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const PAYMENT_METHODS = [
    { key: "efectivo", label: "Efectivo" },
    { key: "td", label: "Tarjeta débito" },
    { key: "tc", label: "Tarjeta crédito" },
    { key: "transferencia", label: "Transferencia" },
];

const CARDLIKE = ["td", "tc", "transferencia"];

export default function PendingSaleModal({
    open,
    onClose,
    onSelectAdvance,
    onSelectNoPayment,
    total = 0,
    startInAdvance = false,
    initialPayment = null,
    initialDueAt = null,
    initialNote = "",
}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [method, setMethod] = useState("efectivo");
    const [amount, setAmount] = useState("");
    const [referencia, setReferencia] = useState("");
    const [ultimos4, setUltimos4] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueNote, setDueNote] = useState("");

    useEffect(() => {
        if (!open) return;

        if (startInAdvance) {
            setShowAdvanceForm(true);
        }

        if (initialPayment) {
            setMethod(initialPayment.method || "efectivo");
            setAmount(
                initialPayment.amount != null
                    ? String(initialPayment.amount)
                    : ""
            );
            setReferencia(initialPayment.referencia || "");
            setUltimos4(initialPayment.ultimos_4 || "");
        }

        setDueDate(initialDueAt || "");
        setDueNote(initialNote || "");
    }, [open, startInAdvance, initialPayment, initialDueAt, initialNote]);

    const resetModal = () => {
        setShowAdvanceForm(false);
        setMethod("efectivo");
        setAmount("");
        setReferencia("");
        setUltimos4("");
        setDueDate("");
        setDueNote("");
    };

    const handleClose = () => {
        resetModal();
        onClose?.();
    };

    const handleNoPayment = () => {
        const payload = {
            pending_due_at: dueDate || null,
            pending_note: dueNote || "",
        };

        resetModal();
        onSelectNoPayment?.(payload);
    };

    const handleSaveAdvance = () => {
        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            alert("Ingresa un anticipo válido.");
            return;
        }

        if (parsedAmount >= Number(total)) {
            alert("El anticipo debe ser menor al total para quedar como venta pendiente.");
            return;
        }

        if (CARDLIKE.includes(method) && !referencia.trim()) {
            alert("Ingresa la referencia del pago.");
            return;
        }

        if ((method === "td" || method === "tc") && ultimos4.length !== 4) {
            alert("Ingresa los últimos 4 dígitos de la tarjeta.");
            return;
        }

        const payment = {
            method,
            amount: Number(parsedAmount.toFixed(2)),

            ...(CARDLIKE.includes(method)
                ? { referencia: referencia?.trim() || "" }
                : {}),

            ...(method === "td" || method === "tc"
                ? { ultimos_4: ultimos4 }
                : {}),

            ...(method === "efectivo"
                ? {
                    recibido: Number(parsedAmount.toFixed(2)),
                    cash_received: Number(parsedAmount.toFixed(2)),
                    efectivo_recibido: Number(parsedAmount.toFixed(2)),
                }
                : {}),
        };

        onSelectAdvance?.({
            payment,
            pending_due_at: dueDate || null,
            pending_note: dueNote || "",
        });
        resetModal();
        onClose?.();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: 3 },
                    p: { xs: 1, sm: 2 },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 900, textAlign: "center" }}>
                Venta pendiente
            </DialogTitle>

            <DialogContent dividers>
                {!showAdvanceForm ? (
                    <Stack spacing={2} alignItems="center">
                        <Typography
                            sx={{ textAlign: "center", fontWeight: 500 }}
                            color="text.secondary"
                        >
                            ¿El cliente realizará un anticipo en este momento?
                        </Typography>

                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            onClick={() => setShowAdvanceForm(true)}
                            sx={{
                                borderRadius: 3,
                                py: 1.4,
                                fontWeight: 900,
                                textTransform: "none",
                            }}
                        >
                            Sí, dejará anticipo
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={handleNoPayment}
                            sx={{
                                borderRadius: 3,
                                py: 1.4,
                                fontWeight: 800,
                                textTransform: "none",
                            }}
                        >
                            No, guardar sin pago
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        <Box>
                            <Typography sx={{ fontWeight: 900 }}>
                                Registrar anticipo
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total de la venta: ${Number(total || 0).toFixed(2)}
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="Monto del anticipo"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            select
                            label="Método de pago"
                            value={method}
                            onChange={(e) => {
                                setMethod(e.target.value);
                                setReferencia("");
                                setUltimos4("");
                            }}
                        >
                            {PAYMENT_METHODS.map((item) => (
                                <MenuItem key={item.key} value={item.key}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {CARDLIKE.includes(method) && (
                            <TextField
                                fullWidth
                                label="Referencia"
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                            />
                        )}

                        {(method === "td" || method === "tc") && (
                            <TextField
                                fullWidth
                                label="Últimos 4 dígitos"
                                value={ultimos4}
                                inputProps={{ maxLength: 4 }}
                                onChange={(e) =>
                                    setUltimos4(e.target.value.replace(/\D/g, "").slice(0, 4))
                                }
                            />
                        )}

                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Fecha compromiso de pago restante"
                            InputLabelProps={{ shrink: true }}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Nota del pendiente"
                            value={dueNote}
                            onChange={(e) => setDueNote(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Ej. Cliente pagará el resto al recoger el pedido"
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            onClick={handleSaveAdvance}
                            sx={{
                                borderRadius: 3,
                                py: 1.4,
                                fontWeight: 900,
                                textTransform: "none",
                            }}
                        >
                            Guardar anticipo
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            color="inherit"
                            onClick={() => setShowAdvanceForm(false)}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                            Regresar
                        </Button>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center" }}>
                <Button
                    onClick={handleClose}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                >
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    );
}