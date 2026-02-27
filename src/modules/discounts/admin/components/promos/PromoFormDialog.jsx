import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Stack, TextField, MenuItem, Paper, Typography,
  Box, Button, CircularProgress, Alert, FormControlLabel, Switch
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";


export function PromoFormDialog({
  open,
  onClose,
  editing,
  form,
  setForm,
  onSave,
  saving,
  imgPreview,
  imgUploading,
  onPickImage,
}) {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {editing ? "Editar promoción" : "Nueva promoción"}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Slug (opcional)"
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                helperText="Si lo dejas vacío, se genera automático."
                fullWidth
              />

              <TextField
                label="Descripción"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                multiline
                minRows={3}
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Tipo de descuento"
                    value={form.discount_type}
                    onChange={(e) => setForm((s) => ({ ...s, discount_type: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="percentage">% (porcentaje)</MenuItem>
                    <MenuItem value="fixed">$ (monto fijo)</MenuItem>
                    <MenuItem value="special_price">Precio especial</MenuItem>
                    <MenuItem value="bulk">Mayoreo (tiers)</MenuItem>
                    <MenuItem value="bxgy">2x1 / 3x2 (BxGy)</MenuItem>
                    <MenuItem value="combo">Combo</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  {form.discount_type === "special_price" ? (
                    <TextField
                      label="Precio especial (unitario)"
                      value={form.special_price}
                      onChange={(e) => setForm((s) => ({ ...s, special_price: e.target.value }))}
                      fullWidth
                    />
                  ) : (
                    <TextField
                      label={form.discount_type === "percentage" ? "Porcentaje (%)" : "Monto ($)"}
                      value={form.discount_value}
                      onChange={(e) => setForm((s) => ({ ...s, discount_value: e.target.value }))}
                      fullWidth
                    />
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Inicio (opcional)"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((s) => ({ ...s, starts_at: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fin (opcional)"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm((s) => ({ ...s, ends_at: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Prioridad"
                    value={form.priority}
                    onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Mínimo subtotal (opcional)"
                    value={form.min_subtotal}
                    onChange={(e) => setForm((s) => ({ ...s, min_subtotal: e.target.value }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Mínimo piezas (opcional)"
                    value={form.min_qty}
                    onChange={(e) => setForm((s) => ({ ...s, min_qty: e.target.value }))}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Tope de descuento (opcional)"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm((s) => ({ ...s, max_discount_amount: e.target.value }))}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ height: "100%" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!form.is_active}
                          onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                        />
                      }
                      label="Activa"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!form.stackable}
                          onChange={(e) => setForm((s) => ({ ...s, stackable: e.target.checked }))}
                        />
                      }
                      label="Acumulable"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Grid>

          {/* Right: image */}
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}
            >
              <Stack spacing={1.5} alignItems="center">
                <Typography fontWeight={900}>Imagen</Typography>

                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    bgcolor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {imgPreview ? (
                    <img
                      src={imgPreview}
                      alt="promo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={1} sx={{ opacity: 0.7 }}>
                      <ImageRoundedIcon />
                      <Typography variant="caption">Sin imagen</Typography>
                    </Stack>
                  )}
                </Box>

                <Button fullWidth variant="outlined" component="label" startIcon={<ImageRoundedIcon />}>
                  Elegir imagen
                  <input hidden type="file" accept="image/*" onChange={(e) => onPickImage(e.target.files?.[0] || null)} />
                </Button>

                {imgUploading && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="caption">Subiendo imagen...</Typography>
                  </Stack>
                )}

                <Alert severity="info" sx={{ width: "100%" }}>
                  La imagen se sube al guardar.
                </Alert>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : <DoneRoundedIcon />}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}