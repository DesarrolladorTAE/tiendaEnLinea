import React from "react";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Stack,
    Typography,
    Tooltip,
    IconButton,
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
        return <Chip size="small" label="Venta cancelada" color="error" sx={{ fontWeight: 900 }} />;
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
        return <Chip size="small" label="Pagada" color="success" sx={{ fontWeight: 900 }} />;
    }

    if (["credit", "credito"].includes(status)) {
        return (
            <Chip
                size="small"
                label="Venta a crédito"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 900 }}
            />
        );
    }

    return <Chip size="small" label={sale?.status || "Sin estado"} variant="outlined" />;
};

export default function CreditHistoryTable({
    movements,
    onOpenTicket,
    onOpenTicketPayment,
}) {
    return (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 900, bgcolor: "#f8fafc" } }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell>Venta / Productos</TableCell>
                        <TableCell align="right">Cargo</TableCell>
                        <TableCell align="right">Abono</TableCell>
                        <TableCell align="right">Reversión</TableCell>
                        <TableCell align="right">Saldo al momento</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {movements.map((m) => {
                        const sale = m.sale;
                        const items = Array.isArray(sale?.items) ? sale.items : [];
                        const type = String(m?.type || "").toLowerCase();
                        const cancelled = isCancelledSale(sale?.status);
                        const reversal = isReversalType(type);
                        const canPay = canPayTicket(m, sale);

                        return (
                            <TableRow
                                key={m.id}
                                hover
                                sx={{
                                    bgcolor: cancelled || reversal ? "#fef2f2" : "inherit",
                                    "&:hover": {
                                        bgcolor: cancelled || reversal ? "#fee2e2" : undefined,
                                    },
                                }}
                            >
                                <TableCell>{formatDate(m.created_at)}</TableCell>

                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <CreditMovementTypeChip movement={m} />

                                        {m.payment_method ? (
                                            <Typography variant="caption">
                                                {m.payment_method}
                                                {m.reference ? ` · ${m.reference}` : ""}
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                </TableCell>

                                <TableCell>
                                    {sale ? (
                                        <Stack spacing={0.5}>
                                            <Typography sx={{ fontWeight: 900 }}>
                                                Venta #{sale.id}
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

                                            {items.length ? (
                                                items.map((it) => (
                                                    <Typography
                                                        key={it.id}
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {it.product?.name || "Producto"}
                                                        {it.product_variant?.name
                                                            ? ` - ${it.product_variant.name}`
                                                            : ""}{" "}
                                                        · Cant: {it.quantity} · {money(it.total_price)}
                                                    </Typography>
                                                ))
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    Sin productos cargados
                                                </Typography>
                                            )}
                                        </Stack>
                                    ) : (
                                        m.notes || "Movimiento registrado"
                                    )}
                                </TableCell>

                                <TableCell align="right">
                                    {type === "cargo" ? money(m.amount) : "—"}
                                </TableCell>

                                <TableCell align="right">
                                    {type === "abono" ? money(m.amount) : "—"}
                                </TableCell>

                                <TableCell align="right">
                                    {reversal ? money(m.amount) : "—"}
                                </TableCell>

                                <TableCell align="right">
                                    <b>{money(m.balance_after)}</b>
                                </TableCell>

                                <TableCell align="center">
                                    {sale ? (
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            {/* Ver ticket: permitido aunque esté cancelado */}
                                            <Tooltip title="Ver ticket">
                                                <span>
                                                    <IconButton
                                                        color={cancelled ? "default" : "primary"}
                                                        onClick={() => onOpenTicket(sale)}
                                                    >
                                                        <ReceiptLongIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            {/* Liquidar: solo si puede pagar */}
                                            {canPay ? (
                                                <Tooltip title="Liquidar ticket">
                                                    <span>
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => onOpenTicketPayment(sale)}
                                                        >
                                                            <PaymentsIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            ) : null}
                                        </Stack>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}