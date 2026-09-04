import React from "react";
import {
  Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, FormControlLabel, Grid,
  IconButton, MenuItem, Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import HomeRepairServiceRoundedIcon from "@mui/icons-material/HomeRepairServiceRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import MiscellaneousServicesRoundedIcon from "@mui/icons-material/MiscellaneousServicesRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ServiceSatFields from "./ServiceSatFields";

export const SERVICE_TYPES = [
  ["general", "General", MiscellaneousServicesRoundedIcon],
  ["appointment", "Cita", CalendarMonthRoundedIcon],
  ["repair", "Reparación", BuildRoundedIcon],
  ["onsite", "A domicilio", HomeRepairServiceRoundedIcon],
  ["tour", "Tour / Transporte", DirectionsBusRoundedIcon],
  ["rental", "Renta", Inventory2RoundedIcon],
  ["event", "Evento", CelebrationRoundedIcon],
  ["digital", "Digital", ComputerRoundedIcon],
];

const fieldSx = { "& .MuiInputBase-root": { bgcolor: "#fff" } };
const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const typeLabel = (value) => SERVICE_TYPES.find(([key]) => key === value)?.[1] || value;

export function ServiceGeneralStep({ form, setField, errors, imageProps }) {
  return <Stack spacing={3}>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}><TextField label="Nombre del servicio" value={form.name} onChange={setField("name")} error={!!errors.name} helperText={errors.name} required fullWidth sx={fieldSx} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField label="Código interno" value={form.code} onChange={setField("code")} fullWidth sx={fieldSx} /></Grid>
    </Grid>
    <Box>
      <Typography fontWeight={800} color="white" mb={1}>Tipo de servicio *</Typography>
      {errors.service_type && <Typography color="error.light" variant="body2" mb={1}>{errors.service_type}</Typography>}
      <Grid container spacing={1.5}>{SERVICE_TYPES.map(([value, label, Icon]) => <Grid size={{ xs: 6, sm: 4, md: 3 }} key={value}><Card variant="outlined" sx={{ height: "100%", bgcolor: form.service_type === value ? "#a66b00" : "#303944", color: "#fff", borderColor: form.service_type === value ? "#f9b233" : "rgba(255,255,255,.25)", transition: "transform .2s ease, border-color .2s ease", "&:hover": { transform: "translateY(-3px)", borderColor: "#f9b233" } }}><CardActionArea onClick={() => setField("service_type")({ target: { value } })} sx={{ height: "100%" }}><CardContent sx={{ textAlign: "center", py: 2 }}><Icon sx={{ fontSize: 34, mb: 0.5, color: "#fff" }} /><Typography fontWeight={800} sx={{ color: "#fff" }}>{label}</Typography></CardContent></CardActionArea></Card></Grid>)}</Grid>
    </Box>
    <TextField label="Descripción corta" value={form.short_description} onChange={setField("short_description")} fullWidth sx={fieldSx} />
    <TextField label="Descripción completa" value={form.description} onChange={setField("description")} multiline minRows={4} fullWidth sx={fieldSx} />
    <Box><Typography fontWeight={800} color="white" mb={1}>Imágenes</Typography><ServiceImagesFields {...imageProps} /></Box>
  </Stack>;
}

export function ServicePriceStep({ form, setField, setChecked, errors }) {
  const effectivePrice = form.price_override === "" ? Number(form.base_price || 0) : Number(form.price_override || 0);
  const estimate = form.deposit_type === "percentage" ? effectivePrice * Number(form.deposit_value || 0) / 100 : Number(form.deposit_value || 0);
  return <Stack spacing={3}>
    <TextField label="Precio base" type="number" inputProps={{ min: 0, step: "0.01" }} value={form.base_price} onChange={setField("base_price")} error={!!errors.base_price} helperText={errors.base_price} required fullWidth sx={fieldSx} />
    <TextField select label="Forma de cobro" value={form.billing_mode} onChange={setField("billing_mode")} fullWidth sx={fieldSx}><MenuItem value="fixed">Precio fijo</MenuItem><MenuItem value="hour">Por hora</MenuItem><MenuItem value="person">Por persona</MenuItem><MenuItem value="day">Por día</MenuItem><MenuItem value="unit">Por unidad</MenuItem><MenuItem value="starting_from">Desde</MenuItem><MenuItem value="quote">Cotización</MenuItem></TextField>
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "#303944", borderColor: "rgba(255,255,255,.25)" }}><FormControlLabel control={<Switch checked={!!form.requires_deposit} onChange={setChecked("requires_deposit")} color="warning" />} label={<Typography color="white" fontWeight={800}>¿Requiere anticipo?</Typography>} /></Paper>
    {form.requires_deposit && <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><TextField select label="Tipo de anticipo" value={form.deposit_type} onChange={setField("deposit_type")} error={!!errors.deposit_type} helperText={errors.deposit_type} required fullWidth sx={fieldSx}><MenuItem value="percentage">Porcentaje</MenuItem><MenuItem value="fixed">Cantidad fija</MenuItem></TextField></Grid><Grid size={{ xs: 12, md: 6 }}><TextField label={form.deposit_type === "percentage" ? "Porcentaje" : "Cantidad"} type="number" value={form.deposit_value} onChange={setField("deposit_value")} inputProps={{ min: 0, step: ".01", ...(form.deposit_type === "percentage" ? { max: 100 } : {}) }} error={!!errors.deposit_value} helperText={errors.deposit_value} required fullWidth sx={fieldSx} /></Grid></Grid>}
    {form.requires_deposit && form.deposit_value !== "" && <Alert severity="info">Precio: <b>{money(effectivePrice)}</b> · Anticipo: <b>{form.deposit_type === "percentage" ? `${form.deposit_value}%` : money(form.deposit_value)}</b> · Cantidad estimada: <b>{money(estimate)}</b></Alert>}
    <TextField label="Precio especial en esta sucursal" type="number" inputProps={{ min: 0, step: ".01" }} value={form.price_override} onChange={setField("price_override")} helperText={form.price_override === "" ? "Opcional. Se utilizará el precio base." : `Sustituirá al precio base: ${money(form.price_override)}`} fullWidth sx={fieldSx} />
  </Stack>;
}

export function ServiceOperationStep({ form, setField, setChecked, errors }) {
  const toggles = [["requires_confirmation", "¿Requiere confirmación manual?"], ["requires_resource", "¿Requiere algún recurso?"], ["requires_address", "¿Necesita dirección del cliente?"], ["is_home_service", "¿Puede realizarse a domicilio?"]];
  return <Stack spacing={2.5}>
    {form.service_type === "onsite" && <Alert severity="info">Para servicios a domicilio se recomienda solicitar la dirección y activar la atención a domicilio.</Alert>}
    {form.service_type === "tour" && <Alert severity="info">Después podrás configurar rutas, paradas, salidas, pasajeros y vehículos.</Alert>}
    {form.service_type === "repair" && <Alert severity="info">Después podrás configurar órdenes de servicio, diagnóstico, estados y seguimiento.</Alert>}
    <TextField label="Duración aproximada (minutos)" type="number" inputProps={{ min: 1 }} value={form.duration_minutes} onChange={setField("duration_minutes")} error={!!errors.duration_minutes} helperText={errors.duration_minutes} fullWidth sx={fieldSx} />
    <TextField label="Capacidad simultánea" type="number" inputProps={{ min: 1 }} value={form.default_capacity} onChange={setField("default_capacity")} error={!!errors.default_capacity} helperText={errors.default_capacity} fullWidth sx={fieldSx} />
    <TextField label="Capacidad especial para esta sucursal" type="number" inputProps={{ min: 1 }} value={form.capacity_override} onChange={setField("capacity_override")} error={!!errors.capacity_override} helperText={errors.capacity_override} fullWidth sx={fieldSx} />
    {toggles.map(([key, label]) => <Paper key={key} variant="outlined" sx={{ px: 2, py: 1, bgcolor: "#303944", borderColor: "rgba(255,255,255,.25)" }}><FormControlLabel control={<Switch checked={!!form[key]} onChange={setChecked(key)} color="warning" />} label={<Typography color="white" fontWeight={800}>{label}</Typography>} /></Paper>)}
  </Stack>;
}

export function ServiceBookingStep({ form, setChecked }) {
  return <Stack spacing={3}><Paper variant="outlined" sx={{ p: 2, bgcolor: "#303944", borderColor: "rgba(255,255,255,.25)" }}><FormControlLabel control={<Switch checked={!!form.requires_booking} onChange={setChecked("requires_booking")} color="warning" />} label={<Typography color="white" fontWeight={800}>¿Este servicio necesita reservación?</Typography>} /></Paper>{form.requires_booking ? <Alert severity="success"><b>Este servicio utilizará agenda y reservaciones.</b><br />Después de guardar podrás configurar horarios, intervalos, capacidad, excepciones, días cerrados y disponibilidad.<br /><br />Duración: <b>{form.duration_minutes ? `${form.duration_minutes} minutos` : "Sin definir"}</b><br />Capacidad: <b>{form.capacity_override || form.default_capacity || "Sin definir"}</b></Alert> : <Alert severity="info">Este servicio podrá venderse o utilizarse sin necesidad de agenda.</Alert>}</Stack>;
}

export function ServiceResourcesStep({ form }) {
  const examples = form.service_type === "tour" ? ["Vehículo", "Autobús", "Van", "Chofer"] : form.service_type === "rental" ? ["Habitación", "Equipo", "Vehículo", "Espacio"] : form.service_type === "appointment" ? ["Empleado", "Consultorio", "Cabina", "Espacio"] : ["Empleado", "Vehículo", "Habitación", "Equipo", "Espacio", "Otro"];
  if (!form.requires_resource) return <Alert severity="info">Este servicio no requiere recursos. Puedes regresar a Operación para activarlos.</Alert>;
  return <Stack spacing={2}><Alert severity="info">Después de crear el servicio podrás asignar los recursos disponibles de esta sucursal.</Alert><Typography color="white" fontWeight={800}>Ejemplos de recursos</Typography><Stack direction="row" gap={1} flexWrap="wrap">{examples.map((item) => <Chip key={item} label={item} sx={{ color: "#fff", bgcolor: "#4b5563" }} />)}</Stack></Stack>;
}

export function ServiceFinalStep({ form, setField, setChecked, errors, branch, imageCount }) {
  const price = form.price_override === "" ? form.base_price : form.price_override;
  return <Stack spacing={3}>
    <ServiceSatFields form={form} setValue={(key, value) => setField(key)({ target: { value } })} />
    <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><TextField select label="Objeto de impuesto" value={form.tax_object} onChange={setField("tax_object")} fullWidth sx={fieldSx}><MenuItem value="01">01 - No objeto de impuesto</MenuItem><MenuItem value="02">02 - Sí objeto de impuesto</MenuItem><MenuItem value="03">03 - Sí objeto, sin desglose</MenuItem><MenuItem value="04">04 - Sí objeto, no causa impuesto</MenuItem></TextField></Grid><Grid size={{ xs: 12, md: 6 }}><TextField label="IVA (%)" type="number" inputProps={{ min: 0, max: 100, step: ".01" }} value={form.iva_percentage} onChange={setField("iva_percentage")} error={!!errors.iva_percentage} helperText={errors.iva_percentage} fullWidth sx={fieldSx} /></Grid></Grid>
    <FormControlLabel control={<Switch checked={!!form.is_active} onChange={setChecked("is_active")} color="warning" />} label={<Typography color="white" fontWeight={800}>Servicio activo</Typography>} />
    <Card sx={{ bgcolor: "#303944", color: "#fff", border: "1px solid #f9b233" }}><CardContent><Typography variant="h6" fontWeight={900} mb={2} sx={{ color: "#fff" }}>Resumen</Typography><Grid container spacing={2}>{[["Servicio", form.name || "—"], ["Tipo", typeLabel(form.service_type)], ["Precio", money(price)], ["Duración", form.duration_minutes ? `${form.duration_minutes} minutos` : "—"], ["Reservación", form.requires_booking ? "Sí" : "No"], ["Capacidad", form.capacity_override || form.default_capacity || "—"], ["Anticipo", form.requires_deposit ? (form.deposit_type === "percentage" ? `${form.deposit_value}%` : money(form.deposit_value)) : "No"], ["Sucursal", branch?.name || `#${branch?.id || "—"}`], ["Imágenes", imageCount], ["Estado", form.is_active ? "Activo" : "Inactivo"]].map(([label, value]) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}><Typography variant="caption" sx={{ color: "#bfc5cc" }}>{label}</Typography><Typography fontWeight={800} sx={{ color: "#fff", overflowWrap: "anywhere" }}>{value}</Typography></Grid>)}</Grid></CardContent></Card>
  </Stack>;
}

export function ServiceImagesFields({ existingImages, deletedIds, files, primaryImageId, primaryNewIndex, onFiles, onToggleDelete, onPrimaryExisting, onPrimaryNew, onRemoveNew }) {
  const available = Math.max(0, 10 - existingImages.filter((img) => !deletedIds.includes(img.id)).length);
  return <Stack spacing={2}>
    <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateRoundedIcon />} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, color: "#fff", borderColor: "rgba(255,255,255,.5)", borderRadius: 2, px: 3, py: 1.25 }}>
      Seleccionar imágenes
      <Box component="input" type="file" hidden multiple accept="image/*" onChange={(event) => onFiles(Array.from(event.target.files || []).slice(0, available))} />
    </Button>
    <Typography variant="caption" sx={{ color: "#bfc5cc" }}>Máximo 10 imágenes · {files.length} nueva(s) seleccionada(s)</Typography>
    <Grid container spacing={2}>{existingImages.map((image) => { const deleted = deletedIds.includes(image.id); const primary = primaryImageId === image.id && !deleted; return <Grid size={{ xs: 6, sm: 4, md: 3 }} key={image.id}><Card sx={{ position: "relative", opacity: deleted ? .4 : 1, bgcolor: "#303944", border: primary ? "2px solid #f9b233" : "1px solid rgba(255,255,255,.2)" }}><Box component="img" src={image.image_url} alt={image.alt_text || "Servicio"} sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />{primary && <Chip icon={<StarRoundedIcon />} label="Principal" color="warning" size="small" sx={{ position: "absolute", left: 8, top: 8 }} />}<Stack direction="row" justifyContent="space-between" p={.5}><IconButton color="warning" disabled={deleted} onClick={() => onPrimaryExisting(image.id)} aria-label="Usar como principal"><StarRoundedIcon /></IconButton><IconButton color={deleted ? "info" : "error"} onClick={() => onToggleDelete(image.id)} aria-label={deleted ? "Restaurar" : "Eliminar"}>{deleted ? <CloseRoundedIcon sx={{ transform: "rotate(45deg)" }} /> : <DeleteOutlineRoundedIcon />}</IconButton></Stack></Card></Grid>; })}{files.map((file, index) => { const primary = primaryNewIndex === index; return <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`${file.name}-${index}`}><Card sx={{ position: "relative", bgcolor: "#303944", border: primary ? "2px solid #f9b233" : "1px solid rgba(255,255,255,.2)" }}><Avatar src={URL.createObjectURL(file)} alt={file.name} variant="square" sx={{ width: "100%", height: "auto", aspectRatio: "1" }} />{primary && <Chip icon={<StarRoundedIcon />} label="Principal" color="warning" size="small" sx={{ position: "absolute", left: 8, top: 8 }} />}<Stack direction="row" justifyContent="space-between" p={.5}><IconButton color="warning" onClick={() => onPrimaryNew(index)}><StarRoundedIcon /></IconButton><IconButton color="error" onClick={() => onRemoveNew(index)}><DeleteOutlineRoundedIcon /></IconButton></Stack></Card></Grid>; })}</Grid>
  </Stack>;
}
