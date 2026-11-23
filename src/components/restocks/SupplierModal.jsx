import React, { useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Pagination, Paper, Stack, Switch, TextField, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import axiosClient from "../../config/axiosClient";
import { showConfirm, showToastSuccess, alertFromAxiosError } from "../../utils/alerts";
import ImportSuppliersModal from "./ImportSuppliersModal";
import SupplierDetailModal from "./SupplierDetailModal";
import { EMPTY_SUPPLIER, supplierToForm, supplierPayload, validateSupplier } from "./supplierForm.mjs";

const SECTIONS = [
  { title: "Información general", fields: [["name", "Nombre del proveedor"], ["alias", "Alias"], ["contact_name", "Contacto"]] },
  { title: "Datos fiscales", fields: [["rfc", "RFC"], ["curp", "CURP"]] },
  { title: "Contacto", fields: [["phone", "Teléfono"], ["celular", "Celular"], ["email", "Correo electrónico"]] },
  { title: "Ubicación", fields: [["address", "Calle / dirección"], ["numero_exterior", "Número exterior"], ["numero_interior", "Número interior"], ["colonia", "Colonia"], ["codigo_postal", "Código postal"], ["localidad", "Localidad"], ["municipio", "Municipio"], ["estado", "Estado"], ["pais", "País"]] },
  { title: "Crédito", fields: [["limite_credito", "Límite de crédito"], ["dias_credito", "Días de crédito"]] },
  { title: "Notas internas", fields: [["notes", "Notas"]] },
];
const PAGE_SIZE = 12;
const buttonSx = { textTransform: "none", borderRadius: 2, fontWeight: 700 };

export default function SupplierModal({ open, onClose, branchId, suppliers = [], loading = false, onReload }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState({ ...EMPTY_SUPPLIER });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const submitting = useRef(false);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return suppliers.filter((supplier) => [supplier.name, supplier.alias, supplier.rfc, supplier.email, supplier.phone, supplier.celular].some((value) => String(value || "").toLocaleLowerCase("es").includes(term)));
  }, [suppliers, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleSuppliers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const resetForm = () => { setForm({ ...EMPTY_SUPPLIER }); setEditingId(null); setErrors({}); setNotice(""); };
  const handleClose = () => { if (submitting.current || importOpen || detailId !== null) return; resetForm(); onClose?.(); };
  const handleEdit = (supplier) => { if (submitting.current) return; setEditingId(supplier.id); setForm(supplierToForm(supplier)); setErrors({}); setNotice(""); };
  const refresh = async () => {
    try { await onReload(); }
    catch { setNotice("Los cambios se guardaron, pero no se pudo actualizar el listado. Presiona Recargar."); }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || !branchId) return;
    const nextErrors = validateSupplier(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submitting.current = true; setSaving(true); setNotice("");
    try {
      const payload = supplierPayload(form, branchId);
      if (editingId) await axiosClient.put(`/restocks/suppliers/${editingId}`, payload);
      else await axiosClient.post("/restocks/suppliers", payload);
      showToastSuccess(editingId ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente");
      resetForm(); await refresh();
    } catch (error) { alertFromAxiosError(error, "No se pudo guardar el proveedor."); }
    finally { submitting.current = false; setSaving(false); }
  };
  const handleDelete = async (supplier) => {
    if (submitting.current) return;
    submitting.current = true; setSaving(true);
    try {
      if (!await showConfirm(`¿Desea eliminar el proveedor "${supplier.name}"?`, "Sí, eliminar")) return;
      await axiosClient.delete(`/restocks/suppliers/${supplier.id}`);
      showToastSuccess("Proveedor eliminado correctamente");
      if (editingId === supplier.id) resetForm();
      await refresh();
    } catch (error) { alertFromAxiosError(error, "No se pudo eliminar el proveedor."); }
    finally { submitting.current = false; setSaving(false); }
  };
  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg" fullScreen={fullScreen} aria-labelledby="supplier-modal-title"
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, height: fullScreen ? "100dvh" : "90dvh", maxHeight: fullScreen ? "100dvh" : "90dvh", overflow: "hidden" } }}>
        <DialogTitle id="supplier-modal-title" sx={{ p: { xs: 2, sm: 3 }, background: "linear-gradient(120deg, #ede9fe, #ccfbf1)", flexShrink: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1.5, borderRadius: 3, display: "flex", bgcolor: "white", color: "#6d28d9" }}><LocalShippingRoundedIcon /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="span" sx={{ display: "block", fontWeight: 800, fontSize: 22 }}>Proveedores</Typography>
              <Typography variant="body2">Registra, edita o importa los proveedores de tu sucursal.</Typography>
            </Box>
            <IconButton aria-label="Cerrar proveedores" onClick={handleClose} disabled={saving}><CloseRoundedIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>
          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, minHeight: 0, overflowY: "auto", overflowX: "hidden", bgcolor: "#f8fafc" }}>
            {notice && <Alert severity="warning" sx={{ mb: 2 }}>{notice}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 800 }}>{editingId ? "Editar proveedor" : "Nuevo proveedor"}</Typography>
                  {editingId && <Button disabled={saving} onClick={resetForm} sx={buttonSx}>Nuevo</Button>}
                </Stack>
                <FormControlLabel control={<Switch checked={form.is_active} disabled={saving} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Proveedor activo" />
                {form.origen_sicar && <Chip label="Importado desde SICAR" color="success" variant="outlined" sx={{ alignSelf: "flex-start" }} />}
                {SECTIONS.map(({ title, fields }) => (
                  <Paper key={title} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 800, mb: 2, color: "#6d28d9" }}>{title}</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: fields.length > 1 ? { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } : "minmax(0, 1fr)", gap: 2 }}>
                      {fields.map(([key, label]) => (
                        <TextField key={key} label={label} value={form[key]} fullWidth disabled={saving}
                          required={key === "name"} type={key === "email" ? "email" : ["limite_credito", "dias_credito"].includes(key) ? "number" : "text"}
                          multiline={key === "notes"} minRows={key === "notes" ? 3 : undefined} error={!!errors[key]} helperText={errors[key] || ""}
                          inputProps={key === "rfc" ? { maxLength: 13 } : key === "curp" ? { maxLength: 18 } : key === "codigo_postal" ? { maxLength: 5, inputMode: "numeric" } : key === "limite_credito" ? { min: 0, step: "0.000001" } : key === "dias_credito" ? { min: 0, step: 1 } : {}}
                          onChange={(event) => setForm((prev) => ({ ...prev, [key]: ["rfc", "curp"].includes(key) ? event.target.value.toUpperCase() : event.target.value }))}
                          sx={{ minWidth: 0, gridColumn: ["name", "address", "contact_name", "email"].includes(key) ? "1 / -1" : undefined, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Stack>
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }}>Listado de proveedores · {filtered.length}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />} disabled={saving || loading || !branchId} onClick={() => setImportOpen(true)} sx={{ ...buttonSx, color: "#6d28d9", borderColor: "#c4b5fd" }}>Importar / exportar</Button>
                  <Button disabled={loading || saving} onClick={() => onReload().catch(() => setNotice("No se pudo actualizar el listado."))} sx={buttonSx}>Recargar</Button>
                </Stack>
                <TextField size="small" label="Buscar proveedor" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} fullWidth />
                {loading && <Stack direction="row" alignItems="center" spacing={1}><CircularProgress size={20} /><Typography variant="body2">Actualizando proveedores...</Typography></Stack>}
                {!loading && !filtered.length && <Alert severity="info">No se encontraron proveedores.</Alert>}
                {visibleSuppliers.map((supplier) => (
                  <Paper key={supplier.id} variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: editingId === supplier.id ? "#6d28d9" : "#e2e8f0", background: "linear-gradient(140deg, #faf8ff, #fff 65%, #f0fdfa)", overflowWrap: "anywhere" }}>
                    <Typography sx={{ fontWeight: 800 }}>{supplier.name}</Typography>
                    {supplier.alias && <Typography variant="body2" color="text.secondary">Alias: {supplier.alias}</Typography>}
                    <Typography variant="body2" color="text.secondary">{supplier.contact_name || "Sin contacto"} · {supplier.celular || supplier.phone || "Sin teléfono"}</Typography>
                    <Typography variant="body2" color="text.secondary">RFC: {supplier.rfc || "N/A"} · {supplier.email || "Sin correo"}</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      {supplier.origen_sicar === true || supplier.origen_sicar === 1 || supplier.origen_sicar === "1" ? <Chip size="small" label="SICAR" color="success" variant="outlined" /> : null}
                      {supplier.is_active === false || supplier.is_active === 0 || supplier.is_active === "0" ? <Chip size="small" label="Inactivo" /> : null}
                      <Button size="small" disabled={saving} onClick={() => setDetailId(supplier.id)} sx={buttonSx}>Ver datos</Button>
                      <Button size="small" disabled={saving} onClick={() => handleEdit(supplier)} sx={buttonSx}>Editar</Button>
                      <Button size="small" disabled={saving} color="error" onClick={() => handleDelete(supplier)} sx={buttonSx}>Eliminar</Button>
                    </Stack>
                  </Paper>
                ))}
                {pages > 1 && <Pagination count={pages} page={currentPage} onChange={(_, value) => setPage(value)} size="small" siblingCount={0} sx={{ "& ul": { flexWrap: "wrap" } }} />}
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, flexShrink: 0, flexWrap: "wrap", gap: 1, pb: "max(16px, env(safe-area-inset-bottom))" }}>
            <Button onClick={handleClose} disabled={saving} sx={buttonSx}>Cerrar</Button>
            <Button type="submit" variant="contained" disabled={saving || !branchId} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined} sx={{ ...buttonSx, bgcolor: "#6d28d9", "&:hover": { bgcolor: "#5b21b6" } }}>{saving ? "Guardando..." : editingId ? "Actualizar proveedor" : "Guardar proveedor"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
      {importOpen && <ImportSuppliersModal open onClose={() => setImportOpen(false)} branchId={branchId} onImported={onReload} />}
      {detailId !== null && <SupplierDetailModal supplierId={detailId} branchId={branchId} sections={SECTIONS} onClose={() => setDetailId(null)} onEdit={(supplier) => { handleEdit(supplier); setDetailId(null); }} />}
    </>
  );
}
