import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Stack, Switch, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import client from "../../config/axiosClient";
import { posHeaderButton, posMobileCard, posSectionIcon } from "../POS/posSectionStyles";

function readCatalog(response) {
  if (!Array.isArray(response.data?.data)) throw new Error("Catálogo inválido");
  return [...response.data.data].sort((a, b) => a.sort_order - b.sort_order);
}

function errorMessage(error, fallback) {
  const data = error.response?.data;
  return Object.values(data?.errors ?? {}).flat().join(" ") || data?.message || fallback;
}

export default function POSModulesDialog({ pos, onClose, onSaved }) {
  const posId = pos?.id;
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [catalog, setCatalog] = useState(null);
  const [changes, setChanges] = useState({});
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    client.get("/pos/modules", {
      signal: controller.signal,
      ...(posId != null ? { params: { pos_location_id: posId } } : {}),
    }).then(readCatalog).then((modules) => {
      if (!controller.signal.aborted) setCatalog(modules);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(errorMessage(err, "No se pudo cargar el catálogo."));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [attempt, posId]);

  const isSpecific = posId != null;
  const preference = ({ source, enabled }) => isSpecific && source !== "pos" ? null : enabled;
  const updates = (catalog ?? [])
    .filter((module) => {
      const value = changes[module.key];
      return value !== undefined && value !== preference(module) && (module.available || (isSpecific && value !== true));
    })
    .map(({ key }) => ({ key, enabled: changes[key] }));
  const sales = catalog?.find(({ key }) => key === "sales");
  const cash = catalog?.find(({ key }) => key === "cash");
  const effective = (module) => changes[module.key] === undefined ? module.enabled : changes[module.key];
  const salesWithoutCashMenu = sales?.available && effective(sales) === true && cash?.available && effective(cash) === false;
  const updatePreference = (key, value) => {
    setChanges((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    if (!updates.length || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await client.put("/pos/modules", {
        ...(isSpecific ? { pos_location_id: posId } : {}),
        modules: updates,
      });
      setCatalog(readCatalog(response));
      setChanges({});
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, "No se pudieron guardar los módulos."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={mobile} aria-labelledby="pos-modules-title">
      <DialogTitle id="pos-modules-title" sx={{ bgcolor: "#1d2025", borderTop: "3px solid #ffc107", color: "#fff !important", fontWeight: 800, display: "flex", gap: 1.5, alignItems: "center" }}>
        <Box component="span" sx={posSectionIcon}><TuneRoundedIcon /></Box>
        {isSpecific ? `Módulos de ${pos.name || `POS #${posId}`}` : "Módulos generales del POS"}
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">{isSpecific
            ? "Este punto de venta hereda la configuración general. Puedes mostrar u ocultar cada módulo solo aquí."
            : "Esta configuración se aplica a los puntos de venta que heredan los valores generales."}</Typography>
          {salesWithoutCashMenu && <Alert severity="warning">Si el control de caja está activo, el POS seguirá exigiendo una caja abierta para vender aunque ocultes su opción del menú.</Alert>}
          {error && <Alert severity="error" action={!catalog && <Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>}>{error}</Alert>}
          {saved && <Alert severity="success">Módulos guardados. El menú del POS se actualiza al volver a consultarlo.</Alert>}
          {loading && <CircularProgress size={24} aria-label="Cargando catálogo" />}
          {!loading && catalog?.length === 0 && <Alert severity="info">El catálogo de módulos está vacío.</Alert>}
          {!loading && catalog && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
              {catalog.map((module) => {
                const { key, name, available, visible, source } = module;
                const pendingInheritance = changes[key] === null && source === "pos";
                const previewVisible = changes[key] === undefined || pendingInheritance ? visible : available && effective(module) === true;
                const checked = pendingInheritance ? module.enabled : effective(module);
                const toggle = (_, next) => updatePreference(key, isSpecific && source !== "pos" && next === module.enabled ? null : next);
                return (
                  <Paper key={key} elevation={0} sx={{ ...posMobileCard, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Stack spacing={0.75} alignItems="flex-start" minWidth={0}>
                        <Typography fontWeight={800}>{name}</Typography>
                        <Chip size="small" color={available && !pendingInheritance && previewVisible ? "success" : "default"} label={!available ? "No disponible" : pendingInheritance ? "Heredará al guardar" : previewVisible ? "Visible en el POS" : "Oculto en el POS"} />
                        {isSpecific && source === "pos" && !pendingInheritance && (
                          <Button size="small" disabled={saving} onClick={() => updatePreference(key, null)} sx={{ p: 0, minHeight: 32, textTransform: "none" }}
                            aria-label={`Heredar ${name} de la tienda`}>Volver a heredar</Button>
                        )}
                        {isSpecific && pendingInheritance && (
                          <Button size="small" disabled={saving} onClick={() => updatePreference(key, undefined)} sx={{ p: 0, minHeight: 32, textTransform: "none" }}>Deshacer</Button>
                        )}
                      </Stack>
                      <Switch
                        checked={available && checked === true}
                        disabled={!available || saving || pendingInheritance}
                        slotProps={{ input: { "aria-label": `Habilitar ${name}` } }}
                        onChange={toggle}
                      />
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, flexWrap: "wrap", justifyContent: "flex-end", gap: 1 }}>
        <Button disabled={saving} onClick={onClose} sx={{ minHeight: 44, textTransform: "none" }}>Cerrar</Button>
        <Button variant="contained" sx={posHeaderButton} startIcon={<SaveRoundedIcon />} disabled={saving || !updates.length} onClick={save}>
          {saving ? "Guardando…" : "Guardar módulos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
