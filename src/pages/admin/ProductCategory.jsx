import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../config/axiosClient";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Paper,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FolderIcon from "@mui/icons-material/Folder";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CloseIcon from "@mui/icons-material/Close";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// ✅ Hook de gating (el que ya hiciste)
import useCategoriaPadreGate from "../../hooks/useCategoriaPadreGate";

const Category = () => {
  // ✅ Gate por plan
  const { planId, isPlanSoloSueltas, reasonHierarchy, openPlanesModal } =
    useCategoriaPadreGate();

  // Data
  const [parentsTree, setParentsTree] = useState([]); // tree (padres con hijas)
  const [flat, setFlat] = useState([]); // flat (todas)
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  // Form
  const [form, setForm] = useState({
    name: "",
    parent_id: "", // "" => sin padre (suelta)
    editingId: null,
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Initial load only
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [treeRes, flatRes] = await Promise.all([
        axiosClient.get("admin/categories?mode=tree"),
        axiosClient.get("admin/categories"),
      ]);

      const tParents = treeRes.data.parents ?? [];
      const fCats = flatRes.data.categories ?? flatRes.data ?? [];

      setParentsTree(tParents);
      setFlat(fCats);
    } catch (error) {
      console.error(error);
      showSnackbar("❌ Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Helpers
  const parentOptions = useMemo(() => {
    return flat.filter((c) => c.parent_id == null);
  }, [flat]);

  // Build an easy view:
  // - Padres: categorías con hijas (según tree)
  // - Sueltas: categorías sin parent_id y sin hijas
  const parentIdsWithChildren = useMemo(() => {
    const s = new Set();
    for (const p of parentsTree) s.add(p.id);
    return s;
  }, [parentsTree]);

  const singles = useMemo(() => {
    // sueltas = parent_id null y NO aparece como padre en el tree (sin hijas)
    return flat
      .filter((c) => c.parent_id == null && !parentIdsWithChildren.has(c.id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [flat, parentIdsWithChildren]);

  const totalPadres = parentsTree.length;
  const totalHijas = useMemo(
    () => parentsTree.reduce((acc, p) => acc + (p.children?.length ?? 0), 0),
    [parentsTree]
  );
  const totalSueltas = singles.length;

  const modo = useMemo(() => {
    if (form.parent_id === "") return "SUELTA";
    return "HIJA";
  }, [form.parent_id]);

  const resetForm = () => setForm({ name: "", parent_id: "", editingId: null });

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (cat) => {
    // Si es plan solo sueltas y la categoría es hija, no debería pasar,
    // pero si existe por data vieja, al editar lo forzamos a suelta para no romper.
    const parentValue =
      isPlanSoloSueltas ? "" : cat.parent_id ?? "";

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

  // ===== Optimistic local updates (NO refresh) =====
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
    // Rebuild tree purely from flat: group by parent_id, and only show parents with children.
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

  // whenever flat changes, rebuild tree
  useEffect(() => {
    rebuildTreeFromFlat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat]);

  // ===== CRUD =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id === "" ? null : Number(form.parent_id),
      };

      // ✅ Regla: Plan 2 SOLO SUELTAS => si intenta crear HIJA, bloquear.
      if (isPlanSoloSueltas && payload.parent_id !== null) {
        showSnackbar(
          reasonHierarchy ||
            "🔒 Plan Negocio: solo puedes crear categorías sueltas (sin padre y sin hijas).",
          "warning"
        );
        return;
      }

      if (form.editingId) {
        const res = await axiosClient.post(
          `admin/categories/${form.editingId}`,
          {
            ...payload,
            _method: "PATCH",
          }
        );

        const updated =
          res?.data?.category ??
          res?.data ??
          { id: form.editingId, ...payload };

        upsertFlat(updated);
        showSnackbar("✅ Categoría actualizada");
      } else {
        const res = await axiosClient.post("admin/categories", payload);
        const created = res?.data?.category ?? res?.data;
        if (created?.id) upsertFlat(created);

        showSnackbar("✅ Categoría creada");
      }

      closeForm();
    } catch (error) {
      console.error(error);
      showSnackbar(
        error?.response?.data?.message ?? "❌ Error al guardar",
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const askDelete = (cat) => {
    setDeleteDialog({ open: true, id: cat.id, name: cat.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.id) return;
    setFormLoading(true);
    try {
      await axiosClient.delete(`admin/categories/${deleteDialog.id}`);

      const id = deleteDialog.id;
      removeFromFlat(id);

      const wasParent = flat.some((c) => c.parent_id === null && c.id === id);
      const hadChildren = flat.some((c) => c.parent_id === id);

      setDeleteDialog({ open: false, id: null, name: "" });
      showSnackbar("🗑️ Categoría eliminada");

      // Si borraste un padre con hijas, el backend puede “soltarlas”.
      if (wasParent && hadChildren) {
        await fetchAll();
      }
    } catch (error) {
      console.error(error);
      showSnackbar("❌ Error al eliminar", "error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          mb: 2,
          background:
            "linear-gradient(135deg, rgba(12,37,163,0.08), rgba(245,134,52,0.08))",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "center", md: "center" }}
          textAlign={{ xs: "center", md: "left" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={900}>
              📁 Categorías
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              🗂️ Padre = Carpeta. 👶 Hija = Va dentro. 📄 Suelta = No está dentro
              de nadie.
            </Typography>

            {Boolean(planId) && (
              <Typography variant="caption" color="text.secondary">
                Plan actual: <b>{planId}</b>{" "}
                {isPlanSoloSueltas
                  ? "· Solo SUELTAS ✅ (jerarquía bloqueada 🔒)"
                  : "· Jerarquía disponible ✅"}
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            gap={1}
            alignItems="center"
            justifyContent={{ xs: "center", md: "flex-end" }}
            flexWrap="wrap"
          >
            <Chip
              icon={<FolderIcon />}
              label={`Padres: ${totalPadres}`}
              variant="outlined"
            />
            <Chip
              icon={<SubdirectoryArrowRightIcon />}
              label={`Hijas: ${totalHijas}`}
              variant="outlined"
            />
            <Chip
              icon={<LocalOfferIcon />}
              label={`Sueltas: ${totalSueltas}`}
              variant="outlined"
            />

            <Tooltip title="¿Cómo funciona?">
              <IconButton onClick={() => setHelpOpen(true)}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Nueva categoría
            </Button>

            {loading && <CircularProgress size={18} />}
          </Stack>
        </Stack>
      </Paper>

      {/* CONTENT */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        gap={2}
        alignItems="flex-start"
      >
        {/* LEFT: Padres + Hijas */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
            🗂️ Padres (con hijas)
          </Typography>

          {parentsTree.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: (t) => `1px dashed ${t.palette.divider}`,
              }}
            >
              <Typography fontWeight={900}>
                No hay padres con hijas todavía 💤
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Crea categorías. Si tu plan permite jerarquía, podrás hacer hijas.
              </Typography>
            </Paper>
          ) : (
            <Stack gap={2}>
              {parentsTree.map((p) => (
                <Card
                  key={p.id}
                  variant="outlined"
                  sx={{ borderRadius: 3, boxShadow: 2, overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      background:
                        "linear-gradient(135deg, rgba(12,37,163,0.10), rgba(245,134,52,0.10))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1}
                      flexWrap="wrap"
                    >
                      <FolderIcon />
                      <Typography fontWeight={900}>{p.name}</Typography>
                      <Chip size="small" label="Padre" variant="outlined" />
                      <Chip
                        size="small"
                        icon={<LocalOfferIcon />}
                        label={`Hijas: ${p.children?.length ?? 0}`}
                        variant="outlined"
                      />
                    </Stack>

                    <Box>
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => openEdit(p)}
                          disabled={formLoading}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          color="error"
                          onClick={() => askDelete(p)}
                          disabled={formLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <CardContent sx={{ pt: 1.5 }}>
                    {p.children?.length ? (
                      <List dense>
                        {p.children.map((c) => (
                          <ListItem
                            key={c.id}
                            sx={{
                              borderRadius: 2,
                              mb: 0.5,
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                            secondaryAction={
                              <Box>
                                <Tooltip title="Editar">
                                  <IconButton
                                    onClick={() => openEdit(c)}
                                    sx={{ mr: 1 }}
                                    disabled={formLoading}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    color="error"
                                    onClick={() => askDelete(c)}
                                    disabled={formLoading}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" gap={1}>
                                  <SubdirectoryArrowRightIcon fontSize="small" />
                                  <Typography fontWeight={700}>{c.name}</Typography>
                                  <Chip size="small" label="Hija" variant="outlined" />
                                </Stack>
                              }
                              secondary={`Dentro de: ${p.name}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        👶 Sin hijas.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* RIGHT: Sueltas */}
        <Box sx={{ width: { xs: "100%", md: 380 } }}>
          <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight={900}>
                  📄 Sueltas
                </Typography>
                <Chip label={`${singles.length}`} variant="outlined" />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Son categorías normales que no están dentro de nadie.
              </Typography>

              <Divider sx={{ my: 2 }} />

              {singles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay sueltas por ahora.
                </Typography>
              ) : (
                <Box
                  sx={{
                    maxHeight: { xs: 260, md: 420 },
                    overflowY: "auto",
                    pr: 0.5,
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(0,0,0,0.25)",
                      borderRadius: 8,
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "rgba(0,0,0,0.06)",
                      borderRadius: 8,
                    },
                  }}
                >
                  <List dense sx={{ pr: 1 }}>
                    {singles.map((c) => (
                      <ListItem
                        key={c.id}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                        secondaryAction={
                          <Box>
                            <Tooltip title="Editar">
                              <IconButton
                                onClick={() => openEdit(c)}
                                sx={{ mr: 1 }}
                                disabled={formLoading}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                onClick={() => askDelete(c)}
                                disabled={formLoading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={<Typography fontWeight={700}>{c.name}</Typography>}
                          secondary="📄 Suelta"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                fullWidth
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Crear nueva
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* FORM MODAL */}
      <Dialog
        open={formOpen}
        onClose={closeForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: "100%",
            maxWidth: 520,
            m: isMobile ? 2 : "auto",
          },
        }}
      >
        {isMobile && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography fontWeight={900}>
              {form.editingId ? "✏️ Editar categoría" : "➕ Nueva categoría"}
            </Typography>

            <IconButton onClick={closeForm} disabled={formLoading} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        {!isMobile && (
          <DialogTitle sx={{ fontWeight: 900 }}>
            {form.editingId ? "✏️ Editar categoría" : "➕ Nueva categoría"}
          </DialogTitle>
        )}

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            📄 Suelta = no eliges padre. 👶 Hija = eliges un padre.
          </Typography>

          {/* ✅ Aviso: Plan 2 solo sueltas */}
          {isPlanSoloSueltas && (
            <Alert
              severity="info"
              sx={{ borderRadius: 2, mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={openPlanesModal}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  Ver planes
                </Button>
              }
            >
              <b>Plan {planId || "?"}</b>: solo puedes crear <b>categorías sueltas</b>.
              No puedes crear hijas ni jerarquía.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack gap={2}>
              <TextField
                label="Nombre"
                variant="filled"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                disabled={formLoading}
                placeholder="Ej: Refacciones, Filtros…"
                fullWidth
              />

              <FormControl variant="filled" fullWidth disabled={formLoading}>
                <InputLabel id="parent-label">¿Va dentro de un Padre?</InputLabel>

                <Select
                  labelId="parent-label"
                  value={form.parent_id}
                  onChange={(e) => {
                    const v = e.target.value;

                    // 🚫 Plan 2: bloquear selección de padre (solo sueltas)
                    if (isPlanSoloSueltas && v !== "") {
                      showSnackbar(
                        reasonHierarchy ||
                          "🔒 Plan Negocio: solo categorías sueltas (sin padre y sin hijas).",
                        "warning"
                      );
                      return;
                    }

                    setForm((p) => ({ ...p, parent_id: v }));
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 280,
                        overflowY: "auto",
                        "&::-webkit-scrollbar": { width: 8 },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: "rgba(0,0,0,0.25)",
                          borderRadius: 8,
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: "rgba(0,0,0,0.06)",
                          borderRadius: 8,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>NO (Se queda suelta) 📄</em>
                  </MenuItem>

                  {parentOptions
                    .filter((p) => p.id !== form.editingId)
                    .map((p) => (
                      <MenuItem
                        key={p.id}
                        value={p.id}
                        disabled={isPlanSoloSueltas}
                      >
                        🗂️ {p.name} {isPlanSoloSueltas ? "🔒" : ""}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Box>
                {modo === "SUELTA" ? (
                  <Chip label="📄 Se guardará como suelta" variant="outlined" />
                ) : (
                  <Chip
                    label={
                      isPlanSoloSueltas
                        ? "🔒 Hija bloqueada en Plan Negocio"
                        : "👶 Se guardará como hija"
                    }
                    variant="outlined"
                    color={isPlanSoloSueltas ? "warning" : "default"}
                  />
                )}
              </Box>

              <Stack
                direction="row"
                gap={1}
                sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={resetForm}
                  disabled={formLoading}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Limpiar
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={formLoading}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  {form.editingId ? "Actualizar ✨" : "Guardar ✅"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </DialogContent>

        {!isMobile && (
          <DialogActions>
            <Button onClick={closeForm} disabled={formLoading}>
              Cerrar
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* HELP MODAL */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>🧠 ¿Cómo funciona esto?</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>Versión para humano sin dolor:</Typography>

          <Stack gap={1.2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={900}>🗂️ Padre</Typography>
              <Typography variant="body2" color="text.secondary">
                Categoría que puede tener hijas.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={900}>👶 Hija</Typography>
              <Typography variant="body2" color="text.secondary">
                Vive dentro de un padre.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={900}>📄 Suelta</Typography>
              <Typography variant="body2" color="text.secondary">
                No vive dentro de nadie.
              </Typography>
            </Paper>
          </Stack>

          {!isPlanSoloSueltas ? null : (
            <>
              <Divider sx={{ my: 2 }} />
              <Alert
                severity="warning"
                sx={{ borderRadius: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={openPlanesModal}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    Ver planes
                  </Button>
                }
              >
                Plan {planId || "?"}: solo categorías sueltas. Jerarquía bloqueada.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} variant="contained">
            Entendido ✅
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>🗑️ Eliminar</DialogTitle>
        <DialogContent>
          Vas a borrar: <b>{deleteDialog.name}</b>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Si borras un padre con hijas, el backend puede “soltarlas” (parent_id =
            null). En ese caso refrescamos una vez.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, name: "" })}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={formLoading}
          >
            Eliminar 🧨
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
    </Container>
  );
};

export default Category;
