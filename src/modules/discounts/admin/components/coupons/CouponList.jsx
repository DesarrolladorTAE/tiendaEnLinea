import React from "react";
import {
  Box, Paper, Typography, Divider, CircularProgress, Alert,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Stack, Chip, Tooltip, IconButton, Button, useMediaQuery
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { discountTypeLabel, fmtMoney } from "../../helpers";

export function CouponList({ rows, loading, onEdit, onDelete, onRules }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const statusColor = (row) => (!row.is_active ? "default" : "success");

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rows?.length) {
    return <Alert severity="info">No hay cupones aún.</Alert>;
  }

  const valueTxt = (r) =>
    r.discount_type === "percentage"
      ? `${Number(r.discount_value || 0)}%`
      : r.discount_type === "fixed"
      ? fmtMoney(r.discount_value)
      : r.discount_type === "special_price"
      ? fmtMoney(r.special_price)
      : "-";

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map((r) => (
          <Paper
            key={r.id}
            variant="outlined"
            sx={{ p: 1.5, borderRadius: 3, borderColor: alpha(theme.palette.divider, 0.9) }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography fontWeight={900} sx={{ flex: 1 }}>
                {r.code}
              </Typography>

              <Chip size="small" label={discountTypeLabel(r.discount_type)} />
              <Chip
                size="small"
                color={statusColor(r)}
                label={r.is_active ? "Activo" : "Inactivo"}
                icon={r.is_active ? <DoneRoundedIcon /> : <CloseRoundedIcon />}
              />
            </Stack>

            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              {r.description || "—"}
            </Typography>

            <Divider sx={{ my: 1.25 }} />

            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={900}>{valueTxt(r)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  Valor
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<RuleRoundedIcon />} onClick={() => onRules(r)}>
                  Reglas
                </Button>
                <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => onEdit(r)}>
                  Editar
                </Button>
                <Button size="small" color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => onDelete(r)}>
                  Eliminar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography fontWeight={800}>Listado</Typography>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          Tip: usa “Reglas” para limitar por categorías/productos/variantes/atributos.
        </Typography>
      </Box>

      <Divider />

      <TableContainer sx={{ maxHeight: "65vh" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Cupón</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography fontWeight={900}>{r.code}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {r.description || "—"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip size="small" label={discountTypeLabel(r.discount_type)} />
                </TableCell>

                <TableCell align="right">
                  <Typography fontWeight={900}>{valueTxt(r)}</Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    color={statusColor(r)}
                    label={r.is_active ? "Activo" : "Inactivo"}
                    icon={r.is_active ? <DoneRoundedIcon /> : <CloseRoundedIcon />}
                  />
                </TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Reglas">
                      <IconButton onClick={() => onRules(r)}>
                        <RuleRoundedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar">
                      <IconButton onClick={() => onEdit(r)}>
                        <EditRoundedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => onDelete(r)} color="error">
                        <DeleteRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}