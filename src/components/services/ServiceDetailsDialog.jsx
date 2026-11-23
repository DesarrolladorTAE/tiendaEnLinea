import React from "react";
import { Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Button, Divider, Grid, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const typeLabels = { general: "General", appointment: "Cita", repair: "Reparación", onsite: "Servicio a domicilio", tour: "Tour / Transporte", rental: "Renta", event: "Evento", digital: "Digital" };

export default function ServiceDetailsDialog({ open, service, loading, onClose, onEdit }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  if (!service && !loading) return null;
  const image = service?.primary_image?.image_url || service?.primaryImage?.image_url || service?.images?.[0]?.image_url;
  const flags = [["requires_booking", "Requiere cita"], ["is_home_service", "A domicilio"], ["requires_resource", "Requiere recurso"], ["requires_confirmation", "Confirmación"], ["requires_deposit", "Anticipo"]];
  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: "#fff", color: "#000", border: "1px solid rgba(0,0,0,.08)", borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Detalle del servicio</DialogTitle><Divider sx={{ borderColor: "#495057" }} />
      <DialogContent sx={{ py: 3 }}>
        {loading ? <Typography>Cargando…</Typography> : (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Avatar src={image} variant="rounded" sx={{ width: { xs: "100%", sm: 180 }, height: 160, bgcolor: "grey.100" }} />
              <Box><Typography variant="h5" fontWeight={900}>{service.name}</Typography><Typography sx={{ color: "#adb5bd" }}>{service.code || "Sin código"}</Typography><Typography variant="h6" mt={1}>{money(service.base_price)}</Typography><Stack direction="row" gap={1} mt={1} flexWrap="wrap">{flags.filter(([key]) => service[key]).map(([key, label]) => <Chip key={key} label={label} size="small" sx={{ bgcolor: "#6c757d", color: "#fff" }} />)}</Stack></Box>
            </Stack>
            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Tipo</Typography><Typography fontWeight={700}>{typeLabels[service.service_type] || service.service_type || "—"}</Typography></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Duración</Typography><Typography fontWeight={700}>{service.duration_minutes ? `${service.duration_minutes} min` : "—"}</Typography></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Capacidad</Typography><Typography fontWeight={700}>{service.default_capacity || "—"}</Typography></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">IVA</Typography><Typography fontWeight={700}>{service.iva_percentage ?? "—"}%</Typography></Grid>
            </Grid>
            {(service.short_description || service.description) && <Box><Typography fontWeight={900}>Descripción</Typography><Typography sx={{ whiteSpace: "pre-wrap", color: "#adb5bd" }}>{service.description || service.short_description}</Typography></Box>}
          </Stack>
        )}
      </DialogContent><Divider />
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose} sx={{ color: "#000", fontWeight: 900 }}>Cerrar</Button><Button variant="contained" onClick={() => onEdit(service)} disabled={loading} sx={{ bgcolor: "#000", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "rgba(0,0,0,.85)" } }}>Editar</Button></DialogActions>
    </Dialog>
  );
}
