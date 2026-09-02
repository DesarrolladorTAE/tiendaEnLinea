import React from "react";
import {
  Avatar, Box, Card, CardContent, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";

const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const imageOf = (service) => service?.primary_image?.image_url || service?.primaryImage?.image_url || service?.images?.[0]?.image_url;
const typeLabels = {
  general: "General",
  appointment: "Cita",
  repair: "Reparación",
  onsite: "Servicio a domicilio",
  tour: "Tour / Transporte",
  rental: "Renta",
  event: "Evento",
  digital: "Digital",
};

function Actions({ service, onView, onEdit, onDelete }) {
  return (
    <Stack direction="row" justifyContent="flex-end">
      <Tooltip title="Ver"><IconButton onClick={() => onView(service)}><VisibilityRoundedIcon /></IconButton></Tooltip>
      <Tooltip title="Editar"><IconButton color="primary" onClick={() => onEdit(service)}><EditRoundedIcon /></IconButton></Tooltip>
      <Tooltip title="Eliminar"><IconButton color="error" onClick={() => onDelete(service)}><DeleteOutlineRoundedIcon /></IconButton></Tooltip>
    </Stack>
  );
}

export default function ServiceList({ services, onView, onEdit, onDelete }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (mobile) {
    return (
      <Stack spacing={1.5}>
        {services.map((service) => (
          <Card key={service.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: "#292d32", color: "#fff", borderColor: "rgba(255,255,255,.35)" }}>
            <CardContent>
              <Stack direction="row" spacing={1.5}>
                <Avatar variant="rounded" src={imageOf(service)} sx={{ width: 72, height: 72, bgcolor: "grey.200" }}>
                  <ImageNotSupportedRoundedIcon color="disabled" />
                </Avatar>
                <Box minWidth={0} flex={1}>
                  <Typography fontWeight={900} noWrap>{service.name}</Typography>
                  <Typography variant="body2" sx={{ color: "#adb5bd" }} noWrap>{service.code || "Sin código"}</Typography>
                  <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={money(service.base_price)} sx={{ fontWeight: 800 }} />
                    <Chip size="small" label={service.is_active ? "Activo" : "Inactivo"} color={service.is_active ? "success" : "default"} />
                  </Stack>
                </Box>
              </Stack>
              <Actions service={service} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ border: "1px solid #fff", borderRadius: 1 }}>
      <Table sx={{ bgcolor: "#212529", "& .MuiTableCell-root": { color: "#fff", borderColor: "#495057" } }}>
        <TableHead><TableRow sx={{ bgcolor: "#6c757d" }}>
          <TableCell>Servicio</TableCell><TableCell>Tipo</TableCell><TableCell>Precio</TableCell><TableCell>Duración</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id} hover>
              <TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar variant="rounded" src={imageOf(service)}><ImageNotSupportedRoundedIcon fontSize="small" /></Avatar><Box><Typography fontWeight={800}>{service.name}</Typography><Typography variant="caption" sx={{ color: "#adb5bd" }}>{service.code || "Sin código"}</Typography></Box></Stack></TableCell>
              <TableCell>{typeLabels[service.service_type] || service.service_type}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{money(service.base_price)}</TableCell>
              <TableCell>{service.duration_minutes ? `${service.duration_minutes} min` : "—"}</TableCell>
              <TableCell><Chip size="small" label={service.is_active ? "Activo" : "Inactivo"} color={service.is_active ? "success" : "default"} /></TableCell>
              <TableCell align="right"><Actions service={service} onView={onView} onEdit={onEdit} onDelete={onDelete} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
