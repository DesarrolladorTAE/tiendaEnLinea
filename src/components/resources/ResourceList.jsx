import React from "react";
import {
  Box, Card, CardContent, Chip, IconButton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export const RESOURCE_TYPES = [
  ["employee", "Empleado"],
  ["vehicle", "Vehículo"],
  ["room", "Habitación"],
  ["space", "Espacio"],
  ["equipment", "Equipo"],
  ["capacity", "Capacidad"],
  ["other", "Otro"],
];

export const resourceTypeLabel = (type) =>
  RESOURCE_TYPES.find(([value]) => value === type)?.[1] || type || "Otro";

export default function ResourceList({ resources, onView, onEdit, onDelete }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const actions = (resource) => <Stack direction="row" justifyContent="flex-end">
    <Tooltip title="Ver"><IconButton onClick={() => onView(resource)}><VisibilityRoundedIcon /></IconButton></Tooltip>
    <Tooltip title="Editar"><IconButton color="primary" onClick={() => onEdit(resource)}><EditRoundedIcon /></IconButton></Tooltip>
    {resource.is_active && <Tooltip title="Desactivar"><IconButton color="error" onClick={() => onDelete(resource)}><DeleteOutlineRoundedIcon /></IconButton></Tooltip>}
  </Stack>;

  if (!mobile) return <TableContainer sx={{ border: "1px solid rgba(0,0,0,.06)", borderRadius: 2, overflow: "hidden" }}>
    <Table sx={{ bgcolor: "#fff", "& .MuiTableCell-root": { color: "#000", borderColor: "rgba(0,0,0,.08)" } }}>
      <TableHead><TableRow sx={{ bgcolor: "rgba(0,0,0,.02)", "& th": { fontWeight: 900 } }}><TableCell>Recurso</TableCell><TableCell>Tipo</TableCell><TableCell>Capacidad</TableCell><TableCell>Servicios</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
      <TableBody>{resources.map((resource) => <TableRow key={resource.id} hover>
        <TableCell><Typography fontWeight={900}>{resource.name}</Typography><Typography variant="caption" sx={{ color: "#d9e0e7" }}>{resource.resource_code || "Sin código"}</Typography></TableCell>
        <TableCell><Chip size="small" label={resourceTypeLabel(resource.type)} sx={{ bgcolor: "#f9b233", color: "#171b20", fontWeight: 800 }} /></TableCell>
        <TableCell>{resource.capacity ?? 1}</TableCell><TableCell>{resource.services_count ?? 0}</TableCell>
        <TableCell><Chip size="small" label={resource.is_active ? "Activo" : "Inactivo"} color={resource.is_active ? "success" : "default"} /></TableCell>
        <TableCell align="right">{actions(resource)}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>;

  return (
    <Stack spacing={1.5}>
      {resources.map((resource) => (
          <Card
            key={resource.id}
            variant="outlined"
            sx={{
              height: "100%",
              bgcolor: "#fff",
              color: "#000",
              borderColor: "rgba(0,0,0,.08)",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={900} noWrap>{resource.name}</Typography>
                  <Typography variant="body2" sx={{ color: "#c7cbd1" }}>
                    {resource.resource_code || "Sin código"}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={resource.is_active ? "Activo" : "Inactivo"}
                  color={resource.is_active ? "success" : "default"}
                />
              </Stack>

              <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                <Chip size="small" label={resourceTypeLabel(resource.type)} sx={{ bgcolor: "#f9b233", color: "#171b20", fontWeight: 800 }} />
                <Chip size="small" label={`Capacidad: ${resource.capacity ?? 1}`} variant="outlined" sx={{ color: "#000", borderColor: "rgba(0,0,0,.15)" }} />
                <Chip size="small" label={`${resource.services_count ?? 0} servicio(s)`} variant="outlined" sx={{ color: "#000", borderColor: "rgba(0,0,0,.15)" }} />
              </Stack>

              <Typography variant="body2" sx={{ color: "#d7dbe0", mt: 2, mb: 2, flexGrow: 1 }}>
                {resource.description || "Sin descripción."}
              </Typography>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: "#e2e8f0" }}>{resource.services_count ?? 0} servicio(s)</Typography>
                <Box>{actions(resource)}</Box>
              </Stack>
            </CardContent>
          </Card>
      ))}
    </Stack>
  );
}
