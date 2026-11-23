import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import TelorecargoLogo from "../../components/TelorecargoLogo";
import { telorecargoStore } from "./service";
import { cents, decimal, entity, errorMessage, initialDates, money } from "./model";
import HistoryPanel from "./HistoryPanel";
import { ModuleHeader } from "./presentation";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";

export default function AdminTelorecargo() {
  const [tab, setTab] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [secret, setSecret] = useState("");
  const [commission, setCommission] = useState("0.00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [disconnect, setDisconnect] = useState(false);
  const [filters, setFilters] = useState(initialDates);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [reportVersion, setReportVersion] = useState(0);

  async function loadConfig() {
    setBusy(true); setError("");
    try { const value = entity(await telorecargoStore.config()); setMetadata(value); setCommission(String(value.comision ?? "0.00")); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  useEffect(() => { void loadConfig(); }, []);
  useEffect(() => {
    if (tab !== 1) return undefined;
    let alive = true; setReport(null); setReportError("");
    const { status, ...params } = filters;
    telorecargoStore.report(Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ""))).then((data) => { if (alive) setReport(entity(data)); }).catch((err) => { if (alive) setReportError(errorMessage(err)); });
    return () => { alive = false; };
  }, [tab, filters, reportVersion]);

  async function saveCredential(event) {
    event.preventDefault(); const value = secret.trim(); setSecret(""); setBusy(true); setError(""); setMessage("");
    try { const config = entity(await telorecargoStore.credential(value)); setMetadata(config); setCommission(String(config.comision ?? commission)); setMessage("Clave guardada. La validez se comprobará al consultar Telorecargo desde el POS."); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function saveCommission(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const amount = cents(commission); if (amount > 999999) throw new Error("La comisión máxima es $9,999.99.");
      setBusy(true); const value = entity(await telorecargoStore.commission(decimal(amount)));
      setCommission(String(value.comision)); setMetadata((current) => ({ ...current, comision: value.comision })); setMessage("Comisión actualizada. Las ventas anteriores conservan sus importes.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function disconnectNow() {
    setBusy(true); setError(""); setMessage("");
    try { await telorecargoStore.disconnect(); setMetadata({ configured: false, comision: "0.00" }); setCommission("0.00"); setDisconnect(false); setMessage("Integración desconectada localmente. La clave no fue revocada en Telorecargo."); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <Box className="trc-module trc-module--admin"><Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}><Stack spacing={3}>
    <ModuleHeader mode="admin" title="Telorecargo" description="Conecta tu tienda, define tu comisión y supervisa las recargas de todos tus puntos de venta." icon={TelorecargoLogo} status={metadata?.configured ? "Integración configurada" : "Pendiente de configurar"} statusColor={metadata?.configured ? "success" : "warning"} />
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable"><Tab icon={<SettingsOutlinedIcon fontSize="small" />} iconPosition="start" label="Configuración" /><Tab icon={<BarChartOutlinedIcon fontSize="small" />} iconPosition="start" label="Operaciones y reporte" /></Tabs>
    {tab === 0 && <>
      {error && <Alert severity="error">{error}</Alert>}{message && <Alert severity="success">{message}</Alert>}
      {error.includes("La sesión venció") && <Button component="a" href="/login-register">Iniciar sesión de tienda</Button>}
      <Box className="trc-admin-config">
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack spacing={2}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><VpnKeyOutlinedIcon color="primary" /><Typography variant="h6" fontWeight={800}>Conexión con Telorecargo</Typography><Chip label={metadata ? metadata.configured ? "Clave configurada" : "Sin configurar" : "Sin consultar"} color={metadata?.configured ? "success" : "default"} size="small" /></Stack>
        <Typography variant="body2">La tienda administra la clave de integración mtelmx. Las recargas y solicitudes de saldo se realizan desde la sesión de cada POS.</Typography>
        <Alert severity="info">Tener una clave guardada no garantiza que sea válida en el proveedor. El saldo es compartido por toda la cuenta de la tienda.</Alert>
        <Box component="form" onSubmit={saveCredential}><Stack direction={{ xs: "column", sm: "row" }} gap={2}><TextField fullWidth required type="password" autoComplete="new-password" label="Clave externa mtelmx" value={secret} onChange={(event) => setSecret(event.target.value)} disabled={busy} helperText="El campo permanece vacío después de enviarlo. La clave guardada nunca se muestra." /><Button type="submit" variant="contained" disabled={busy || !secret.trim()} sx={{ flexShrink: 0, alignSelf: { sm: "flex-start" }, minHeight: 56 }}>{metadata?.configured ? "Reemplazar clave" : "Guardar clave"}</Button></Stack></Box>
        <Stack direction="row" gap={1} flexWrap="wrap"><Button disabled={busy} onClick={loadConfig}>Actualizar estado</Button><Button color="error" disabled={busy || !metadata?.configured} onClick={() => setDisconnect(true)}>Desconectar</Button></Stack>
      </Stack></Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack spacing={2}><Stack direction="row" alignItems="center" gap={1.5}><CurrencyExchangeRoundedIcon color="primary" /><Typography variant="h6" fontWeight={800}>Comisión fija por recarga</Typography></Stack><Typography variant="body2">Importe adicional en MXN que se cobra al cliente. El cajero no puede cambiarlo. Se registra por separado de la recarga.</Typography><Box component="form" onSubmit={saveCommission}><Stack direction={{ xs: "column", sm: "row" }} gap={2}><TextField required label="Comisión (MXN)" value={commission} onChange={(event) => setCommission(event.target.value)} inputProps={{ inputMode: "decimal", pattern: "[0-9]+([.][0-9]{1,2})?" }} disabled={busy || !metadata?.configured} /><Button type="submit" variant="outlined" disabled={busy || !metadata?.configured}>Guardar comisión</Button></Stack></Box></Stack></Paper>
      </Box>
    </>}
    {tab === 1 && <>
      <HistoryPanel mode="store" onFiltersChange={setFilters} />
      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between"><Typography variant="h5" fontWeight={800}>Reporte de recargas confirmadas</Typography><Button onClick={() => setReportVersion((value) => value + 1)}>Actualizar reporte</Button></Stack>
      <Typography variant="body2" color="text.secondary">Comparte el periodo y los filtros de POS, sucursal y trabajador aplicados al historial. El estado del historial no modifica estos totales. La comisión se muestra separada; no representa utilidad neta.</Typography>
      {reportError && <Alert severity="error">{reportError}</Alert>}
      {!report && !reportError && <Typography role="status">Consultando reporte…</Typography>}
      {report && <><Grid container spacing={2}>{[["Recargas", report.totales?.recargas ?? 0], ["Importe recargado", money(report.totales?.importe_recargado)], ["Comisiones", money(report.totales?.comisiones)], ["Total cobrado", money(report.totales?.cobrado)]].map(([label, value]) => <Grid item xs={6} md={3} key={label}><Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h6" fontWeight={850}>{value}</Typography></Paper></Grid>)}</Grid>
        <Alert severity={report.pendientes?.operaciones ? "warning" : "info"}>{report.pendientes?.operaciones || 0} operaciones pendientes · Cobros por conciliar: {money(report.pendientes?.cobros_por_conciliar)}. Las solicitudes de saldo no son ventas.</Alert>
        <Typography variant="h6">Por POS y vendedor</Typography><Grid container spacing={2}>{(report.por_pos_vendedor || []).map((row, index) => <Grid item xs={12} md={6} key={index}><Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}><Typography fontWeight={800}>{row.pos_name || `POS ${row.pos_location_id}`} · {row.worker_name || "Sin vendedor"}</Typography><Typography>{row.recargas} recargas · Recargado: {money(row.importe_recargado)}</Typography><Typography>Comisión: {money(row.comisiones)} · Cobrado: {money(row.cobrado)}</Typography></Paper></Grid>)}</Grid>
        <Typography variant="h6">Por medio de pago</Typography><Stack direction="row" gap={1} flexWrap="wrap">{(report.por_medio_pago || []).map((row) => <Chip key={row.method} label={`${({ efectivo: "Efectivo", td: "Débito", tc: "Crédito", transferencia: "Transferencia" })[row.method] || row.method}: ${money(row.amount)}`} />)}</Stack>
      </>}
    </>}
    <Dialog open={disconnect} onClose={busy ? undefined : () => setDisconnect(false)}><DialogTitle>Desconectar Telorecargo</DialogTitle><DialogContent>Se eliminará la configuración local. No revoca la clave en el proveedor. Si vuelves a conectarla, la comisión comenzará en $0.00.</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDisconnect(false)}>Cancelar</Button><Button disabled={busy} color="error" onClick={disconnectNow}>Desconectar integración</Button></DialogActions></Dialog>
  </Stack></Container></Box>;
}
