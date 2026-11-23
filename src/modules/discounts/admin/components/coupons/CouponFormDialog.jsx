import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Stack, TextField, MenuItem, Button, CircularProgress,
  FormControlLabel, Switch
} from "@mui/material";

import DoneRoundedIcon from "@mui/icons-material/DoneRounded";

export function CouponFormDialog({ open, onClose, editing, form, setForm, onSave, saving }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {editing ? "Editar cupón" : "Nuevo cupón"}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Código (ej: BIENVENIDA10)"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              fullWidth
            />
          </Grid>

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

          <Grid item xs={12} md={3}>
            <TextField
              label="Max usos (opcional)"
              value={form.max_uses}
              onChange={(e) => setForm((s) => ({ ...s, max_uses: e.target.value }))}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Usos por cliente (opcional)"
              value={form.uses_per_customer}
              onChange={(e) => setForm((s) => ({ ...s, uses_per_customer: e.target.value }))}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Mín subtotal (opcional)"
              value={form.min_subtotal}
              onChange={(e) => setForm((s) => ({ ...s, min_subtotal: e.target.value }))}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Mín piezas (opcional)"
              value={form.min_qty}
              onChange={(e) => setForm((s) => ({ ...s, min_qty: e.target.value }))}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.is_active}
                    onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                  />
                }
                label="Activo"
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
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>

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