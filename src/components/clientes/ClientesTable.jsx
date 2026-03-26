// src/components/clientes/ClientesTable.jsx
import React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Tooltip,
  Box,
  Stack,
  Typography,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BadgeIcon from "@mui/icons-material/Badge";

export default function ClientesTable({
  rows = [],
  onEdit,
  onDelete,
  onViewHistory,
  canEdit = true,
  canDelete = true,
  canViewHistory = true,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.length === 0 ? (
          <Paper
            elevation={0}
            sx={(t) => ({
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              border: `1px dashed ${alpha(t.palette.divider, 0.8)}`,
              bgcolor:
                t.palette.mode === "dark"
                  ? alpha(t.palette.background.paper, 0.7)
                  : "#fff",
            })}
          >
            <Typography fontWeight={700} color="text.secondary">
              Sin clientes
            </Typography>
          </Paper>
        ) : (
          rows.map((r) => (
            <Paper
              key={r.id}
              elevation={0}
              sx={(t) => ({
                borderRadius: 3,
                p: 1.5,
                border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
                bgcolor:
                  t.palette.mode === "dark"
                    ? alpha(t.palette.background.paper, 0.85)
                    : "#fff",
              })}
            >
              <Stack spacing={1.2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonOutlineIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 15,
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                      >
                        {r.nombre_alias}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.8} flexWrap="wrap">
                      {r.rfc ? (
                        <Chip
                          size="small"
                          icon={<BadgeIcon />}
                          label={`RFC: ${r.rfc}`}
                          variant="outlined"
                        />
                      ) : null}
                      {r.razon_social ? (
                        <Chip
                          size="small"
                          label="Facturación"
                          color="info"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>
                  </Stack>
                </Stack>

                <Stack spacing={0.8}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailOutlinedIcon
                      sx={{ fontSize: 17, color: "text.secondary" }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {r.email || "Sin email"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIphoneIcon
                      sx={{ fontSize: 17, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {r.telefono || "Sin teléfono"}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  spacing={0.5}
                  flexWrap="wrap"
                >
                  <Tooltip title="Ver historial">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onViewHistory?.(r)}
                        disabled={!canViewHistory}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      canEdit
                        ? "Editar"
                        : "Tu plan no permite editar clientes"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onEdit?.(r)}
                        disabled={!canEdit}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      canDelete
                        ? "Eliminar"
                        : "Tu plan no permite eliminar clientes"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete?.(r)}
                        disabled={!canDelete}
                        sx={{
                          border: "1px solid",
                          borderColor: alpha(theme.palette.error.main, 0.35),
                          borderRadius: 2,
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
        bgcolor: t.palette.mode === "dark" ? alpha("#0b1220", 0.5) : "#fff",
      })}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? alpha(t.palette.background.paper, 0.95)
                      : "#f8fafc",
                  color: "text.primary",
                  fontWeight: 800,
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                },
              }}
            >
              <TableCell>Cliente</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>RFC</TableCell>
              <TableCell>Razón social</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 5, color: "text.secondary" }}
                >
                  Sin clientes
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{
                    "& td": {
                      borderBottom: (t) =>
                        `1px solid ${alpha(t.palette.divider, 0.6)}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 800 }}>
                    {r.nombre_alias}
                  </TableCell>
                  <TableCell>{r.email || "—"}</TableCell>
                  <TableCell>{r.telefono || "—"}</TableCell>
                  <TableCell>{r.rfc || "—"}</TableCell>
                  <TableCell>{r.razon_social || "—"}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Ver historial">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onViewHistory?.(r)}
                          disabled={!canViewHistory}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        canEdit
                          ? "Editar"
                          : "Tu plan no permite editar clientes"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onEdit?.(r)}
                          disabled={!canEdit}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        canDelete
                          ? "Eliminar"
                          : "Tu plan no permite eliminar clientes"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete?.(r)}
                          disabled={!canDelete}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}