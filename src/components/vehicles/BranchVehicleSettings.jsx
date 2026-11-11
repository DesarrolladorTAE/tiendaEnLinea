import React, { useState } from "react";
import { Alert, Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useTienda } from "../../context/TiendaContext";
import useBranchCatalogSettings from "../../hooks/useBranchCatalogSettings";
import axiosClient from "../../config/axiosClient";

export default function BranchVehicleSettings({ branchId }) {
  const { tienda } = useTienda();
  const allowed = Number(tienda?.id) === 566;
  const { settings, loading, error, retry } = useBranchCatalogSettings(branchId, allowed);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const value = draft?.branchId === branchId ? draft : settings;
  const update = patch => { setDraft({ ...value, ...patch, branchId }); setNotice(null); };
  const save = async () => {
    setBusy(true); setNotice(null);
    try {
      await axiosClient.patch(`/admin/branches/${branchId}/catalog-settings`, { catalog_search_mode: value.catalog_search_mode, vehicle_compatibilities_enabled: Boolean(value.vehicle_compatibilities_enabled) });
      setDraft(null); retry(); setNotice({ severity: "success", text: "Configuración de la sucursal guardada." });
    } catch (err) { setNotice({ severity: "error", text: err.response?.data?.message || "No se pudo guardar la configuración." }); }
    finally { setBusy(false); }
  };
  if (!allowed || !branchId) return null;
  return <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#fff", color: "#172033", border: "1px solid #ddd6fe", my: 2 }}>
    <Typography fontWeight={800}>Vehículos y búsqueda del catálogo</Typography>
    <Typography variant="body2" sx={{ mb: 2 }}>Esta configuración se aplica únicamente a la sucursal seleccionada. Deshabilitar el editor conserva las relaciones existentes.</Typography>
    {loading && <Typography role="status">Cargando configuración…</Typography>}
    {error && <Alert severity="error">{error} <Button onClick={retry}>Reintentar</Button></Alert>}
    {value?.vehicle_feature_available && !loading && <Stack spacing={2}>
      <FormControlLabel control={<Switch checked={Boolean(value.vehicle_compatibilities_enabled)} disabled={busy} onChange={e => update({ vehicle_compatibilities_enabled: e.target.checked })} />} label="Permitir administrar compatibilidades en productos" />
      <TextField select label="Búsqueda del catálogo público" value={value.catalog_search_mode || "normal"} disabled={busy} onChange={e => update({ catalog_search_mode: e.target.value })}>
        <MenuItem value="normal">Normal</MenuItem><MenuItem value="vehicle">Por vehículo</MenuItem><MenuItem value="both">Normal y por vehículo</MenuItem>
      </TextField>
      <Button type="button" variant="contained" disabled={busy || !draft || draft.branchId !== branchId} onClick={save}>{busy ? "Guardando…" : "Guardar configuración vehicular"}</Button>
    </Stack>}
    {notice && <Alert sx={{ mt: 2 }} severity={notice.severity}>{notice.text}</Alert>}
  </Box>;
}
