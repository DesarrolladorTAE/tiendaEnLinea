import React from "react";
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Stack, Typography } from "@mui/material";
import { resourceTypeLabel } from "./ResourceList";

export default function ResourceDetailsDialog({ open, resource, loading, onClose, onEdit }) {
  const config = resource?.config && typeof resource.config === "object" ? Object.entries(resource.config) : [];
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: "#fff", color: "#000", border: "1px solid rgba(0,0,0,.08)", borderRadius: 3 } }}>
    <DialogTitle fontWeight={900}>Detalle del recurso</DialogTitle>
    <DialogContent dividers sx={{ bgcolor: "#fafafa", borderColor: "rgba(0,0,0,.08)" }}>
      {loading ? <Typography>Cargando…</Typography> : resource && <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5" fontWeight={900}>{resource.name}</Typography><Chip label={resource.is_active ? "Activo" : "Inactivo"} color={resource.is_active ? "success" : "default"} /></Stack>
        <Grid container spacing={2}>{[["Tipo", resourceTypeLabel(resource.type)], ["Código", resource.resource_code || "—"], ["Capacidad", resource.capacity ?? 1], ["Usuario", resource.user_id || "—"], ["Servicios asignados", resource.services?.length ?? resource.services_count ?? 0]].map(([label, value]) => <Grid key={label} size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={700}>{value}</Typography></Grid>)}</Grid>
        <Divider />
        <Typography>{resource.description || "Sin descripción."}</Typography>
        {!!config.length && <><Divider /><Typography fontWeight={900}>Configuración</Typography><Grid container spacing={1}>{config.map(([key, value]) => <Grid key={key} size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">{key.replaceAll("_", " ")}</Typography><Typography>{String(value)}</Typography></Grid>)}</Grid></>}
      </Stack>}
    </DialogContent>
    <DialogActions><Button onClick={onClose} sx={{ color: "#000", fontWeight: 900 }}>Cerrar</Button>{resource && <Button variant="contained" onClick={() => onEdit(resource)} sx={{ bgcolor: "#000", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "rgba(0,0,0,.85)" } }}>Editar</Button>}</DialogActions>
  </Dialog>;
}
