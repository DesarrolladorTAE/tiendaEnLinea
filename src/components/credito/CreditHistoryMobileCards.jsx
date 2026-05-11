import React from "react";
import {
    Stack,
    Paper,
    Typography,
    Divider,
    Box,
    Button,
    Chip,
} from "@mui/material";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";

import CreditMovementTypeChip from "./CreditMovementTypeChip";
import {
    money,
    formatDate,
    isCancelledSale,
    isReversalType,
    canPayTicket,
} from "./creditHistoryUtils";

const getSaleStatusChip = (sale) => {
    const status = String(sale?.status || "").toLowerCase();
    const creditStatus = String(sale?.credit_status || "").toLowerCase();

    if (isCancelledSale(status)) {
        return <Chip size="small" label="Venta cancelada" color="error" />;
    }

    if (status === "credit_paid") {
        return (
            <Chip
                size="small"
                label="Saldada"
                color="success"
                sx={{ fontWeight: 900 }}
            />
        );
    }

    if (status === "paid" || creditStatus === "paid") {
        return (
            <Chip
                size="small"
                label="Pagada"
                color="success"
                sx={{ fontWeight: 900 }}
            />
        );
    }

    if (["credit", "credito"].includes(status)) {
        return (
            <Chip
                size="small"
                label="Venta a crédito"
                color="warning"
                variant="outlined"
            />
        );
    }

    return (
        <Chip
            size="small"
            label={sale?.status || "Sin estado"}
            variant="outlined"
        />
    );
};
export default function CreditHistoryMobileCards({
    movements,
    onOpenTicket,
    onOpenTicketPayment,
}) {
    return (
        <Stack spacing={1.2}>
            {movements.map((m) => {
                const sale = m.sale;
                const items = Array.isArray(sale?.items) ? sale.items : [];
                const type = String(m?.type || "").toLowerCase();
                const cancelled = isCancelledSale(sale?.status);
                const reversal = isReversalType(type);
                const canPay = canPayTicket(m, sale);

                return (
                    <Paper
                        key={m.id}
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: cancelled || reversal ? "#fef2f2" : "background.paper",
                            borderColor: cancelled || reversal ? "#fecaca" : "divider",
                        }}
                    >
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <CreditMovementTypeChip movement={m} />
                                <Typography sx={{ fontWeight: 900 }}>
                                    {money(m.amount)}
                                </Typography>
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                                {formatDate(m.created_at)}
                            </Typography>

                            <Typography variant="body2">
                                Saldo al momento: <b>{money(m.balance_after)}</b>
                            </Typography>

                            {m.payment_method ? (
                                <Typography variant="body2">
                                    Método: <b>{m.payment_method}</b>{" "}
                                    {m.reference ? `· Ref: ${m.reference}` : ""}
                                </Typography>
                            ) : null}

                            {m.notes ? (
                                <Typography variant="body2" color="text.secondary">
                                    {m.notes}
                                </Typography>
                            ) : null}

                            {sale ? (
                                <>
                                    <Divider />

                                    <Stack spacing={0.7}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            Venta #{sale.id} · Total {money(sale.total_amount)}
                                        </Typography>

                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {getSaleStatusChip(sale)}
                                        </Stack>

                                        {sale.motivo_cancelacion ? (
                                            <Typography variant="caption" color="error">
                                                Motivo: {sale.motivo_cancelacion}
                                            </Typography>
                                        ) : null}

                                        {sale.fecha_cancelacion ? (
                                            <Typography variant="caption" color="error">
                                                Cancelada el: {formatDate(sale.fecha_cancelacion)}
                                            </Typography>
                                        ) : null}
                                    </Stack>

                                    {items.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Sin productos cargados.
                                        </Typography>
                                    ) : (
                                        items.map((it) => (
                                            <Box key={it.id}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                    {it.product?.name || "Producto"}
                                                    {it.product_variant?.name
                                                        ? ` - ${it.product_variant.name}`
                                                        : ""}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary">
                                                    Cant: {it.quantity} · Precio: {money(it.unit_price)} ·
                                                    Importe: {money(it.total_price)}
                                                </Typography>
                                            </Box>
                                        ))
                                    )}

                                    <Stack direction="column" spacing={1}>
                                        <Button
                                            variant="outlined"
                                            color={cancelled ? "inherit" : "primary"}
                                            startIcon={<ReceiptLongIcon />}
                                            onClick={() => onOpenTicket(sale)}
                                            sx={{
                                                textTransform: "none",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {cancelled ? "Ver ticket cancelado" : "Ver ticket"}
                                        </Button>

                                        {canPay ? (
                                            <Button
                                                variant="contained"
                                                color="success"
                                                startIcon={<PaymentsIcon />}
                                                onClick={() => onOpenTicketPayment(sale)}
                                                sx={{ textTransform: "none", fontWeight: 900 }}
                                            >
                                                Liquidar ticket
                                            </Button>
                                        ) : null}
                                    </Stack>
                                </>
                            ) : null}
                        </Stack>
                    </Paper>
                );
            })}
        </Stack>
    );
}