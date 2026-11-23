import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, FormControlLabel, InputAdornment, MenuItem, Pagination, Stack, Switch, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { resourceService } from "../../services/admin/resourceService";
import { alertFromAxiosError, showConfirm, showSuccess } from "../../utils/alerts";
import ResourceList, { RESOURCE_TYPES } from "../../components/resources/ResourceList";
import ResourceFormDialog from "../../components/resources/ResourceFormDialog";
import ResourceDetailsDialog from "../../components/resources/ResourceDetailsDialog";

export default function ResourceListPage() {
  const navigate = useNavigate(); const location = useLocation(); const [params, setParams] = useSearchParams();
  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();
  const branchFromNav = location.state?.branch;
  const branchId = Number(branchFromNav?.id || selectedBranch?.id || params.get("branch_id") || 0);
  const branch = branchFromNav || selectedBranch || (branchId ? { id: branchId } : null);
  const page = Number(params.get("page") || 1);
  const [search, setSearch] = useState(params.get("search") || ""); const [type, setType] = useState(params.get("type") || "");
  const [activeOnly, setActiveOnly] = useState(params.get("is_active") !== "all");
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [formResource, setFormResource] = useState(undefined); const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false); const [apiErrors, setApiErrors] = useState({});
  const [detail, setDetail] = useState(null); const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { setHideLayout(false); if (branchFromNav?.id) setSelectedBranch(branchFromNav); }, [branchFromNav, setHideLayout, setSelectedBranch]);
  useEffect(() => { if (!branchId) navigate("/admin/sucursales", { replace: true }); }, [branchId, navigate]);

  const load = useCallback(async () => {
    if (!branchId) return; setLoading(true); setError("");
    try {
      const { data } = await resourceService.list(branchId, { page, search: search.trim() || undefined, type: type || undefined, is_active: activeOnly ? 1 : undefined });
      const paginated = data?.resources || {}; setRows(Array.isArray(paginated.data) ? paginated.data : []); setMeta(paginated);
    } catch (err) { setError(err?.response?.data?.message || "No se pudieron cargar los recursos."); setRows([]); }
    finally { setLoading(false); }
  }, [activeOnly, branchId, page, search, type]);
  useEffect(() => { const timer = setTimeout(load, 300); return () => clearTimeout(timer); }, [load]);

  const setQuery = (key, value) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (key !== "page") next.delete("page"); if (branchId) next.set("branch_id", String(branchId)); setParams(next); };
  const openForm = (resource) => { setApiErrors({}); setFormResource(resource); setFormOpen(true); };
  const closeForm = () => { if (!saving) { setFormOpen(false); setFormResource(undefined); setApiErrors({}); } };
  const save = async (values) => {
    setSaving(true); setApiErrors({});
    try {
      const { data } = formResource ? await resourceService.update(branchId, formResource.id, values) : await resourceService.create(branchId, values);
      await showSuccess(data?.message || "Recurso guardado correctamente."); setFormOpen(false); setFormResource(undefined); await load();
    } catch (err) { const errors = err?.response?.data?.errors; if (errors) setApiErrors(errors); else setApiErrors({ general: err?.response?.data?.message || "No se pudo guardar el recurso." }); }
    finally { setSaving(false); }
  };
  const view = async (resource) => { setDetail(resource); setDetailLoading(true); try { const { data } = await resourceService.get(branchId, resource.id); setDetail(data?.resource || resource); } catch (err) { alertFromAxiosError(err, "No se pudo cargar el recurso"); setDetail(null); } finally { setDetailLoading(false); } };
  const remove = async (resource) => { if (!await showConfirm(`¿Desactivar “${resource.name}”? También se desactivarán sus asociaciones con servicios.`, "Sí, desactivar")) return; try { const { data } = await resourceService.remove(branchId, resource.id); await showSuccess(data?.message || "Recurso desactivado."); await load(); } catch (err) { alertFromAxiosError(err, "No se pudo desactivar el recurso"); } };

  return <Box sx={{ maxWidth: 1400, mx: "auto", bgcolor: "#fff" }}><Card elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff", color: "#000", border: "1px solid rgba(0,0,0,.08)", "& .MuiTypography-root": { color: "#000" }, "& .MuiButton-outlined": { color: "#000", borderColor: "rgba(0,0,0,.18)", bgcolor: "#fff" } }}>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={3}><Box><Typography variant="h4" fontWeight={900}>Recursos de servicios</Typography><Typography color="text.secondary">Sucursal: {branch?.name || `#${branchId}`}</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignSelf={{ md: "center" }}><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => openForm()} sx={{ color: "#000", borderColor: "rgba(0,0,0,.18)", fontWeight: 900 }}>Crear recurso</Button><Button variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(`/admin/services?branch_id=${branchId}`, { state: { branch } })} sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: 900, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#1565c0" } }}>Volver a servicios</Button></Stack></Stack>
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} mb={2} alignItems={{ md: "center" }}><TextField value={search} onChange={(e) => { setSearch(e.target.value); setQuery("search", e.target.value); }} label="Buscar nombre, código o descripción" size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} sx={{ bgcolor: "#fff", borderRadius: 1 }} /><TextField select label="Tipo" value={type} onChange={(e) => { setType(e.target.value); setQuery("type", e.target.value); }} size="small" sx={{ minWidth: { md: 220 }, bgcolor: "#fff", borderRadius: 1 }}><MenuItem value="">Todos</MenuItem>{RESOURCE_TYPES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><FormControlLabel sx={{ minWidth: 150 }} control={<Switch checked={activeOnly} color="warning" onChange={(e) => { setActiveOnly(e.target.checked); setQuery("is_active", e.target.checked ? "" : "all"); }} />} label="Solo activos" /></Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error} <Button onClick={load}>Reintentar</Button></Alert>}
    {loading ? <Stack alignItems="center" py={8}><CircularProgress color="warning" /></Stack> : rows.length ? <ResourceList resources={rows} onView={view} onEdit={openForm} onDelete={remove} /> : <Stack alignItems="center" py={8} spacing={2}><Typography variant="h6">No se encontraron recursos.</Typography><Button variant="contained" onClick={() => openForm()}>Crear recurso</Button></Stack>}
    {Number(meta.last_page) > 1 && <Stack alignItems="center" mt={3}><Pagination page={Number(meta.current_page || page)} count={Number(meta.last_page)} onChange={(_, value) => setQuery("page", String(value))} color="primary" sx={{ "& .MuiPaginationItem-root": { color: "#fff" } }} /></Stack>}
  </Card><ResourceFormDialog open={formOpen} resource={formResource} saving={saving} apiErrors={apiErrors} onClose={closeForm} onSubmit={save} /><ResourceDetailsDialog open={!!detail} resource={detail} loading={detailLoading} onClose={() => setDetail(null)} onEdit={(resource) => { setDetail(null); openForm(resource); }} /></Box>;
}
