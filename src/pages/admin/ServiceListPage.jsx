import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, InputAdornment, MenuItem, Pagination, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { serviceService } from "../../services/admin/serviceService";
import { alertFromAxiosError, showConfirm, showSuccess } from "../../utils/alerts";
import ServiceList from "../../components/services/ServiceList";
import ServiceEmptyState from "../../components/services/ServiceEmptyState";
import ServiceDetailsDialog from "../../components/services/ServiceDetailsDialog";

const SERVICE_TYPE_OPTIONS = [
  ["general", "General"],
  ["appointment", "Cita"],
  ["repair", "Reparación"],
  ["onsite", "Servicio a domicilio"],
  ["tour", "Tour / Transporte"],
  ["rental", "Renta"],
  ["event", "Evento"],
  ["digital", "Digital"],
];

export default function ServiceListPage() {
  const navigate = useNavigate(); const location = useLocation(); const [params, setParams] = useSearchParams();
  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();
  const branchFromNav = location.state?.branch;
  const branchId = Number(branchFromNav?.id || selectedBranch?.id || params.get("branch_id") || 0);
  const branch = branchFromNav || selectedBranch || (branchId ? { id: branchId } : null);
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [search, setSearch] = useState(params.get("search") || ""); const [type, setType] = useState(params.get("service_type") || "");
  const [detail, setDetail] = useState(null); const [detailLoading, setDetailLoading] = useState(false);
  const page = Number(params.get("page") || 1);

  useEffect(() => { setHideLayout(false); if (branchFromNav?.id) setSelectedBranch(branchFromNav); }, [branchFromNav, setHideLayout, setSelectedBranch]);
  useEffect(() => { if (!branchId) navigate("/admin/sucursales", { replace: true }); }, [branchId, navigate]);

  const load = useCallback(async () => {
    if (!branchId) return; setLoading(true); setError("");
    try { const { data } = await serviceService.list(branchId, { page, search: search.trim() || undefined, service_type: type || undefined }); const paginated = data?.services || {}; setRows(Array.isArray(paginated.data) ? paginated.data : []); setMeta(paginated); }
    catch (err) { setError(err?.response?.data?.message || "No se pudieron cargar los servicios."); setRows([]); }
    finally { setLoading(false); }
  }, [branchId, page, search, type]);
  useEffect(() => { const timer = setTimeout(load, 300); return () => clearTimeout(timer); }, [load]);

  const setQuery = (key, value) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (key !== "page") next.delete("page"); if (branchId) next.set("branch_id", branchId); setParams(next); };
  const toForm = (service) => navigate(service ? `/admin/services/edit/${service.id}?branch_id=${branchId}` : `/admin/services/new?branch_id=${branchId}`, { state: { branch } });
  const view = async (service) => { setDetail(service); setDetailLoading(true); try { const { data } = await serviceService.get(branchId, service.id); setDetail({ ...data.service, branch_config: data.branch_config }); } catch (err) { alertFromAxiosError(err, "No se pudo cargar el servicio"); setDetail(null); } finally { setDetailLoading(false); } };
  const remove = async (service) => { if (!await showConfirm(`¿Eliminar “${service.name}” de esta sucursal?`, "Sí, eliminar")) return; try { await serviceService.remove(branchId, service.id); await showSuccess("Servicio eliminado"); load(); } catch (err) { alertFromAxiosError(err, "No se pudo eliminar el servicio"); } };
  const hasFilters = useMemo(() => !!(search || type), [search, type]);

  return <Box sx={{ maxWidth: 1400, mx: "auto" }}>
    <Card elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff", color: "#000", border: "1px solid rgba(0,0,0,.08)", "& .MuiTypography-root": { color: "#000" }, "& .MuiButton-outlined": { color: "#000", borderColor: "rgba(0,0,0,.18)", bgcolor: "#fff" }, "& .MuiTextField-root": { bgcolor: "#fff !important" }, "& .MuiInputBase-input, & .MuiSelect-select, & .MuiInputLabel-root, & .MuiSvgIcon-root": { color: "#000 !important" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,.18) !important" } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={3}>
        <Box><Typography variant="h4" fontWeight={900}>🛠️ Lista de Servicios</Typography><Stack direction="row" alignItems="center" spacing={1} mt={1} flexWrap="wrap"><Typography color="text.secondary">Sucursal:</Typography><Box component="span" sx={{ bgcolor: "#f9b233", color: "#171b20", borderRadius: 5, px: 1.25, py: .35, fontSize: 13, fontWeight: 900 }}>📍 {branch?.name || `#${branchId}`}</Box></Stack></Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignSelf={{ md: "center" }}><Button variant="outlined" startIcon={<GroupsRoundedIcon />} onClick={() => navigate(`/admin/services/resources?branch_id=${branchId}`, { state: { branch } })}>Recursos</Button><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => toForm()}>Crear servicio</Button><Button variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/admin/sucursales")} sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: 900, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#1565c0" } }}>Volver a sucursales</Button></Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={2}>
        <TextField value={search} onChange={(e) => { setSearch(e.target.value); setQuery("search", e.target.value); }} label="Buscar por nombre, código o descripción" size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "#fff" }} /></InputAdornment> }} sx={{ bgcolor: "#1a1a1a", borderRadius: 3, input: { color: "#fff" }, label: { color: "#fdd835" }, "& fieldset": { borderColor: "#fff" }, "&:hover fieldset": { borderColor: "#fff !important" } }} />
        <TextField select label="Tipo" value={type} onChange={(e) => { setType(e.target.value); setQuery("service_type", e.target.value); }} size="small" sx={{ minWidth: { sm: 240 }, bgcolor: "#1a1a1a", borderRadius: 3, "& .MuiSelect-select": { color: "#fff" }, "& .MuiSvgIcon-root": { color: "#fff" }, label: { color: "#fdd835" }, "& fieldset": { borderColor: "#fff" } }}><MenuItem value="">Todos</MenuItem>{SERVICE_TYPE_OPTIONS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}<Button onClick={load}>Reintentar</Button></Alert>}
      {loading ? <Stack alignItems="center" py={8}><CircularProgress color="warning" /></Stack> : rows.length ? <ServiceList services={rows} onView={view} onEdit={toForm} onDelete={remove} /> : <ServiceEmptyState hasFilters={hasFilters} onCreate={() => toForm()} />}
      {Number(meta.last_page) > 1 && <Stack alignItems="center" mt={3}><Pagination page={Number(meta.current_page || page)} count={Number(meta.last_page)} onChange={(_, value) => setQuery("page", String(value))} color="primary" sx={{ "& .MuiPaginationItem-root": { color: "#fff", borderColor: "#fff" }, "& .Mui-selected": { bgcolor: "#2196f3", color: "#fff !important" } }} /></Stack>}
    </Card>
    <ServiceDetailsDialog open={!!detail} service={detail} loading={detailLoading} onClose={() => setDetail(null)} onEdit={toForm} />
  </Box>;
}
