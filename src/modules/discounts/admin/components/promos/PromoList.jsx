import React from "react";
import {
  Box, Paper, Typography, Divider, CircularProgress, Alert,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Stack, Avatar, Chip, Tooltip, IconButton, Button, useMediaQuery
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { discountTypeLabel, fmtMoney, imageUrlMaybe } from "../../helpers";

export function PromoList({ rows, loading, onEdit, onDelete, onRules }) {
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
    return <Alert severity="info">No hay promociones aún.</Alert>;
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
        {rows.map((r) => {
          const img = imageUrlMaybe(r.image);
          return (
            <Paper
              key={r.id}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 3, borderColor: alpha(theme.palette.divider, 0.9) }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  variant="rounded"
                  src={img || undefined}
                  sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
                >
                  <ImageRoundedIcon />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={900} noWrap>{r.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>/{r.slug}</Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                    <Chip size="small" label={discountTypeLabel(r.discount_type)} />
                    <Chip
                      size="small"
                      color={statusColor(r)}
                      label={r.is_active ? "Activa" : "Inactiva"}
                      icon={r.is_active ? <DoneRoundedIcon /> : <CloseRoundedIcon />}
                    />
                    {!!r.stackable && <Chip size="small" color="success" label="Acumulable" />}
                  </Stack>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography fontWeight={900}>{valueTxt(r)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Valor</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.25 }} />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
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
            </Paper>
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
        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography fontWeight={800}>Listado</Typography>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          Tip: usa “Reglas” para aplicar por categorías, productos o atributos de variantes.
        </Typography>
      </Box>

      <Divider />

      <TableContainer sx={{ maxHeight: "65vh" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Promo</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => {
              const img = imageUrlMaybe(r.image);
              return (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        variant="rounded"
                        src={img || undefined}
                        sx={{
                          width: 44, height: 44, borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        }}
                      >
                        <ImageRoundedIcon />
                      </Avatar>

                      <Box>
                        <Typography fontWeight={900}>{r.name}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                          /{r.slug}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip size="small" label={discountTypeLabel(r.discount_type)} />
                  </TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={900}>{valueTxt(r)}</Typography>
                    {!!r.stackable && (
                      <Typography variant="caption" sx={{ color: "success.main" }}>
                        Acumulable
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      color={statusColor(r)}
                      label={r.is_active ? "Activa" : "Inactiva"}
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
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}