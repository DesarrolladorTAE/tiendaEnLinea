import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Avatar,
} from "@mui/material";

import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";

import { formatFecha, formatHora, money } from "./useHistorialPOSSimple";

const rowConfig = {
  sale_paid: {
    label: "Venta pagada",
    color: "success",
    icon: <ReceiptLongRoundedIcon />,
  },

  sale_paid_mixed: {
    label: "Pago mixto",
    color: "success",
    icon: <PaymentsRoundedIcon />,
  },

  pending_sale: {
    label: "Pendiente",
    color: "warning",
    icon: <PendingActionsRoundedIcon />,
  },

  pending_initial_payment: {
    label: "Anticipo inicial",
    color: "warning",
    icon: <PaymentsRoundedIcon />,
  },

  pending_payment: {
    label: "Abono pendiente",
    color: "warning",
    icon: <PaymentsRoundedIcon />,
  },

  pending_final_payment: {
    label: "Liquidación pendiente",
    color: "success",
    icon: <PaymentsRoundedIcon />,
  },

  credit_sale: {
    label: "Venta a crédito",
    color: "primary",
    icon: <CreditCardRoundedIcon />,
  },

  credit_sale_paid: {
    label: "Venta a crédito liquidada",
    color: "success",
    icon: <CreditCardRoundedIcon />,
  },

  credit_payment: {
    label: "Abono de crédito",
    color: "info",
    icon: <PaymentsRoundedIcon />,
  },

  credit_liquidation: {
    label: "Liquidación total de crédito",
    color: "success",
    icon: <PaymentsRoundedIcon />,
  },

  credit_sale_liquidation: {
    label: "Venta a crédito liquidada",
    color: "success",
    icon: <PaymentsRoundedIcon />,
  },

  credit_account_liquidation: {
    label: "Liquidación total de crédito",
    color: "success",
    icon: <PaymentsRoundedIcon />,
  },

  cancelacion: {
    label: "Cancelación",
    color: "error",
    icon: <CancelRoundedIcon />,
  },

  devolucion: {
    label: "Devolución",
    color: "info",
    icon: <UndoRoundedIcon />,
  },
};

const getConfig = (row) =>
  rowConfig[row?.row_type] || {
    label: row?.label || "Movimiento",
    color: "default",
    icon: <ReceiptLongRoundedIcon />,
  };

const getClientName = (row) =>
  row?.client?.name ||
  row?.cliente?.nombre_alias ||
  row?.cliente?.razon_social ||
  "Cliente general";

const getPhone = (row) =>
  row?.client?.phone ||
  row?.cliente?.telefono ||
  "";

const getAmount = (row) =>
  Number(
    row?.amount ??
      row?.total ??
      0
  );

const getSaleId = (row) =>
  row?.sale_id ||
  row?.venta_id ||
  null;

const canCancelSale = (row) =>
  [
    "sale_paid",
    "sale_paid_mixed",
    "credit_sale_paid",
    "credit_sale_liquidation",
  ].includes(row?.row_type);

const canReturn = (row) =>
  [
    "sale_paid",
    "sale_paid_mixed",
    "credit_sale_paid",
  ].includes(row?.row_type);

export default function HistorialPOSTable({
  rows = [],
  isMobile = false,
  onTicket,
  onDetalles,
  onCliente,
  onCancelar,
  onDevolver,
}) {
  const renderActions = (row) => {
    const saleId = getSaleId(row);
    const hasSale = Boolean(saleId);

    return (
      <Stack
        direction="row"
        spacing={0.5}
        justifyContent="flex-end"
        alignItems="center"
      >
        {hasSale ? (
          <>
            <Tooltip title="Ticket">
              <IconButton
                size="small"
                onClick={() => onTicket?.(saleId)}
              >
                <PrintRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Detalles">
              <IconButton
                size="small"
                onClick={() => onDetalles?.(saleId)}
              >
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : null}

        <Tooltip title="Cliente">
          <IconButton
            size="small"
            onClick={() =>
              onCliente?.({
                ventaId: saleId,

                clienteActualId:
                  row?.client_id ||
                  row?.cliente_id ||
                  row?.client?.id ||
                  row?.cliente?.id ||
                  row?.venta?.client_id ||
                  row?.venta?.cliente_id ||
                  row?.venta?.client?.id ||
                  row?.venta?.cliente?.id ||
                  null,
              })
            }
          >
            <PersonOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {hasSale && canCancelSale(row) ? (
          <Tooltip title="Cancelar venta">
            <IconButton
              size="small"
              color="error"
              onClick={() => onCancelar?.(saleId)}
            >
              <CancelRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}

        {hasSale && canReturn(row) ? (
          <Tooltip title="Devolver">
            <IconButton
              size="small"
              color="info"
              onClick={() => onDevolver?.(saleId)}
            >
              <AutorenewRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
    );
  };

  const renderMovement = (row) => {
    const cfg = getConfig(row);

    return (
      <Stack
        direction="row"
        spacing={1.2}
        alignItems="center"
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,

            bgcolor:
              cfg.color === "default"
                ? "grey.100"
                : `${cfg.color}.50`,

            color:
              cfg.color === "default"
                ? "text.secondary"
                : `${cfg.color}.main`,

            border: "1px solid",

            borderColor:
              cfg.color === "default"
                ? "divider"
                : `${cfg.color}.100`,
          }}
        >
          {React.cloneElement(cfg.icon, {
            fontSize: "small",
          })}
        </Avatar>

        <Box>
          <Typography
            fontWeight={900}
            fontSize={14}
          >
            {row?.label || cfg.label}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {getSaleId(row)
              ? `Ticket #${getSaleId(row)}`
              : "Movimiento de cuenta"}
          </Typography>
        </Box>
      </Stack>
    );
  };

  const renderClient = (row) => (
    <Box>
      <Typography
        fontWeight={800}
        fontSize={13}
      >
        {getClientName(row)}
      </Typography>

      {getPhone(row) ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {getPhone(row)}
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Sin teléfono
        </Typography>
      )}
    </Box>
  );

  const renderPayment = (row) => (
    <Stack spacing={0.2}>
      <Typography fontWeight={900}>
        {money(getAmount(row))}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
      >
        {row?.payment?.method_label ||
          row?.payment?.method ||
          "Sin método"}
      </Typography>

      {row?.payment?.referencia ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Ref. {row.payment.referencia}
        </Typography>
      ) : null}
    </Stack>
  );

  const renderBalance = (row) => {
    if ("remaining_amount" in row) {
      return (
        <>
          <Typography
            fontWeight={800}
            fontSize={13}
          >
            Restante: {money(row.remaining_amount)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Total: {money(row.total_amount)}
          </Typography>
        </>
      );
    }

    if ("balance_after" in row) {
      return (
        <>
          <Typography
            fontWeight={800}
            fontSize={13}
          >
            Saldo: {money(row.balance_after)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Antes: {money(row.balance_before)}
          </Typography>
        </>
      );
    }

    return (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        —
      </Typography>
    );
  };

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map((row) => {
          const cfg = getConfig(row);

          return (
            <Card
              key={row.id}
              elevation={0}
              sx={{
                borderRadius: 4,

                border: "1px solid",
                borderColor: "divider",

                background:
                  "linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,252,.92))",

                boxShadow:
                  "0 14px 38px rgba(15,23,42,.07)",
              }}
            >
              <CardContent
                sx={{
                  p: 2,

                  "&:last-child": {
                    pb: 2,
                  },
                }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Chip
                      size="small"
                      color={cfg.color}
                      label={row?.label || cfg.label}
                      sx={{
                        fontWeight: 900,
                        borderRadius: 2,
                      }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {formatHora(
                        row?.date ||
                          row?.fecha
                      )}
                    </Typography>
                  </Stack>

                  {renderMovement(row)}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-end"
                    spacing={2}
                  >
                    {renderClient(row)}

                    <Box textAlign="right">
                      {renderPayment(row)}
                    </Box>
                  </Stack>

                  <Box>
                    {renderBalance(row)}
                  </Box>

                  {row?.motivo ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Motivo: {row.motivo}
                    </Typography>
                  ) : null}

                  {row?.notes ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Nota: {row.notes}
                    </Typography>
                  ) : null}

                  {renderActions(row)}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 5,
        overflow: "hidden",

        border: "1px solid",
        borderColor: "divider",

        boxShadow:
          "0 18px 45px rgba(15,23,42,.08)",
      }}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "grey.50",

                "& th": {
                  py: 1.8,

                  fontSize: 12,

                  color: "text.secondary",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    ".06em",

                  fontWeight: 900,

                  borderBottom:
                    "1px solid",

                  borderColor:
                    "divider",
                },
              }}
            >
              <TableCell>
                Movimiento
              </TableCell>

              <TableCell>
                Fecha
              </TableCell>

              <TableCell>
                Cliente
              </TableCell>

              <TableCell>
                Pago / Importe
              </TableCell>

              <TableCell>
                Saldo
              </TableCell>

              <TableCell align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  "& td": {
                    py: 1.6,

                    borderColor:
                      "rgba(148,163,184,.18)",
                  },
                }}
              >
                <TableCell>
                  {renderMovement(row)}
                </TableCell>

                <TableCell>
                  <Typography
                    fontWeight={800}
                    fontSize={13}
                  >
                    {formatFecha(
                      row?.date ||
                        row?.fecha
                    )}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatHora(
                      row?.date ||
                        row?.fecha
                    )}
                  </Typography>
                </TableCell>

                <TableCell>
                  {renderClient(row)}
                </TableCell>

                <TableCell>
                  {renderPayment(row)}
                </TableCell>

                <TableCell>
                  {renderBalance(row)}
                </TableCell>

                <TableCell align="right">
                  {renderActions(row)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}