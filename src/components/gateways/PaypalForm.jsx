// src/components/gateways/PaypalForm.jsx
import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, MenuItem, Switch, FormControlLabel, Button, Alert } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts"; // si ya usas SweetAlert2 helpers

export default function PaypalForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
    mode: "sandbox",
    webhook_id: "",
    active: true,
  });

  useEffect(() => {
    setLoading(true);
    axiosClient.get("/payment-gateways/paypal")
      .then(({data}) => {
        if (data?.exists && data.data) {
          setForm(f => ({
            ...f,
            client_id:  data.data.client_id || "",
            // Por seguridad, el secret NO se devuelve. Se mantiene en blanco salvo que el user lo re-cambie
            client_secret: "",
            mode: data.data.mode || "sandbox",
            webhook_id: data.data.webhook_id || "",
            active: !!data.data.active,
          }));
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setInitialLoaded(true); });
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: value}));
  };

  const onToggleActive = (e) => {
    setForm(prev => ({...prev, active: e.target.checked}));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        client_id: form.client_id.trim(),
        // Si está vacío, mantendremos el anterior en backend solo si ajustas la lógica; aquí forzamos que se reenvíe siempre:
        client_secret: form.client_secret.trim(),
        mode: form.mode,
        webhook_id: form.webhook_id.trim() || null,
        active: form.active,
      };
      if (!payload.client_secret) {
        showError("Debes proporcionar el Client Secret.");
        setLoading(false);
        return;
      }
      await axiosClient.post("/payment-gateways/paypal", payload);
      showSuccess("PayPal guardado correctamente.");
      setForm(prev => ({ ...prev, client_secret: "" }));
    } catch (err) {
      showError("No se pudo guardar la configuración de PayPal.");
    } finally {
      setLoading(false);
    }
  };

  if (!initialLoaded) return null;

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            name="client_id"
            label="Client ID"
            value={form.client_id}
            onChange={onChange}
            fullWidth required
            disabled={loading}
            helperText="Cópialo desde tu App de PayPal (Dashboard)"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="client_secret"
            label="Client Secret"
            value={form.client_secret}
            onChange={onChange}
            type="password"
            fullWidth required
            disabled={loading}
            helperText="No se mostrará por seguridad. Vuelve a pegarlo si deseas cambiarlo."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            name="mode"
            label="Modo"
            value={form.mode}
            onChange={onChange}
            fullWidth
            disabled={loading}
          >
            <MenuItem value="sandbox">Sandbox (pruebas)</MenuItem>
            <MenuItem value="live">Live (producción)</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            name="webhook_id"
            label="Webhook ID (opcional)"
            value={form.webhook_id}
            onChange={onChange}
            fullWidth
            disabled={loading}
            helperText="Si ya creaste un Webhook en PayPal, pega su ID para validar firmas."
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={form.active} onChange={onToggleActive} />}
            label="Activar PayPal para mi tienda"
          />
        </Grid>
        <Grid item xs={12}>
          <Alert severity="info">
            Asegúrate de usar <strong>Sandbox</strong> para pruebas.  
            Cuando migres a producción, cambia a <strong>Live</strong> y actualiza tus claves.
          </Alert>
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Guardando..." : "Guardar PayPal"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
