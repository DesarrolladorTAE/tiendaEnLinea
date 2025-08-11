// src/components/clientes/ClienteFormDialog.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Stack, Button
} from "@mui/material";

const empty = {
  nombre_alias: "",
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
  regimen_codigo: "",
  email: "",
  telefono: "",
};

export default function ClienteFormDialog({ open, onClose, onSubmit, initialValues }) {
  const init = useMemo(() => ({ ...empty, ...(initialValues || {}) }), [initialValues]);
  const [form, setForm] = useState(init);

  // resetea cuando cambie initialValues / open
  React.useEffect(() => setForm(init), [init, open]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre_alias?.trim()) return;
    const payload = {
      ...form,
      rfc: form.rfc?.toUpperCase().replace(/\s+/g, "") || null,
    };
    onSubmit?.(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialValues ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre *"
                value={form.nombre_alias}
                onChange={handleChange("nombre_alias")}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="RFC" value={form.rfc} onChange={handleChange("rfc")} fullWidth />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Razón social"
                value={form.razon_social}
                onChange={handleChange("razon_social")}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="C.P. fiscal"
                value={form.codigo_postal_fiscal}
                onChange={handleChange("codigo_postal_fiscal")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Régimen (código)"
                value={form.regimen_codigo}
                onChange={handleChange("regimen_codigo")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Teléfono" value={form.telefono} onChange={handleChange("telefono")} fullWidth />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Email (fiscal)" type="email" value={form.email} onChange={handleChange("email")} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}>
              {initialValues ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </Stack>
        </DialogActions>
      </form>
    </Dialog>
  );
}
