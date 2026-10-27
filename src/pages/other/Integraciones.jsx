import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, TextField, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, GlobalStyles, Tabs, Tab,
} from "@mui/material";
import { FiArrowLeft, FiHelpCircle, FiCopy, FiEye, FiEyeOff, FiKey, FiPlus, FiRefreshCw, FiShield, FiTrash2 } from "react-icons/fi";
import axios from "../../axiosConfig";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import Swal from "sweetalert2";

const requestConfig = { headers: { Accept: "application/json" } };
const systemStyles = {
  mtelmx: { name: "MiTiendaEnLineaMx", color: "#7c3aed", background: "#f3edff", initials: "MT" },
  taeconta: { name: "TAEConta", color: "#0077d9", background: "#e9f5ff", initials: "TC" },
  clicmenu: { name: "ClicMenu", color: "#c65c0a", background: "#fff2e4", initials: "CM" },
};
const systemStyle = (slug, name) => systemStyles[slug] || { name: name || slug, color: "#475569", background: "#f1f5f9", initials: "API" };
const cardStyle = { borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(15,23,42,.04)", overflow: "hidden", minWidth: 0 };
const buttonStyle = { borderRadius: 2.5, textTransform: "none", fontWeight: 700, py: 1.25, boxShadow: "none" };

function SystemLabel({ slug, name }) {
  const style = systemStyle(slug, name);
  return <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
    <Avatar variant="rounded" sx={{ width: 34, height: 34, bgcolor: style.background, color: style.color, fontSize: 12, fontWeight: 800, borderRadius: 2 }}>{style.initials}</Avatar>
    <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: style.color, overflowWrap: "anywhere" }}>{style.name}</Typography>
  </Stack>;
}
const dateLabel = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleString("es-MX");
};

// El listado se conserva separado de las claves, que sólo viven en esta vista.
const metadata = ({ token, ...value }) => value;
const tokenPath = slug => `/integraciones/tokens/${encodeURIComponent(slug)}`;

export function PanelIntegraciones() {
  const [systems, setSystems] = useState([]);
  const [tokens, setTokens] = useState({});
  const [keys, setKeys] = useState({});
  const [visible, setVisible] = useState({});
  const [system, setSystem] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(false);

  const forgetKey = slug => {
    setKeys(previous => { const next = { ...previous }; delete next[slug]; return next; });
    setVisible(previous => ({ ...previous, [slug]: false }));
  };
  const removeToken = slug => {
    setTokens(previous => { const next = { ...previous }; delete next[slug]; return next; });
    forgetKey(slug);
  };
  const applyToken = value => {
    setTokens(previous => ({ ...previous, [value.sistema]: metadata(value) }));
    setKeys(previous => ({ ...previous, [value.sistema]: value.token }));
    setVisible(previous => ({ ...previous, [value.sistema]: false }));
  };
  const showError = failure => {
    const status = failure.response?.status;
    if (status === 401) return; // El interceptor existente gestiona la sesión vencida.
    if (status === 429) setError("Demasiadas solicitudes. Espera un momento antes de volver a intentarlo.");
    else if (status === 422) {
      const messages = Object.values(failure.response?.data?.errors || {}).flat();
      setError(messages.length ? messages.join(" ") : failure.response?.data?.message || "Revisa el sistema seleccionado.");
    } else setError("No se pudo completar la solicitud. Inténtalo nuevamente.");
  };
  const applyList = list => {
    const next = Object.fromEntries(list.map(value => [value.sistema, metadata(value)]));
    setTokens(next);
    setKeys(previous => Object.fromEntries(Object.entries(previous).filter(([slug]) => next[slug])));
    setVisible(previous => Object.fromEntries(Object.entries(previous).filter(([slug]) => next[slug])));
  };
  const load = async signal => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setReady(false);
    setError("");
    try {
      const [available, current] = await Promise.all([
        axios.get("/integraciones/sistemas", { ...requestConfig, signal }),
        axios.get("/integraciones/tokens", { ...requestConfig, signal }),
      ]);
      if (!mounted.current || signal?.aborted) return;
      setSystems(available.data.data);
      applyList(current.data.data);
      setReady(true);
    } catch (failure) {
      if (mounted.current && !signal?.aborted) showError(failure);
    } finally {
      if (mounted.current && !signal?.aborted) { locked.current = false; setBusy(false); }
    }
  };
  useEffect(() => {
    mounted.current = true;
    locked.current = false;
    const controller = new AbortController();
    load(controller.signal);
    return () => { mounted.current = false; controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (action, slug) => {
    if (locked.current || !ready || !systems.some(item => item.slug === slug)) return;
    if (action === "show" && visible[slug]) {
      setVisible(previous => ({ ...previous, [slug]: false }));
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const name = systemStyle(slug).name;
    try {
      if (action === "delete" || action === "regenerate") {
        const confirmation = await Swal.fire({
          icon: "warning",
          title: action === "delete" ? `Eliminar token de ${name}` : `Regenerar token de ${name}`,
          text: action === "delete"
            ? `Se eliminará sólo el token de ${name}. Su clave dejará de funcionar. Los otros sistemas conservarán sus tokens.`
            : `La clave anterior de ${name} dejará de funcionar. Actualiza la clave en el servidor de esa integración. Los otros tokens no cambiarán.`,
          showCancelButton: true,
          confirmButtonText: action === "delete" ? "Sí, eliminar token" : "Sí, regenerar token",
          cancelButtonText: "Cancelar",
          confirmButtonColor: action === "delete" ? "#dc2626" : "#2563eb",
          focusCancel: true,
        });
        if (!confirmation.isConfirmed || !mounted.current) return;
      }
      if (action === "delete") {
        await axios.delete(tokenPath(slug), requestConfig);
        if (mounted.current) { removeToken(slug); setNotice(`Token de ${name} eliminado.`); }
      } else if (action === "create" || action === "regenerate") {
        const response = action === "create"
          ? await axios.post("/integraciones/tokens", { sistema: slug }, requestConfig)
          : await axios.patch(tokenPath(slug), {}, requestConfig);
        if (mounted.current) {
          applyToken(response.data.data);
          setNotice(action === "create" ? `Token de ${name} creado.` : `Token de ${name} regenerado. La clave anterior ya no funciona.`);
        }
      } else {
        // El listado no incluye claves: consultar detalle al mostrar o copiar.
        const response = await axios.get(tokenPath(slug), requestConfig);
        if (!mounted.current) return;
        const value = response.data.data;
        applyToken(value);
        if (action === "show") setVisible(previous => ({ ...previous, [slug]: true }));
        else {
          try {
            await navigator.clipboard.writeText(value.token);
            if (mounted.current) setNotice(`Token de ${name} copiado.`);
          } catch {
            if (mounted.current) setError("No se pudo copiar. Muestra la clave y cópiala manualmente.");
          }
        }
      }
    } catch (failure) {
      if (!mounted.current) return;
      const status = failure.response?.status;
      if (status === 404 && action !== "create") {
        removeToken(slug);
        setNotice(`${name} no tiene token. Puedes crear uno nuevo.`);
      } else if (status === 409 && action === "create") {
        forgetKey(slug);
        try {
          const response = await axios.get("/integraciones/tokens", requestConfig);
          if (mounted.current) { applyList(response.data.data); setNotice(`Se actualizó el listado. ${name} ya tiene un token.`); }
        } catch (refreshFailure) {
          if (mounted.current) { setReady(false); showError(refreshFailure); }
        }
      } else showError(failure);
    } finally {
      if (mounted.current) { locked.current = false; setBusy(false); }
    }
  };

  const openOptions = slug => {
    setError("");
    setNotice("");
    setVisible(previous => ({ ...previous, [slug]: false }));
    setSelected(slug);
  };
  const token = selected ? tokens[selected] : null;
  const activeCount = Object.keys(tokens).length;
  const availableSystems = systems.filter(item => !tokens[item.slug]);
  const statusChip = value => <Chip size="small" label={value ? "Sin vencimiento" : "Sin token"} sx={{ bgcolor: value ? "#e7f6ef" : "#f1f5f9", color: value ? "#16734a" : "#64748b", fontWeight: 700 }} />;

  return (
    <LayoutOne headerTop="visible">
      {/* Incluye la alerta de sesión vencida del interceptor sobre el modal. */}
      <GlobalStyles styles={{ ".swal2-container": { zIndex: "2000 !important" } }} />
      <SEO titleTemplate="Tokens" />
      <Breadcrumb pages={[{ label: "Ventas", path: "/ventas" }, { label: "Tokens", path: "/tokens" }]} />
      <Box sx={{ py: { xs: 3, md: 5 }, background: "radial-gradient(ellipse at top left, #eaf3ff, transparent 55%), #f7f9fc", minHeight: "70vh" }}>
        <Container maxWidth="xl">
          <Button component={Link} to="/ventas" variant="contained" startIcon={<FiArrowLeft />} sx={{ ...buttonStyle, mb: 3, px: 3, bgcolor: "#0f172a", color: "#fff", width: { xs: "100%", sm: "auto" }, "&:hover": { bgcolor: "#1e293b" } }}>Volver a Ventas</Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ width: 54, height: 54, borderRadius: 3, background: "linear-gradient(135deg, #00a8ff, #0056b3)" }}><FiKey size={26} /></Avatar>
              <Box><Typography component="h1" sx={{ fontSize: { xs: 24, md: 34 }, fontWeight: 850, letterSpacing: "-.04em", color: "#0f172a" }}>Tokens</Typography><Typography color="text.secondary" variant="body2">Un token por sistema, una sola cuenta.</Typography></Box>
            </Stack>
            <Stack spacing={1.5} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
              <Button variant="outlined" startIcon={<FiHelpCircle />} onClick={() => setHelpOpen(true)} sx={buttonStyle}>¿Cómo funciona?</Button>
              <Chip icon={<FiShield />} label={`${activeCount} tokens · Sin vencimiento`} sx={{ bgcolor: "#e9f5ff", color: "#0066b3", fontWeight: 700, "& .MuiChip-icon": { color: "inherit" } }} />
            </Stack>
          </Stack>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {!selected && error && <Alert severity="error">{error}</Alert>}
            {!selected && notice && <Alert severity="success">{notice}</Alert>}
            {busy && <Stack direction="row" spacing={1.5} alignItems="center" role="status"><CircularProgress size={20} /><Typography color="text.secondary">Procesando solicitud…</Typography></Stack>}
            {!ready && !busy && <Button variant="outlined" onClick={() => load()}>Reintentar carga</Button>}
          </Stack>
          <Box aria-busy={busy} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(300px, 350px) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
            <Paper elevation={0} sx={cardStyle}>
              <Box sx={{ p: 3, background: "linear-gradient(120deg, #fff, #f1f6ff)", borderBottom: "1px solid #edf1f7" }}>
                <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 800, letterSpacing: 1.5 }}>NUEVO TOKEN</Typography>
                <Typography component="h2" variant="h6" fontWeight={800}>Crea un token</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Cada sistema tiene su propia clave. Todos comparten el saldo y el historial de tu cuenta.</Typography>
              </Box>
              <Stack spacing={2.5} sx={{ p: 3 }}>
                <TextField select label="Sistema" value={availableSystems.some(item => item.slug === system) ? system : ""} disabled={busy || !ready || !availableSystems.length} onChange={event => setSystem(event.target.value)} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 }, "& .MuiSelect-select": { minHeight: "34px !important", display: "flex", alignItems: "center" } }} helperText={ready && !availableSystems.length ? "Todos los sistemas disponibles ya tienen un token." : "Selecciona el sistema que quieres conectar."}>
                  {availableSystems.map(item => <MenuItem key={item.slug} value={item.slug} sx={{ py: 1.5 }}><SystemLabel slug={item.slug} name={item.name} /></MenuItem>)}
                </TextField>
                <Button variant="contained" startIcon={<FiPlus />} sx={{ ...buttonStyle, background: "linear-gradient(100deg, #00a8ff, #0056b3)" }} disabled={busy || !ready || !availableSystems.some(item => item.slug === system)} onClick={() => run("create", system)}>Crear token</Button>
                <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3, p: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}><FiShield color="#2563eb" /><Typography variant="body2" fontWeight={800}>Protege tus claves</Typography></Stack>
                  <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.7 }}>Guarda este token en el servidor de tu integración. No lo incluyas en código público del navegador.</Typography>
                </Box>
              </Stack>
            </Paper>
            <Paper elevation={0} sx={cardStyle}>
              <Box sx={{ p: 3, borderBottom: "1px solid #edf1f7" }}><Typography component="h2" variant="h6" fontWeight={800}>Tokens por sistema</Typography><Typography variant="body2" color="text.secondary">Abre las opciones para consultar o administrar cada clave.</Typography></Box>
              {ready && <>
                <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                  <Table aria-label="Tokens por sistema" sx={{ "& th": { bgcolor: "#f8fafc", color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }, "& td": { py: 2.5, fontSize: 13, borderColor: "#edf1f7" } }}>
                    <TableHead><TableRow><TableCell>Sistema</TableCell><TableCell>Estado</TableCell><TableCell>Creación / Último uso</TableCell><TableCell align="right">Opciones</TableCell></TableRow></TableHead>
                    <TableBody>{systems.map(item => {
                      const current = tokens[item.slug];
                      return <TableRow key={item.slug} sx={{ transition: "background-color .2s, box-shadow .2s", "&:hover": { bgcolor: systemStyle(item.slug).background, boxShadow: `inset 4px 0 ${systemStyle(item.slug).color}` } }}>
                        <TableCell><SystemLabel slug={item.slug} name={item.name} /></TableCell><TableCell>{statusChip(current)}</TableCell>
                        <TableCell>{current ? <><Typography variant="body2">{dateLabel(current.created_at, "Fecha no disponible")}</Typography><Typography variant="caption" color="text.secondary">{dateLabel(current.last_used_at, "Sin uso registrado")}</Typography></> : "Aún sin conexión"}</TableCell>
                        <TableCell align="right"><Button variant="outlined" disabled={busy} sx={{ ...buttonStyle, whiteSpace: "nowrap" }} onClick={() => openOptions(item.slug)}>{current ? "Opciones" : "Crear token"}</Button></TableCell>
                      </TableRow>;
                    })}</TableBody>
                  </Table>
                </TableContainer>
                <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" }, p: 2 }}>{systems.map(item => {
                  const current = tokens[item.slug];
                  return <Paper key={item.slug} variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderTop: `3px solid ${systemStyle(item.slug).color}`, transition: "box-shadow .2s", "&:hover": { boxShadow: "0 8px 20px #0f172a10" } }}>
                    <Stack spacing={2}>
                      <SystemLabel slug={item.slug} name={item.name} /><Box>{statusChip(current)}</Box>
                      {current && <Box><Typography variant="body2">Creado: {dateLabel(current.created_at, "Fecha no disponible")}</Typography><Typography variant="body2" color="text.secondary">Último uso: {dateLabel(current.last_used_at, "Sin uso registrado")}</Typography></Box>}
                      <Button fullWidth variant="outlined" disabled={busy} sx={buttonStyle} onClick={() => openOptions(item.slug)}>{current ? "Opciones" : "Crear token"}</Button>
                    </Stack>
                  </Paper>;
                })}</Stack>
                {!systems.length && <Typography sx={{ p: 4 }} color="text.secondary">No hay sistemas disponibles.</Typography>}
              </>}
            </Paper>
          </Box>
        </Container>
      </Box>
      <Dialog open={Boolean(selected)} onClose={() => !busy && setSelected(null)} disableEnforceFocus maxWidth="sm" fullWidth aria-labelledby="token-options-title" PaperProps={{ sx: { borderRadius: 4, m: { xs: 1.5, sm: 4 }, width: "100%" } }}>
        <DialogTitle id="token-options-title"><Stack spacing={1}><Typography component="span" fontWeight={800}>Opciones del token</Typography>{selected && <SystemLabel slug={selected} />}</Stack></DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} aria-busy={busy}>
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            {busy && <Stack direction="row" spacing={1} alignItems="center" role="status"><CircularProgress size={18} /><Typography variant="body2">Procesando solicitud…</Typography></Stack>}
            {token ? <>
              <Box>{statusChip(token)}</Box>
              <Box><Typography variant="body2">Creado: {dateLabel(token.created_at, "Fecha no disponible")}</Typography><Typography variant="body2" color="text.secondary">Último uso: {dateLabel(token.last_used_at, "Sin uso registrado")}</Typography></Box>
              <TextField label="Token externo" value={visible[selected] ? keys[selected] || "" : "••••••••••••••••••••••••"} fullWidth InputProps={{ readOnly: true }} inputProps={{ style: { fontFamily: "monospace", fontSize: 14 } }} />
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="outlined" startIcon={visible[selected] ? <FiEyeOff /> : <FiEye />} disabled={busy || !ready} sx={buttonStyle} onClick={() => run("show", selected)}>{visible[selected] ? "Ocultar" : "Mostrar"}</Button>
                <Button fullWidth variant="outlined" startIcon={<FiCopy />} disabled={busy || !ready} sx={buttonStyle} onClick={() => run("copy", selected)}>Copiar</Button>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button fullWidth variant="outlined" startIcon={<FiRefreshCw />} disabled={busy || !ready} sx={buttonStyle} onClick={() => run("regenerate", selected)}>Regenerar token</Button>
                <Button fullWidth color="error" variant="outlined" startIcon={<FiTrash2 />} disabled={busy || !ready} sx={buttonStyle} onClick={() => run("delete", selected)}>Eliminar token</Button>
              </Stack>
            </> : <>
              <Avatar sx={{ bgcolor: selected ? systemStyle(selected).background : "#f1f5f9", color: selected ? systemStyle(selected).color : "inherit" }}><FiKey /></Avatar>
              <Typography>Este sistema aún no tiene token. Créalo para conectar su integración sin afectar los demás sistemas.</Typography>
              <Button variant="contained" startIcon={<FiPlus />} disabled={busy || !ready} sx={buttonStyle} onClick={() => run("create", selected)}>Crear token</Button>
            </>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button disabled={busy} sx={buttonStyle} onClick={() => { if (selected) setVisible(previous => ({ ...previous, [selected]: false })); setSelected(null); }}>Cerrar</Button></DialogActions>
      </Dialog>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth aria-labelledby="token-help-title" PaperProps={{ sx: { borderRadius: 4, m: { xs: 1.5, sm: 4 } } }}>
        <DialogTitle id="token-help-title">¿Cómo funcionan tus tokens?</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Un token es una clave para conectar tu cuenta con otro sistema. Aquí sólo creas y administras esas claves.</Typography>
          <Tabs value={helpTab} onChange={(_, value) => setHelpTab(value)} variant="fullWidth" aria-label="Guía de tokens" sx={{ mb: 3, "& .MuiTab-root": { minWidth: 0, px: 0.5, fontSize: { xs: 12, sm: 14 } } }}>
            {["Crear", "Usar", "Administrar"].map((label, index) => <Tab key={label} label={label} id={`token-help-tab-${index}`} aria-controls={`token-help-panel-${index}`} />)}
          </Tabs>
          <Box role="tabpanel" id={`token-help-panel-${helpTab}`} aria-labelledby={`token-help-tab-${helpTab}`}>
            {helpTab === 0 && <Stack spacing={2}>
              <Typography variant="h6" component="h3">Elige el sistema que quieres conectar</Typography>
              <Typography>Selecciona ClicMenu, MiTiendaEnLineaMx o TAEConta y pulsa <strong>Crear token</strong>.</Typography>
              <Typography>Puedes tener una clave para cada sistema. Si ya existe una, abre <strong>Opciones</strong> en su tarjeta o fila.</Typography>
            </Stack>}
            {helpTab === 1 && <Stack spacing={2}>
              <Typography variant="h6" component="h3">Copia la clave al otro sistema</Typography>
              <Typography>Abre <strong>Opciones</strong> y pulsa <strong>Copiar</strong>. Pega el token únicamente en la configuración privada del sistema elegido. También puedes usar <strong>Mostrar / Ocultar</strong> para revisarlo.</Typography>
              <Alert severity="info">Los sistemas conectados usan el mismo saldo de tu cuenta y sus operaciones aparecen en tu historial.</Alert>
              <Typography>No publiques tu token ni compartas capturas que lo muestren. No necesitas entregar tu contraseña.</Typography>
            </Stack>}
            {helpTab === 2 && <Stack spacing={2}>
              <Typography variant="h6" component="h3">Conserva el control de cada clave</Typography>
              <Typography><strong>Regenerar:</strong> crea una clave nueva y deja de funcionar la anterior de ese sistema. Actualízala también en el sistema donde la pegaste.</Typography>
              <Typography><strong>Eliminar:</strong> desconecta sólo ese sistema. No elimina tu cuenta ni los tokens de los demás.</Typography>
              <Typography><strong>Sin vencimiento:</strong> tu token funciona hasta que lo regeneres o elimines. La fecha de último uso indica cuándo se utilizó; si aún no hay actividad, verás “Sin uso registrado”.</Typography>
            </Stack>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button variant="contained" onClick={() => setHelpOpen(false)}>Entendido</Button></DialogActions>
      </Dialog>
    </LayoutOne>
  );
}

export default function Integraciones() {
  const { sessionLoaded, isAuthenticated, user } = useSelector(state => state.user);
  if (!sessionLoaded) return null;
  if (!isAuthenticated) return <Navigate to="/iniciar-sesion" replace />;
  return <PanelIntegraciones key={user?.id} />;
}

