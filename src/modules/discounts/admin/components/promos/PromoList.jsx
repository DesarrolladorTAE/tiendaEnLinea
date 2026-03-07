import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  Button,
  useMediaQuery,
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

  const valueTxt = (r) =>
    r.discount_type === "percentage"
      ? `${Number(r.discount_value || 0)}%`
      : r.discount_type === "fixed"
      ? fmtMoney(r.discount_value)
      : r.discount_type === "special_price"
      ? fmtMoney(r.special_price)
      : "-";

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rows?.length) {
    return (
      <Alert
        severity="info"
        sx={{
          borderRadius: 2,
          bgcolor: alpha("#000", 0.03),
          border: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        No hay promociones aún.
      </Alert>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.2}>
        <Typography sx={{ fontWeight: 900, color: "#000" }}>
          Lista de promociones
        </Typography>

        {rows.map((r) => {
          const img = imageUrlMaybe(r.image);

          return (
            <CardLikeRow
              key={r.id}
              title={r.name}
              subtitle={`/${r.slug}`}
              avatar={img}
              statusColor={statusColor(r)}
              statusLabel={r.is_active ? "Activa" : "Inactiva"}
              value={valueTxt(r)}
              typeLabel={discountTypeLabel(r.discount_type)}
              stackable={!!r.stackable}
              onRules={() => onRules(r)}
              onEdit={() => onEdit(r)}
              onDelete={() => onDelete(r)}
            />
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
        border: `1px solid ${alpha("#000", 0.08)}`,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography fontWeight={900}>Listado de promociones</Typography>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          Usa “Reglas” para aplicar por categorías, productos o atributos de variantes.
        </Typography>
      </Box>

      <Divider />

      <TableContainer sx={{ maxHeight: "65vh" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 900,
                  bgcolor: alpha("#000", 0.03),
                },
              }}
            >
              <TableCell>Promoción</TableCell>
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
                          width: 46,
                          height: 46,
                          borderRadius: 2,
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
                    <Chip
                      size="small"
                      label={discountTypeLabel(r.discount_type)}
                      sx={{ fontWeight: 800 }}
                    />
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
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                      <Tooltip title="Reglas">
                        <IconButton
                          onClick={() => onRules(r)}
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${alpha("#000", 0.10)}`,
                            bgcolor: "#fff",
                            "&:hover": { bgcolor: alpha("#000", 0.03) },
                          }}
                        >
                          <RuleRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => onEdit(r)}
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${alpha("#000", 0.10)}`,
                            bgcolor: "#fff",
                            "&:hover": { bgcolor: alpha("#000", 0.03) },
                          }}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton
                          onClick={() => onDelete(r)}
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${alpha("#d32f2f", 0.22)}`,
                            color: "error.main",
                            bgcolor: alpha("#d32f2f", 0.03),
                            "&:hover": { bgcolor: alpha("#d32f2f", 0.06) },
                          }}
                        >
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

function CardLikeRow({
  title,
  subtitle,
  avatar,
  statusColor,
  statusLabel,
  value,
  typeLabel,
  stackable,
  onRules,
  onEdit,
  onDelete,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          variant="rounded"
          src={avatar || undefined}
          sx={{
            width: 54,
            height: 54,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <ImageRoundedIcon />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={900} noWrap>
            {title}
          </Typography>

          <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>
            {subtitle}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            <Chip size="small" label={typeLabel} sx={{ fontWeight: 800 }} />
            <Chip
              size="small"
              color={statusColor}
              label={statusLabel}
              icon={statusLabel === "Activa" ? <DoneRoundedIcon /> : <CloseRoundedIcon />}
              sx={{ fontWeight: 800 }}
            />
            {stackable ? (
              <Chip
                size="small"
                color="success"
                label="Acumulable"
                sx={{ fontWeight: 800 }}
              />
            ) : null}
          </Stack>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography fontWeight={900}>{value}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            Valor
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          startIcon={<RuleRoundedIcon />}
          onClick={onRules}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          Reglas
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<EditRoundedIcon />}
          onClick={onEdit}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          Editar
        </Button>

        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteRoundedIcon />}
          onClick={onDelete}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          Eliminar
        </Button>
      </Stack>
    </Paper>
  );
}