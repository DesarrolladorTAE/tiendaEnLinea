// src/pages/admin/PublicidadAdmin.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Divider,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ImageIcon from "@mui/icons-material/Image";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import LinkIcon from "@mui/icons-material/Link";
import axiosClient from "../../config/axiosClient";
import { showError, showSuccess } from "../../utils/alerts";

const TIPOS = ["Principal", "Login"];

// Helpers de media
const isImageUrl = (u) => /\.(png|jpe?g|gif|webp|avif)$/i.test(u || "");
const isVideoUrl = (u) => /\.(mp4|webm|ogg)$/i.test(u || "");
const isMediaUrl = (u) => isImageUrl(u) || isVideoUrl(u);

export default function PublicidadAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadProgressRef = useRef(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "Principal",
    url: "",
    is_active: true,
  });

  const filtrados = useMemo(() => {
    if (filtroTipo === "Todos") return items;
    return items.filter((i) => i.tipo === filtroTipo);
  }, [items, filtroTipo]);

  const fetchPublicidad = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/admin/publicidad");
      setItems(data || []);
    } catch {
      showError("No se pudo cargar la lista de publicidad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicidad();
  }, []);

  const resetForm = () => {
    setForm({
      titulo: "",
      descripcion: "",
      tipo: "Principal",
      url: "",
      is_active: true,
    });
    setFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    uploadProgressRef.current = 0;
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      titulo: row.titulo || "",
      descripcion: row.descripcion || "",
      tipo: row.tipo,
      url: row.url || "",
      is_active: row.is_active,
    });
    setFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditing(null);
    resetForm();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    // Para imágenes y videos, podemos generar URL local
    if (f && (f.type?.startsWith("image/") || f.type?.startsWith("video/"))) {
      const localUrl = URL.createObjectURL(f);
      setPreviewUrl(localUrl);
    } else {
      setPreviewUrl("");
    }
  };

  // Guardar (crea/actualiza) con soporte de archivo
  const handleSave = async () => {
    try {
      setUploading(true);

      if (file) {
        const fd = new FormData();
        if (form.titulo) fd.append("titulo", form.titulo);
        if (form.descripcion) fd.append("descripcion", form.descripcion);
        if (form.tipo) fd.append("tipo", form.tipo);
        fd.append("is_active", form.is_active ? "1" : "0");
        fd.append("file", file);

        const axiosCfg = {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            const p = Math.round((ev.loaded * 100) / ev.total);
            uploadProgressRef.current = p;
            setUploadProgress(p);
          },
        };

        if (editing) {
          await axiosClient.put(`/admin/publicidad/${editing.id}`, fd, axiosCfg);
          showSuccess("Banner actualizado.");
        } else {
          await axiosClient.post(`/admin/publicidad`, fd, axiosCfg);
          showSuccess("Banner creado.");
        }
      } else {
        // Sin archivo: JSON normal (necesita URL si no hay file)
        if (!form.url.trim()) {
          setUploading(false);
          return showError("Sube un archivo o ingresa una URL.");
        }
        if (!TIPOS.includes(form.tipo)) {
          setUploading(false);
          return showError("Selecciona un tipo válido.");
        }

        if (editing) {
          await axiosClient.put(`/admin/publicidad/${editing.id}`, form);
          showSuccess("Banner actualizado.");
        } else {
          await axiosClient.post(`/admin/publicidad`, form);
          showSuccess("Banner creado.");
        }
      }

      closeForm();
      fetchPublicidad();
    } catch (e) {
      showError(e?.response?.data?.message || "Ocurrió un error al guardar.");
    } finally {
      setUploading(false);
    }
  };

  // Toggle activo/inactivo
  const handleToggleActive = async (row) => {
    try {
      const goingActive = !row.is_active;
      await axiosClient.put(`/admin/publicidad/${row.id}`, {
        ...row,
        is_active: goingActive,
      });

      setItems((prev) =>
        prev.map((it) => (it.id === row.id ? { ...it, is_active: goingActive } : it))
      );
    } catch {
      showError("No se pudo cambiar el estado.");
    }
  };

  const handleDelete = async (row) => {
    try {
      await axiosClient.delete(`/admin/publicidad/${row.id}`);
      showSuccess("Banner eliminado.");
      fetchPublicidad();
    } catch {
      showError("No se pudo eliminar.");
    }
  };

  return (
    <Box className="p-4 md:p-6">
      <Card className="shadow-lg rounded-2xl border border-neutral-800/20 bg-[#0b0f1a]">
        <CardHeader
          titleTypographyProps={{ sx: { fontWeight: 700, color: "#fff" } }}
          title="Gestión de Banners (Publicidad)"
          subheader="Administra los banners para la portada (Principal) y el inicio de sesión (Login)."
          subheaderTypographyProps={{ sx: { color: "rgba(255,255,255,0.85)" } }}
          sx={{
            color: "white",
            background:
              "linear-gradient(135deg, rgba(16,24,39,1) 0%, rgba(23,37,84,1) 50%, rgba(15,23,42,1) 100%)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            pb: 2,
          }}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Refrescar">
                <IconButton onClick={fetchPublicidad} color="inherit">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nuevo banner">
                <IconButton onClick={openCreate} color="inherit">
                  <AddCircleIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <CardContent sx={{ background: "linear-gradient(180deg, #0b0f1a 0%, #0a0f1f 100%)" }}>
          {/* Filtros */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              mb: 2,
            }}
          >
            <Chip
              icon={<FilterAltIcon />}
              label="Filtro por tipo:"
              variant="outlined"
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
            />
            {["Todos", ...TIPOS].map((t) => (
              <Chip
                key={t}
                label={t}
                onClick={() => setFiltroTipo(t)}
                variant={filtroTipo === t ? "filled" : "outlined"}
                sx={{
                  color: filtroTipo === t ? "#0b0f1a" : "#fff",
                  bgcolor: filtroTipo === t ? "#67e8f9" : "transparent",
                  borderColor: "rgba(255,255,255,0.2)",
                  "&:hover": { bgcolor: filtroTipo === t ? "#5eead4" : "rgba(255,255,255,0.06)" },
                }}
              />
            ))}
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

          {/* Tabla */}
          <Box sx={{ overflowX: "auto" }}>
            <table className="min-w-full border-separate border-spacing-y-8">
              <thead>
                <tr className="text-left text-sm uppercase tracking-wider text-white">
                  <th className="px-3">Banner</th>
                  <th className="px-3">Título</th>
                  <th className="px-3">Descripción</th>
                  <th className="px-3">Tipo</th>
                  <th className="px-3">URL</th>
                  <th className="px-3">Activo</th>
                  <th className="px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-white/70">
                      Cargando…
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-white/70">
                      No hay banners registrados.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-[#0f1629] hover:bg-[#111a33] transition-all duration-200 rounded-xl"
                    >
                      {/* Mini media (imagen o video) */}
                      <td className="px-3 py-3">
                        <Box
                          sx={{
                            width: 120,
                            height: 68,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "#0b0f1a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {row.url ? (
                            isImageUrl(row.url) ? (
                              <img
                                src={row.url}
                                alt={row.titulo || "banner"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : isVideoUrl(row.url) ? (
                              <video
                                src={row.url}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                muted
                                loop
                                playsInline
                              />
                            ) : (
                              <ImageIcon sx={{ opacity: 0.7, color: "#fff" }} />
                            )
                          ) : (
                            <ImageIcon sx={{ opacity: 0.7, color: "#fff" }} />
                          )}
                        </Box>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                          {row.titulo || "—"}
                        </Typography>
                      </td>

                      <td className="px-3 py-3 max-w-[420px] align-top">
                        <Typography
                          sx={{
                            color: "#fff",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {row.descripcion || "—"}
                        </Typography>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <Chip
                          label={row.tipo}
                          size="small"
                          sx={{
                            color: "#0b0f1a",
                            bgcolor: row.tipo === "Principal" ? "#93c5fd" : "#a7f3d0",
                            fontWeight: 700,
                          }}
                        />
                      </td>

                      <td className="px-3 py-3 align-top">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            maxWidth: 420,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <LinkIcon fontSize="small" sx={{ color: "#fff" }} />
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate"
                            style={{ color: "#fff" }}
                          >
                            {row.url}
                          </a>
                        </Box>
                      </td>

                      <td className="px-3 py-3">
                        <Switch
                          checked={row.is_active}
                          onChange={() => handleToggleActive(row)}
                          color="success"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <Tooltip title="Editar">
                            <IconButton onClick={() => openEdit(row)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              onClick={() => handleDelete(row)}
                              color="error"
                              sx={{ bgcolor: "rgba(239,68,68,0.08)" }}
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={openForm} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "#000000ff" }}>
          {editing ? "Editar banner" : "Nuevo banner"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2.5, py: 1 }}>
            <TextField
              label="Título (opcional)"
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            >
              {TIPOS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            {/* Subir archivo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" disabled={uploading}>
                {file ? "Cambiar archivo" : "Subir archivo"}
                <input
                  type="file"
                  hidden
                  accept="image/*,video/mp4,video/webm,video/ogg"
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {file ? file.name : "Opcional: puedes subir un archivo o pegar una URL"}
              </Typography>
            </Box>

            {/* URL pegada (opcional) */}
            <TextField
              label="URL de la imagen / video"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              fullWidth
              placeholder="https://tusitio.com/archivos/banner.mp4"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                color="success"
              />
              <Typography>Activo</Typography>
            </Box>

            {uploading && (
              <Box sx={{ width: "100%" }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Subiendo… {uploadProgress}%
                </Typography>
              </Box>
            )}

            {/* Previsualización universal (imagen o video) */}
            <Box>
              <Typography variant="caption">Previsualización</Typography>
              <Box
                sx={{
                  mt: 1,
                  width: "100%",
                  height: 220,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.02)",
                }}
              >
                {file ? (
                  file.type.startsWith("image/") ? (
                    <img
                      src={previewUrl || URL.createObjectURL(file)}
                      alt="preview-local-img"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : file.type.startsWith("video/") ? (
                    <video
                      src={previewUrl || URL.createObjectURL(file)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      controls
                      playsInline
                    />
                  ) : (
                    <Box sx={{ textAlign: "center", opacity: 0.9 }}>
                      <ImageIcon />
                      <Typography variant="body2">
                        Archivo no soportado para vista previa.
                      </Typography>
                    </Box>
                  )
                ) : form.url && isMediaUrl(form.url) ? (
                  isImageUrl(form.url) ? (
                    <img
                      src={form.url}
                      alt="preview-url-img"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <video
                      src={form.url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      controls
                      playsInline
                    />
                  )
                ) : (
                  <Box sx={{ textAlign: "center", opacity: 0.9 }}>
                    <ImageIcon />
                    <Typography variant="body2">
                      Sube una imagen/video o pega una URL de imagen/video para ver la vista previa.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeForm} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={uploading}>
            {editing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
