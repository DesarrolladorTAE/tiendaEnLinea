import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../config/axiosClient";

import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Paper,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FolderIcon from "@mui/icons-material/Folder";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";

import { useNavigate } from "react-router-dom";
import { adminSectionDialog, adminSectionHeader, adminSectionPanel, adminSectionPrimaryAction, adminSectionScope, adminSectionTitle } from "../../components/admin/AdminSectionOption";

// ✅ Hook de gating (el que ya hiciste)
import useCategoriaPadreGate from "../../hooks/useCategoriaPadreGate";

// ✅ Sucursal activa (igual que POS)
import { useAdminUi } from "../../context/AdminUiContext";

const Category = () => {
  const navigate = useNavigate();

  // ✅ Gate por plan
  const { isPlanSoloSueltas, reasonHierarchy, openPlanesModal } =
    useCategoriaPadreGate();

  // ✅ Sucursal activa
  const { selectedBranch } = useAdminUi();
  const activeBranchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  // Data
  const [parentsTree, setParentsTree] = useState([]); // tree (padres con hijas)
  const [flat, setFlat] = useState([]); // flat (todas)
  const [loading, setLoading] = useState(false);

  // UI
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Modal Form
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [categoryType, setCategoryType] = useState("independent");

  // Form
  const [form, setForm] = useState({
    name: "",
    parent_id: "", // "" => sin padre (suelta)
    editingId: null,
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // ✅ Si no hay sucursal, manda a seleccionar
  useEffect(() => {
    if (!activeBranchId) {
      showSnackbar("Selecciona una sucursal para administrar categorías", "warning");
      navigate("/admin/sucursales");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  // Initial load only (pero depende de branch)
  const fetchAll = async () => {
    if (!activeBranchId) return;

    try {
      setLoading(true);

      const [treeRes, flatRes] = await Promise.all([
        axiosClient.get("admin/categories", {
          params: { mode: "tree", branch_id: activeBranchId },
        }),
        axiosClient.get("admin/categories", {
          params: { branch_id: activeBranchId },
        }),
      ]);

      const tParents = treeRes.data.parents ?? [];
      const fCats = flatRes.data.categories ?? flatRes.data ?? [];

      setParentsTree(tParents);
      setFlat(fCats);
    } catch (error) {
      console.error(error);
      showSnackbar("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeBranchId) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  // Helpers
  const parentOptions = useMemo(() => {
    return flat.filter((c) => c.parent_id == null);
  }, [flat]);

  const parentIdsWithChildren = useMemo(() => {
    const s = new Set();
    for (const p of parentsTree) s.add(p.id);
    return s;
  }, [parentsTree]);

  const singles = useMemo(() => {
    return flat
      .filter((c) => c.parent_id == null && !parentIdsWithChildren.has(c.id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [flat, parentIdsWithChildren]);

  const groupedCount = parentsTree.length;
  const subcategoryCount = useMemo(
    () => parentsTree.reduce((acc, p) => acc + (p.children?.length ?? 0), 0),
    [parentsTree]
  );

  const resetForm = () => {
    setCategoryType("independent");
    setForm({ name: "", parent_id: "", editingId: null });
  };
  const creatingSubcategory = !form.editingId && categoryType === "subcategory";
  const creatingPrincipal = !form.editingId && categoryType === "principal";
  const showPrincipalField = Boolean(form.editingId) || creatingSubcategory;

  const openCreate = () => {
    if (!activeBranchId) {
      showSnackbar("Selecciona una sucursal primero", "warning");
      navigate("/admin/sucursales");
      return;
    }
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (cat) => {
    const parentValue = isPlanSoloSueltas ? "" : cat.parent_id ?? "";

    setForm({
      name: cat.name ?? "",
      parent_id: parentValue,
      editingId: cat.id,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (formLoading) return;
    setFormOpen(false);
    resetForm();
  };

  // ===== Optimistic local updates =====
  const upsertFlat = (cat) => {
    setFlat((prev) => {
      const idx = prev.findIndex((x) => x.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...cat };
        return copy;
      }
      return [...prev, cat];
    });
  };

  const removeFromFlat = (id) => {
    setFlat((prev) => prev.filter((x) => x.id !== id));
  };

  const rebuildTreeFromFlat = () => {
    setParentsTree(() => {
      const parents = flat.filter((c) => c.parent_id == null);
      const childrenByParent = new Map();

      for (const c of flat) {
        if (c.parent_id != null) {
          const arr = childrenByParent.get(c.parent_id) ?? [];
          arr.push(c);
          childrenByParent.set(c.parent_id, arr);
        }
      }

      const tree = parents
        .map((p) => ({
          ...p,
          children: (childrenByParent.get(p.id) ?? []).sort((a, b) =>
            String(a.name).localeCompare(String(b.name))
          ),
        }))
        .filter((p) => (p.children?.length ?? 0) > 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      return tree;
    });
  };

  useEffect(() => {
    rebuildTreeFromFlat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat]);

  // ===== CRUD =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formLoading || !form.name.trim() || (creatingSubcategory && form.parent_id === "")) return;

    if (!activeBranchId) {
      showSnackbar("Selecciona una sucursal antes de guardar", "warning");
      navigate("/admin/sucursales");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id === "" ? null : Number(form.parent_id),
        branch_id: Number(activeBranchId), // ✅ IMPORTANTÍSIMO
      };

      // ✅ Plan 2 SOLO SUELTAS => si intenta crear HIJA, bloquear.
      if (isPlanSoloSueltas && payload.parent_id !== null) {
        showSnackbar(
          reasonHierarchy ||
            "El Plan Negocio permite crear categorías independientes.",
          "warning"
        );
        return;
      }

      if (form.editingId) {
        const res = await axiosClient.post(`admin/categories/${form.editingId}`, {
          ...payload,
          _method: "PATCH",
        });

        const updated =
          res?.data?.category ?? res?.data ?? { id: form.editingId, ...payload };

        upsertFlat(updated);
        showSnackbar("Categoría actualizada");
      } else {
        const res = await axiosClient.post("admin/categories", payload);
        const created = res?.data?.category ?? res?.data;

        if (created?.id) {
          upsertFlat({ ...payload, ...created });
          if (creatingPrincipal) {
            setCategoryType("subcategory");
            setForm({ name: "", parent_id: Number(created.id), editingId: null });
            showSnackbar("Categoría creada. Ahora puedes agregar su primera subcategoría.");
            return;
          }
        }
        showSnackbar("Categoría creada");
      }

      setFormOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      showSnackbar(error?.response?.data?.message ?? "Error al guardar", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const askDelete = (cat) => {
    setDeleteDialog({ open: true, id: cat.id, name: cat.name });
  };

  const handleDeleteConfirm = async () => {
    if (formLoading || !deleteDialog.id) return;

    setFormLoading(true);
    try {
      await axiosClient.delete(`admin/categories/${deleteDialog.id}`);

      const id = deleteDialog.id;
      removeFromFlat(id);

      const wasParent = flat.some((c) => c.parent_id === null && c.id === id);
      const hadChildren = flat.some((c) => c.parent_id === id);

      setDeleteDialog({ open: false, id: null, name: "" });
      showSnackbar("Categoría eliminada");

      // Si borraste un padre con hijas, el backend puede “soltarlas”.
      if (wasParent && hadChildren) {
        await fetchAll();
      }
    } catch (error) {
      console.error(error);
      showSnackbar("Error al eliminar", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const renderActions = (category) => (
    <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
      <Tooltip title="Editar">
        <span><IconButton aria-label={`Editar ${category.name}`} onClick={() => openEdit(category)} disabled={formLoading}>
          <EditIcon fontSize="small" />
        </IconButton></span>
      </Tooltip>
      <Tooltip title="Eliminar">
        <span><IconButton aria-label={`Eliminar ${category.name}`} color="error" onClick={() => askDelete(category)} disabled={formLoading}>
          <DeleteIcon fontSize="small" />
        </IconButton></span>
      </Tooltip>
    </Stack>
  );

  const renderRow = (category, isSubcategory = false) => (
    <ListItem key={category.id} disableGutters sx={{ gap: 1, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      {isSubcategory && <SubdirectoryArrowRightIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />}
      <Typography fontWeight={700} sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{category.name}</Typography>
      {renderActions(category)}
    </ListItem>
  );

  const closeDelete = () => {
    if (!formLoading) setDeleteDialog({ open: false, id: null, name: "" });
  };

  return (
    <Box sx={{
      width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto", pb: 3,
      "& .MuiButton-root": { minHeight: 44, textTransform: "none", fontWeight: 700, borderRadius: 2.5 },
      "& .MuiIconButton-root": { minWidth: 44, minHeight: 44 },
    }}>
      <Paper elevation={0} sx={adminSectionHeader}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={adminSectionTitle}>Categorías</Typography>
            <Typography sx={{ mt: 1, color: "#c7cbd1" }}>Organiza las categorías de productos de tu sucursal.</Typography>
          </Box>
          <Chip icon={<LocationOnRoundedIcon />} sx={adminSectionScope}
            label={selectedBranch?.name || (activeBranchId ? `Sucursal #${activeBranchId}` : "Sin sucursal")} />
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Chip size="small" label={`${groupedCount} principales`} variant="outlined" />
          <Chip size="small" label={`${subcategoryCount} subcategorías`} variant="outlined" />
          <Chip size="small" label={`${singles.length} independientes`} variant="outlined" />
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          <Tooltip title="Guía de categorías">
            <IconButton aria-label="Abrir guía de categorías" aria-haspopup="dialog" onClick={() => setHelpOpen(true)}
              sx={{ bgcolor: "#fff3cd", color: "#684c00", "&:hover": { bgcolor: "#ffe082" } }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openCreate} disabled={!activeBranchId}
            sx={{ ...adminSectionPrimaryAction, flex: { xs: 1, sm: "none" } }}>Nueva categoría</Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box role="status" sx={{ py: 5, textAlign: "center" }}>
          <CircularProgress size={26} aria-label="Cargando categorías" sx={{ color: "#b58a00" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 3fr) minmax(0, 2fr)" }, alignItems: "start", gap: 2 }}>
          <Paper component="section" elevation={0} sx={adminSectionPanel}>
            <Typography component="h2" variant="h6" fontWeight={800} mb={2}>Categorías principales</Typography>
            {parentsTree.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay categorías con subcategorías asignadas.</Typography>
            ) : (
              <Stack gap={1.5}>
                {parentsTree.map(category => (
                  <Paper component="article" key={category.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: "#fff8df", borderBottom: "1px solid #f3e6be" }}>
                      <FolderIcon fontSize="small" sx={{ color: "#765900", flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
                        <Typography component="h3" fontWeight={800}>{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{category.children?.length ?? 0} subcategoría(s)</Typography>
                      </Box>
                      {renderActions(category)}
                    </Stack>
                    {Boolean(category.children?.length) && (
                      <List aria-label={`Subcategorías de ${category.name}`} disablePadding sx={{ px: { xs: 1, sm: 1.5 } }}>
                        {category.children.map(child => renderRow(child, true))}
                      </List>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
          <Paper component="section" elevation={0} sx={adminSectionPanel}>
            <Typography component="h2" variant="h6" fontWeight={800} mb={1}>Categorías independientes</Typography>
            {singles.length ? <List disablePadding>{singles.map(category => renderRow(category))}</List> : (
              <Typography variant="body2" color="text.secondary">No hay categorías independientes registradas.</Typography>
            )}
          </Paper>
        </Box>
      )}

      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm" sx={adminSectionDialog} aria-labelledby="category-form-title">
        <DialogTitle id="category-form-title">{form.editingId ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        <DialogContent dividers>
          {isPlanSoloSueltas && (
            <Alert severity="info" sx={{ mb: 2 }}>
              El Plan Negocio permite crear categorías independientes.
              <Button onClick={openPlanesModal} size="small" sx={{ ml: 1 }}>Ver planes</Button>
            </Alert>
          )}
          <Stack component="form" id="admin-category-form" onSubmit={handleSubmit} gap={2} sx={{ pt: 1 }}>
            {!form.editingId && (
              <FormControl component="fieldset" disabled={formLoading}>
                <FormLabel component="legend" id="category-type-label">Tipo de categoría</FormLabel>
                <RadioGroup aria-labelledby="category-type-label" value={categoryType} onChange={(_, value) => {
                  setCategoryType(value);
                  setForm(previous => ({ ...previous, parent_id: "" }));
                }} sx={{ "& .MuiRadio-root.Mui-checked": { color: "#8a6500" } }}>
                  <FormControlLabel value="independent" control={<Radio />} label="Categoría independiente" />
                  <FormControlLabel value="principal" control={<Radio />} label="Categoría principal" disabled={isPlanSoloSueltas} />
                  <FormControlLabel value="subcategory" control={<Radio />} label="Subcategoría" disabled={isPlanSoloSueltas || !parentOptions.length} />
                </RadioGroup>
                <Typography variant="body2" color="text.secondary">
                  {creatingPrincipal ? "Crea un grupo y agrega su primera subcategoría." : creatingSubcategory
                    ? "Elige la categoría bajo la que aparecerá." : "Úsala por sí sola."}
                </Typography>
              </FormControl>
            )}
            <TextField label="Nombre" value={form.name} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))}
              required autoFocus disabled={formLoading} fullWidth />
            {showPrincipalField && <FormControl fullWidth required={creatingSubcategory} disabled={formLoading || isPlanSoloSueltas}>
              <InputLabel id="category-parent-label" shrink>Categoría principal</InputLabel>
              <Select labelId="category-parent-label" label="Categoría principal" value={form.parent_id} displayEmpty notched
                onChange={event => setForm(previous => ({ ...previous, parent_id: event.target.value }))} MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                <MenuItem value="" disabled={creatingSubcategory}>{creatingSubcategory ? "Selecciona una categoría" : "Ninguna"}</MenuItem>
                {parentOptions.filter(category => category.id !== form.editingId).map(category => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>}
          </Stack>
        </DialogContent>
        <DialogActions disableSpacing>
          <Button onClick={closeForm} disabled={formLoading}>Cancelar</Button>
          <Button form="admin-category-form" type="submit" variant="contained" sx={adminSectionPrimaryAction}
            disabled={formLoading || (creatingSubcategory && form.parent_id === "")}>
            {formLoading ? "Guardando…" : form.editingId ? "Guardar cambios" : creatingPrincipal ? "Crear y agregar subcategoría"
              : creatingSubcategory ? "Crear subcategoría" : "Crear categoría"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} fullWidth maxWidth="sm" sx={adminSectionDialog} aria-labelledby="category-help-title">
        <DialogTitle id="category-help-title">Guía de categorías</DialogTitle>
        <DialogContent dividers>
          <Stack gap={1.5}>
            {[
              ["Categoría principal", "Agrupa subcategorías. Por ejemplo, Refacciones puede agrupar Filtros y Frenos."],
              ["Subcategoría", "Selecciona una categoría principal al crearla o editarla."],
              ["Categoría independiente", "Selecciona Ninguna si no necesitas agruparla."],
            ].map(([label, description]) => (
              <Box key={label}>
                <Typography fontWeight={800}>{label}</Typography>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
              </Box>
            ))}
            {isPlanSoloSueltas && <Alert severity="info">El Plan Negocio admite categorías independientes.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setHelpOpen(false)} variant="contained" sx={adminSectionPrimaryAction}>Entendido</Button></DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={closeDelete} fullWidth maxWidth="xs" sx={adminSectionDialog} aria-labelledby="category-delete-title">
        <DialogTitle id="category-delete-title">Eliminar categoría</DialogTitle>
        <DialogContent dividers>
          <Typography>¿Quieres eliminar <strong>{deleteDialog.name}</strong>?</Typography>
          {parentsTree.some(category => category.id === deleteDialog.id && category.children?.length > 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Al eliminar esta categoría, sus subcategorías pueden quedar sin una categoría principal.
            </Typography>
          )}
        </DialogContent>
        <DialogActions disableSpacing>
          <Button onClick={closeDelete} disabled={formLoading}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={formLoading}>
            {formLoading ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2800}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Category;
