// src/components/NotasInternas.jsx
import React, { useEffect, useMemo, useState, forwardRef } from "react";
import {
  Box, Stack, Button, Typography, TextField, InputAdornment, Paper,
  IconButton, CircularProgress, Grid, Divider, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, FormControlLabel, Checkbox, Chip, Switch, Grow, Zoom, Slide
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import FilterListIcon from "@mui/icons-material/FilterList";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

import axiosClient from "../config/axiosClientPOS";


// ==== Utils & constants ====
const ESTATUS = [
  { value: "pendiente", label: " 👀 Pendiente", color: "warning" },
  { value: "en_progreso", label: "⚙️ En progreso", color: "info" },
  { value: "completada", label: "✅ Completada", color: "success" },
  { value: "cancelada", label: "❌ Cancelada", color: "default" },
];

const STATUS_TABS = [
  { key: "todas", label: "Todas" },
  ...ESTATUS.map((e) => ({ key: e.value, label: e.label })),
];

const fmtHuman = (dt) => (dt ? new Date(dt).toLocaleString() : "");
const fmtLocal = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Animación “rebote” para la estrella
const bounce = keyframes`
  0% { transform: scale(1); }
  35% { transform: scale(1.25); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
`;

// Transición del modal
const TransitionUp = forwardRef(function TransitionUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Lee pos_location_id del localStorage si existe
const usePosLocationId = () =>
  useMemo(() => {
    const raw =
      localStorage.getItem("POS_LOCATION_ID") ||
      localStorage.getItem("POS_ID");
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, []);

// ==== Componente ====
export default function NotasInternas({ cambiarVista }) {
  const posLocationId = usePosLocationId();

  // Filtros
  const [statusFilter, setStatusFilter] = useState("todas");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [q, setQ] = useState("");

  // Data/UI
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // Crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    estatus: "pendiente",
    destacada: false,
    recordar_en_local: "",
  });

  // Borrar
  const [deletingId, setDeletingId] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Carga de notas
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (posLocationId) params.pos_location_id = posLocationId;
      if (statusFilter !== "todas") params.estatus = statusFilter;

      const { data } = await axiosClient.get("/notas", { params });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(list);
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.message || "No se pudieron cargar las notas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, posLocationId, statusFilter]);

  const visibleRows = useMemo(() => {
    let list = rows;
    if (onlyStarred) list = list.filter((r) => !!r.destacada);
    return list;
  }, [rows, onlyStarred]);

  // Abrir crear
  const onCreate = () => {
    setEditing(null);
    setForm({
      titulo: "",
      descripcion: "",
      estatus: "pendiente",
      destacada: false,
      recordar_en_local: "",
    });
    setOpenForm(true);
  };

  // Abrir editar (recarga por id)
  const onEdit = async (row) => {
    try {
      const params = {};
      if (posLocationId) params.pos_location_id = posLocationId;

      const { data } = await axiosClient.get(`/notas/${row.id}`, { params });
      setEditing(data);
      setForm({
        titulo: data.titulo || "",
        descripcion: data.descripcion || "",
        estatus: data.estatus || "pendiente",
        destacada: !!data.destacada,
        recordar_en_local: fmtLocal(data.recordar_en),
      });
      setOpenForm(true);
    } catch (e) {
      setError("No se pudo cargar la nota para editar.");
    }
  };

  // Guardar (crear/actualizar)
  const onSubmit = async () => {
    if (!form.descripcion.trim()) return setError("La descripción es obligatoria.");
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo || null,
        descripcion: form.descripcion,
        estatus: form.estatus,
        destacada: !!form.destacada,
        recordar_en: form.recordar_en_local ? new Date(form.recordar_en_local).toISOString() : null,
      };
      if (posLocationId) payload.pos_location_id = posLocationId;

      if (editing) {
        await axiosClient.put(`/notas/${editing.id}`, payload);
      } else {
        await axiosClient.post("/notas", payload);
      }

      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo guardar la nota.");
    } finally {
      setSaving(false);
    }
  };

  // Borrar
  const onDelete = (row) => setDeletingId(row.id);
  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeletingBusy(true);
    try {
      const params = {};
      if (posLocationId) params.pos_location_id = posLocationId;
      await axiosClient.delete(`/notas/${deletingId}`, { params });
      setDeletingId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la nota.");
    } finally {
      setDeletingBusy(false);
    }
  };
  const cancelDelete = () => setDeletingId(null);

  // Acciones rápidas
  const toggleDestacada = async (row) => {
    try {
      const body = { destacada: !row.destacada };
      if (posLocationId) body.pos_location_id = posLocationId;
      await axiosClient.put(`/notas/${row.id}`, body);
      await load();
    } catch {
      setError("No se pudo actualizar 'destacada'.");
    }
  };
  const changeEstatus = async (row, estatus) => {
    try {
      const body = { estatus };
      if (posLocationId) body.pos_location_id = posLocationId;
      await axiosClient.put(`/notas/${row.id}`, body);
      await load();
    } catch {
      setError("No se pudo cambiar el estatus.");
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      {/* Barra superior */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="success"
          startIcon={<DashboardIcon />}
          onClick={() => cambiarVista?.("menu")}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
        >
          Regresar al Panel
        </Button>
      </Box>

        {/* Header / Filtros */}
        <Paper
          elevation={0}
          sx={(t) => ({
            p: { xs: 2, sm: 3 },
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${t.palette.divider}`,
            background:
              t.palette.mode === "dark"
                ? alpha(t.palette.info.main, 0.10)
                : alpha(t.palette.info.main, 0.07),
          })}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <NoteAltIcon
                  sx={(t) => ({
                    fontSize: 32,
                    color: t.palette.mode === "dark" ? t.palette.info.light : t.palette.info.main,
                  })}
                />
                <Typography
                  component="h2"
                  sx={(t) => ({
                    m: 0,
                    fontWeight: 900,
                    letterSpacing: 0.2,
                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                    background:
                      t.palette.mode === "dark"
                        ? "linear-gradient(90deg, #e6eefc 0%, #9fd1ff 100%)"
                        : "linear-gradient(90deg, #111827 0%, #1f6feb 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  })}
                >
                  Notas internas
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1.2}
                justifyContent="flex-end"
                alignItems={{ xs: "stretch", lg: "center" }}
              >
                <TextField
                  size="small"
                  placeholder="Buscar nota (título o descripción)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: q ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setQ("")}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{ minWidth: { xs: "100%", sm: 280 } }}
                />

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <FilterListIcon sx={{ opacity: 0.7 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {STATUS_TABS.map((t) => (
                      <Chip
                        key={t.key}
                        label={t.label}
                        clickable
                        onClick={() => setStatusFilter(t.key)}
                        color={statusFilter === t.key ? "info" : "default"}
                        variant={statusFilter === t.key ? "filled" : "outlined"}
                        sx={{ height: 30, borderRadius: 2 }}
                      />
                    ))}
                  </Stack>
                  <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={onlyStarred}
                        onChange={(e) => setOnlyStarred(e.target.checked)}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PushPinOutlinedIcon fontSize="small" />
                        <span>Solo destacadas</span>
                      </Stack>
                    }
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Tooltip title="Recargar">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={load}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                      >
                        {loading ? "Cargando" : "Actualizar"}
                      </Button>
                    </span>
                  </Tooltip>

                  <Zoom in>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={onCreate}
                      sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                    >
                      Nueva nota
                    </Button>
                  </Zoom>
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 2 }} />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {visibleRows.length} resultado{visibleRows.length === 1 ? "" : "s"}
            </Typography>
          </Stack>
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Tickets */}
        <Stack spacing={1.6}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : visibleRows.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Typography color="text.secondary">No hay notas para mostrar.</Typography>
            </Paper>
          ) : (
            visibleRows.map((row, idx) => (
              <Grow in key={row.id} timeout={220 + idx * 40}>
                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${t.palette.divider}`,
                    background:
                      t.palette.mode === "dark"
                        ? alpha(t.palette.background.paper, 0.7)
                        : alpha("#f8fafc", 1),
                    transition: "transform .16s ease, box-shadow .2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow:
                        t.palette.mode === "dark"
                          ? "0 10px 30px rgba(0,0,0,.35)"
                          : "0 10px 30px rgba(31,111,235,.12)",
                    },
                  })}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.2}>
                    {/* left */}
                    <Stack spacing={0.6}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={900} sx={{ letterSpacing: 0.2 }}>
                          {row.titulo || "Sin título"}
                        </Typography>
                        {row.destacada && (
                          <Chip size="small" color="secondary" label="Destacada" />
                        )}
                      </Stack>

                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {row.descripcion}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          size="small"
                          label={ESTATUS.find((e) => e.value === row.estatus)?.label || row.estatus}
                          color={
                            row.estatus === "pendiente"
                              ? "warning"
                              : row.estatus === "en_progreso"
                              ? "info"
                              : row.estatus === "completada"
                              ? "success"
                              : "default"
                          }
                        />
                        {row.recordar_en && (
                          <Chip size="small" variant="outlined" label={`Recordatorio: ${fmtHuman(row.recordar_en)}`} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                           • {fmtHuman(row.created_at)}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* right */}
                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      <Tooltip title={row.destacada ? "Quitar destacada" : "Destacar"}>
                        <IconButton
                          onClick={() => toggleDestacada(row)}
                          sx={{
                            animation: row.destacada ? `${bounce} .35s ease` : "none",
                          }}
                        >
                          {row.destacada ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </Tooltip>

                      {/* <Tooltip title="Cambiar estatus"> */}
                        <Select
                          size="small"
                          value={row.estatus}
                          onChange={(e) => changeEstatus(row, e.target.value)}
                          sx={{ minWidth: 170 }}
                        >
                          {ESTATUS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      {/* </Tooltip> */}

                      <Tooltip title="Editar">
                        <IconButton onClick={() => onEdit(row)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => onDelete(row)} color="error">
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              </Grow>
            ))
          )}
        </Stack>

      {/* Modal crear/editar */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={TransitionUp}
        keepMounted
      >
        <DialogTitle>
          {editing ? "Editar ticket" : "Nuevo ticket"}
        </DialogTitle>
        <DialogContent
          dividers
          sx={(t) => ({
            background:
              t.palette.mode === "dark"
                ? alpha(t.palette.background.default, 0.6)
                : alpha("#f8fafc", 1),
          })}
        >
          <Stack spacing={2} mt={1}>
            <TextField
              label="Título (opcional)"
              value={form.titulo}
              onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
              inputProps={{ maxLength: 120 }}
              placeholder="Ej. Falta de stock en mostrador"
            />

            <TextField
              label="Descripción"
              multiline
              minRows={5}
              value={form.descripcion}
              onChange={(e) => setForm((s) => ({ ...s, descripcion: e.target.value }))}
              placeholder="Describe el problema o la tarea…"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  value={form.estatus}
                  onChange={(e) => setForm((s) => ({ ...s, estatus: e.target.value }))}
                >
                  {ESTATUS.map((op) => (
                    <MenuItem key={op.value} value={op.value}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recordar en"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.recordar_en_local}
                  onChange={(e) => setForm((s) => ({ ...s, recordar_en_local: e.target.value }))}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.destacada}
                  onChange={(e) => setForm((s) => ({ ...s, destacada: e.target.checked }))}
                />
              }
              label="Marcar como destacada"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear Nota"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de borrado */}
      {Boolean(deletingId) && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            p: 2,
          }}
        >
          <Paper sx={{ p: 3, borderRadius: 3, width: "100%", maxWidth: 420 }}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <DeleteOutlineIcon color="error" sx={{ fontSize: 32 }} />
              <Typography variant="h6">¿Eliminar este ticket?</Typography>
              <Typography variant="body2" color="text.secondary">
                Esta acción no se puede deshacer.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                <Button onClick={() => setDeletingId(null)} disabled={deletingBusy} sx={{ textTransform: "none" }}>
                  Cancelar
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={confirmDelete}
                  disabled={deletingBusy}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                >
                  {deletingBusy ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Eliminar"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
