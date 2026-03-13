import React from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

const COLORS = {
  accent: "#f9b233",
  danger: "#e94e1b",
  success: "#1f8f4d",
};

function StatusChip({ active }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.2,
        py: 0.4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        color: active ? COLORS.success : COLORS.danger,
        bgcolor: active
          ? alpha(COLORS.success, 0.10)
          : alpha(COLORS.danger, 0.10),
        border: `1px solid ${
          active ? alpha(COLORS.success, 0.25) : alpha(COLORS.danger, 0.25)
        }`,
      }}
    >
      {active ? "Activo" : "Inactivo"}
    </Box>
  );
}

export default function WorkersTable({
  workers,
  loading,
  canManage,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (loading) {
    return (
      <Box sx={{ p: 1 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.07)}`,
        overflow: "hidden",
        boxShadow: `0 10px 24px ${alpha("#000", 0.03)}`,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              bgcolor: alpha("#000", 0.02),
              "& th": { fontWeight: 900 },
            }}
          >
            <TableCell>Trabajador</TableCell>
            <TableCell>Área</TableCell>
            <TableCell>Punto de venta</TableCell>
            <TableCell>Horario</TableCell>
            <TableCell>Estatus</TableCell>
            <TableCell sx={{ width: 190 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {workers.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Avatar src={row.profile_photo || ""}>
                    <BadgeRoundedIcon />
                  </Avatar>

                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>
                      {[row.first_name, row.last_name].filter(Boolean).join(" ") ||
                        `Trabajador #${row.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.position || "Sin puesto"} · {row.email || "Sin correo"}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>

              <TableCell>
                {row?.work_area?.name || row?.workArea?.name || "Sin asignar"}
              </TableCell>

              <TableCell>
                {row?.pos_location?.name || row?.posLocation?.name || "Sin asignar"}
              </TableCell>

              <TableCell>
                {row.entry_time || "—"} / {row.exit_time || "—"}
              </TableCell>

              <TableCell>
                <StatusChip active={Boolean(row.is_active)} />
              </TableCell>

              <TableCell>
                <Stack direction="row" spacing={0.8}>
                  <Tooltip title="Editar">
                    <span>
                      <IconButton
                        disabled={!canManage}
                        onClick={() => onEdit(row)}
                        sx={{
                          borderRadius: 2.2,
                          border: `1px solid ${alpha("#000", 0.10)}`,
                          bgcolor: "#fff",
                        }}
                      >
                        <EditRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="Cambiar estado">
                    <span>
                      <IconButton
                        disabled={!canManage}
                        onClick={() => onToggleStatus(row)}
                        sx={{
                          borderRadius: 2.2,
                          border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
                          bgcolor: alpha(COLORS.accent, 0.08),
                        }}
                      >
                        <ToggleOnRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton
                        disabled={!canManage}
                        onClick={() => onDelete(row)}
                        sx={{
                          borderRadius: 2.2,
                          border: `1px solid ${alpha(COLORS.danger, 0.25)}`,
                          color: COLORS.danger,
                          bgcolor: alpha(COLORS.danger, 0.03),
                        }}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}

          {workers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                <Typography sx={{ fontWeight: 900 }}>
                  No hay trabajadores registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registra personal para asignarlo a áreas y puntos de venta.
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}