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
} from "@mui/material";

import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { formatFecha, money } from "./useHistorialPOSSimple";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const getRealStatus = (row) => {
  if (row?.rowType === "cancelacion") {
    const tipo = normalizeText(row?.tipoCancelacion || row?.tipo || row?.estado);

    if (
      tipo.includes("parcial") ||
      tipo.includes("partial") ||
      tipo === "partially_cancelled"
    ) {
      return "partially_cancelled";
    }

    return "cancelled";
  }

  if (row?.rowType === "devolucion") {
    const tipo = normalizeText(row?.tipoDevolucion || row?.tipo || row?.estado);

    if (
      tipo.includes("parcial") ||
      tipo.includes("partial") ||
      tipo === "devuelta_parcial"
    ) {
      return "devuelta_parcial";
    }

    return "devuelta";
  }

  const raw = normalizeText(row?.venta?.status || row?.estadoRaw || row?.estado);

  if (
    raw === "open" ||
    raw === "pending" ||
    raw.includes("pendiente") ||
    raw.includes("por cobrar")
  ) {
    return "open";
  }

  if (
    raw === "credit" ||
    raw.includes("credito") ||
    raw.includes("crédito")
  ) {
    return "credit";
  }

  if (raw === "credit_paid" || raw.includes("crédito pagado")) {
    return "credit_paid";
  }

  if (
    raw === "cancelled" ||
    raw === "canceled" ||
    raw.includes("cancelada") ||
    raw.includes("cancelado")
  ) {
    return "cancelled";
  }

  if (
    raw === "partially_cancelled" ||
    raw.includes("cancelada parcial") ||
    raw.includes("cancelado parcial")
  ) {
    return "partially_cancelled";
  }

  if (raw === "devuelta_parcial" || raw.includes("devolución parcial")) {
    return "devuelta_parcial";
  }

  if (raw === "devuelta" || raw.includes("devuelta")) {
    return "devuelta";
  }

  if (raw === "paid" || raw.includes("pagada")) {
    return "paid";
  }

  return raw || "paid";
};

const isPendienteStatus = (status) => ["open", "credit"].includes(status);

const getColor = (status) => {
  if (["open", "credit"].includes(status)) return "warning";
  if (["cancelled", "partially_cancelled"].includes(status)) return "error";
  if (["devuelta", "devuelta_parcial"].includes(status)) return "info";
  if (status === "credit_paid") return "primary";
  return "success";
};

const getBg = (status) => {
  if (["open", "credit"].includes(status)) return "#fff3e0";
  if (["cancelled", "partially_cancelled"].includes(status)) return "#ffebee";
  if (["devuelta", "devuelta_parcial"].includes(status)) return "#e3f2fd";
  if (status === "credit_paid") return "#e8eaf6";
  return "#e8f5e9";
};

const getBorder = (color) => {
  if (color === "warning") return "warning.light";
  if (color === "success") return "success.light";
  if (color === "info") return "info.light";
  if (color === "error") return "error.light";
  if (color === "primary") return "primary.light";
  return "divider";
};

const getLabel = (status) => {
  if (status === "open") return "Pendiente";
  if (status === "credit") return "Crédito";
  if (status === "credit_paid") return "Crédito pagado";
  if (status === "cancelled") return "Cancelada";
  if (status === "partially_cancelled") return "Cancelada parcial";
  if (status === "devuelta") return "Devuelta";
  if (status === "devuelta_parcial") return "Devolución parcial";
  return "Venta";
};

export default function HistorialPOSTable({
  rows = [],
  isMobile = false,
  onTicket,
  onDetalles,
  onCliente,
  onCancelar,
  onDevolver,
}) {
  const renderCliente = (cliente) => {
    if (!cliente) {
      return (
        <Typography variant="body2" color="text.secondary">
          Sin cliente
        </Typography>
      );
    }

    return (
      <Stack spacing={0.2}>
        <Typography variant="body2" fontWeight={700}>
          {cliente.nombre_alias || "Cliente"}
        </Typography>

        {cliente.telefono ? (
          <Typography variant="caption" color="text.secondary">
            {cliente.telefono}
          </Typography>
        ) : null}
      </Stack>
    );
  };

  const renderActions = (row) => {
    const ventaId = row.venta_id;
    const status = getRealStatus(row);

    const puedeCancelar =
      row.rowType === "venta" &&
      ![
        "cancelled",
        "partially_cancelled",
        "devuelta",
        "devuelta_parcial",
        "credit_paid",
      ].includes(status);

    const puedeDevolver =
      row.rowType === "venta" &&
      ["paid", "credit_paid", "partially_cancelled"].includes(status);

    return (
      <Stack
        direction="row"
        spacing={0.3}
        justifyContent="center"
        flexWrap="wrap"
      >
        <Tooltip title="Ticket">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onTicket?.(ventaId)}
          >
            <PrintIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Detalles">
          <IconButton
            size="small"
            color="secondary"
            onClick={() => onDetalles?.(ventaId)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cliente">
          <IconButton
            size="small"
            color="inherit"
            onClick={() => onCliente?.(row)}
          >
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {puedeCancelar ? (
          <Tooltip title="Cancelar">
            <IconButton
              size="small"
              color="error"
              onClick={() => onCancelar?.(ventaId)}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}

        {puedeDevolver ? (
          <Tooltip title="Devolver">
            <IconButton
              size="small"
              color="info"
              onClick={() => onDevolver?.(ventaId)}
            >
              <AutorenewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
    );
  };

  const renderEstado = (row) => {
    const status = getRealStatus(row);
    const pendiente = isPendienteStatus(status);

    return (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={800}>
          {getLabel(status)}
        </Typography>

        {pendiente ? (
          <Typography variant="caption" color="warning.dark" fontWeight={800}>
            No se suma a totales de pago
          </Typography>
        ) : null}

        {status === "cancelled" ? (
          <Typography variant="caption" color="error.main" fontWeight={800}>
            Venta cancelada
          </Typography>
        ) : null}

        {status === "partially_cancelled" ? (
          <Typography variant="caption" color="error.main" fontWeight={800}>
            Cancelación parcial
          </Typography>
        ) : null}

        {status === "devuelta" || status === "devuelta_parcial" ? (
          <Typography variant="caption" color="info.main" fontWeight={800}>
            Venta con devolución
          </Typography>
        ) : null}

        {row.motivo && row.motivo !== "—" ? (
          <Typography
            variant="caption"
            color="text.secondary"
            title={row.motivo}
            sx={{
              maxWidth: 210,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Motivo: {row.motivo}
          </Typography>
        ) : null}
      </Stack>
    );
  };

  if (isMobile) {
    return (
      <Stack spacing={1.2}>
        {rows.map((row) => {
          const status = getRealStatus(row);
          const color = getColor(status);
          const bg = getBg(status);

          return (
            <Card
              key={row.id}
              sx={{
                borderRadius: 3,
                bgcolor: bg,
                border: "1px solid",
                borderColor: getBorder(color),
              }}
            >
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Chip
                      size="small"
                      color={color}
                      label={getLabel(status)}
                      sx={{ fontWeight: 700 }}
                    />

                    <Typography variant="caption" color="text.secondary">
                      {formatFecha(row.fecha)}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" fontWeight={800}>
                    Venta #{row.venta_id}
                  </Typography>

                  <Typography variant="h6" fontWeight={800}>
                    {money(row.total)}
                  </Typography>

                  <Box>{renderCliente(row.cliente)}</Box>

                  <Typography variant="body2">{row.pago || "—"}</Typography>

                  <Box>{renderEstado(row)}</Box>

                  <Stack direction="row" justifyContent="flex-end">
                    {renderActions(row)}
                  </Stack>
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
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#fafafa" }}>
              <TableCell>
                <strong>Tipo</strong>
              </TableCell>
              <TableCell>
                <strong>Venta</strong>
              </TableCell>
              <TableCell>
                <strong>Fecha</strong>
              </TableCell>
              <TableCell>
                <strong>Total</strong>
              </TableCell>
              <TableCell>
                <strong>Cliente</strong>
              </TableCell>
              <TableCell>
                <strong>Pago</strong>
              </TableCell>
              <TableCell>
                <strong>Estado / Motivo</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const status = getRealStatus(row);
              const color = getColor(status);
              const bg = getBg(status);

              return (
                <TableRow key={row.id} hover sx={{ bgcolor: bg }}>
                  <TableCell>
                    <Chip
                      size="small"
                      color={color}
                      label={getLabel(status)}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell>#{row.venta_id}</TableCell>
                  <TableCell>{formatFecha(row.fecha)}</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    {money(row.total)}
                  </TableCell>

                  <TableCell>{renderCliente(row.cliente)}</TableCell>

                  <TableCell>
                    <Typography
                      variant="body2"
                      title={row.pago || "—"}
                      sx={{
                        maxWidth: 220,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.pago || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>{renderEstado(row)}</TableCell>

                  <TableCell align="center">{renderActions(row)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}