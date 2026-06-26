import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import AppleIcon from "@mui/icons-material/Apple";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";

import { appVersionService } from "../../services/superadmin/appVersionService";
import AppVersionFormDialog from "../../components/superadmin/AppVersionFormDialog";

import {
  showSuccess,
  showConfirm,
  alertFromAxiosError,
} from "../../utils/alerts";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
  soft: "#fff7ed",
};

const initialForm = {
  app_id: "",
  version: "",
  platform: "android",
  release_date: "",
  notes: "",
  is_active: true,
  printer_type_ids: [],
  file: null,
};

const platforms = [
  {
    value: "android",
    label: "Android",
    icon: <AndroidRoundedIcon fontSize="small" />,
  },
  { value: "ios", label: "iOS", icon: <AppleIcon fontSize="small" /> },
  {
    value: "windows",
    label: "Windows",
    icon: <DesktopWindowsRoundedIcon fontSize="small" />,
  },
  {
    value: "macos",
    label: "macOS",
    icon: <LaptopMacRoundedIcon fontSize="small" />,
  },
];

function formatSize(bytes) {
  if (!bytes) return "Sin archivo";
  const mb = Number(bytes) / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getPlatformMeta(value) {
  return platforms.find((p) => p.value === value) || platforms[0];
}

export default function AppVersionsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [apps, setApps] = useState([]);
  const [printerTypes, setPrinterTypes] = useState([]);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    app_id: "",
    platform: "",
    page: 1,
    per_page: 10,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const selectedFileName = useMemo(() => form.file?.name || "", [form.file]);

  const loadCatalogs = async () => {
    const res = await appVersionService.getCatalogs();
    setApps(res.data.apps || []);
    setPrinterTypes(res.data.printer_types || []);
  };

  const loadItems = async () => {
    try {
      setLoading(true);

      const res = await appVersionService.getAll(filters);
      const paginator = res.data.data;

      setItems(paginator.data || []);
      setPagination({
        current_page: paginator.current_page || 1,
        last_page: paginator.last_page || 1,
        total: paginator.total || 0,
      });
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las versiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filters]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(item);

    setForm({
      app_id: item.app_id || item.app?.id || "",
      version: item.version || "",
      platform: item.platform || "android",
      release_date: item.release_date?.substring(0, 10) || "",
      notes: item.notes || "",
      is_active: Boolean(item.is_active),
      printer_type_ids: item.printer_types?.map((p) => p.id) || [],
      file: null,
    });

    setOpen(true);
  };

  const handleClose = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTogglePrinterType = (id) => {
    setForm((prev) => {
      const exists = prev.printer_type_ids.includes(id);

      return {
        ...prev,
        printer_type_ids: exists
          ? prev.printer_type_ids.filter((x) => x !== id)
          : [...prev.printer_type_ids, id],
      };
    });
  };

  const buildFormData = () => {
    const fd = new FormData();

    fd.append("app_id", form.app_id);
    fd.append("version", form.version);
    fd.append("platform", form.platform);
    fd.append("is_active", form.is_active ? "1" : "0");

    if (form.release_date) fd.append("release_date", form.release_date);
    if (form.notes) fd.append("notes", form.notes);

    form.printer_type_ids.forEach((id) => {
      fd.append("printer_type_ids[]", id);
    });

    if (form.file) {
      fd.append("file", form.file);
    }

    return fd;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const fd = buildFormData();

      if (editing) {
        await appVersionService.update(editing.id, fd);
        await showSuccess("La versión se actualizó correctamente.");
      } else {
        await appVersionService.create(fd);
        await showSuccess("La versión se registró correctamente.");
      }

      handleClose();
      loadItems();
    } catch (error) {
      console.error(error);
      alertFromAxiosError(error, "No se pudo guardar la versión.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm(
      `¿Eliminar la versión ${item.version} de ${item.app?.name || "la app"}?`,
      "Sí, eliminar",
    );

    if (!ok) return;

    try {
      await appVersionService.delete(item.id);
      await showSuccess("La versión se eliminó correctamente.");
      loadItems();
    } catch (error) {
      console.error(error);
      alertFromAxiosError(error, "No se pudo eliminar la versión.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        p: { xs: 2, md: 3 },
        background:
          "radial-gradient(circle at top left, rgba(255,181,46,.12), transparent 32%), linear-gradient(180deg, #fff 0%, #fafafa 100%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 5,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, #151515 0%, #232323 55%, #2b1b10 100%)",
          color: "#fff",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -70,
            top: -70,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,181,46,.22)",
          }}
        />

        <CardContent sx={{ p: { xs: 3, md: 4 }, position: "relative" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={3}
          >
            <Box>
              <Chip
                icon={<AppsRoundedIcon />}
                label="Panel superadmin"
                size="small"
                sx={{
                  mb: 1.5,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,.12)",
                  border: "1px solid rgba(255,255,255,.18)",
                }}
              />

              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-.03em",
                  fontSize: { xs: 28, md: 36 },
                  color: "rgba(255,255,255,.72)",
                }}
              >
                Versiones de aplicaciones
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "rgba(255,255,255,.72)",
                  maxWidth: 720,
                }}
              >
                Administra APK, instaladores y versiones disponibles para punto
                de venta.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1.2,
                bgcolor: BRAND.amber,
                color: BRAND.dark,
                fontWeight: 900,
                boxShadow: "0 14px 34px rgba(255,181,46,.28)",
                "&:hover": {
                  bgcolor: "#ffc14d",
                },
              }}
            >
              Nueva versión
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 16px 50px rgba(15,23,42,.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "2fr 1.4fr 1.2fr 1fr",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label="Buscar versión o notas"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
            />

            <TextField
              select
              fullWidth
              label="App"
              value={filters.app_id}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  app_id: e.target.value,
                  page: 1,
                }))
              }
            >
              <MenuItem value="">Todas las apps</MenuItem>
              {apps.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  {app.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Plataforma"
              value={filters.platform}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  platform: e.target.value,
                  page: 1,
                }))
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {platforms.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Mostrar"
              value={filters.per_page}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  per_page: Number(e.target.value),
                  page: 1,
                }))
              }
            >
              <MenuItem value={10}>10 registros</MenuItem>
              <MenuItem value={25}>25 registros</MenuItem>
              <MenuItem value={50}>50 registros</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress sx={{ color: BRAND.orange }} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Cargando versiones...
          </Typography>
        </Stack>
      ) : items.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          No hay versiones registradas.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => {
            const platform = getPlatformMeta(item.platform);

            return (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: ".2s ease",
                  boxShadow: "0 12px 35px rgba(15,23,42,.05)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 18px 55px rgba(15,23,42,.09)",
                    borderColor: alpha(BRAND.orange, 0.35),
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          color: BRAND.orange,
                          bgcolor: alpha(BRAND.orange, 0.1),
                          border: `1px solid ${alpha(BRAND.orange, 0.16)}`,
                          flexShrink: 0,
                        }}
                      >
                        {platform.icon}
                      </Box>

                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            label={item.app?.name || "Sin app"}
                            size="small"
                            sx={{
                              bgcolor: BRAND.dark,
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          />

                          <Chip
                            label={platform.label}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />

                          <Chip
                            label={item.is_active ? "Activa" : "Inactiva"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: item.is_active
                                ? alpha("#16a34a", 0.12)
                                : alpha("#64748b", 0.12),
                              color: item.is_active ? "#15803d" : "#475569",
                            }}
                          />
                        </Stack>

                        <Typography variant="h6" fontWeight={900}>
                          Versión {item.version}
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.notes || "Sin notas de versión"}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 1.5 }}
                        >
                          {item.printer_types?.length > 0 ? (
                            item.printer_types.map((printer) => (
                              <Chip
                                key={printer.id}
                                label={printer.name}
                                variant="outlined"
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  bgcolor: "#fff",
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Sin tipo de impresora"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1.5,
                            color: "text.secondary",
                          }}
                        >
                          Archivo:{" "}
                          <Box
                            component="span"
                            fontWeight={700}
                            color="text.primary"
                          >
                            {item.file_name || "No cargado"}
                          </Box>{" "}
                          — {formatSize(item.file_size)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent={{ xs: "flex-end", md: "center" }}
                    >
                      {item.file_url && (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadRoundedIcon />}
                          href={item.file_url}
                          target="_blank"
                          sx={{
                            borderRadius: 999,
                            fontWeight: 800,
                            borderColor: alpha(BRAND.orange, 0.35),
                            color: BRAND.orange,
                            "&:hover": {
                              borderColor: BRAND.orange,
                              bgcolor: alpha(BRAND.orange, 0.06),
                            },
                          }}
                        >
                          Archivo
                        </Button>
                      )}

                      <IconButton
                        onClick={() => handleOpenEdit(item)}
                        sx={{
                          color: BRAND.orange,
                          bgcolor: alpha(BRAND.orange, 0.08),
                          "&:hover": {
                            bgcolor: alpha(BRAND.orange, 0.14),
                          },
                        }}
                      >
                        <EditRoundedIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDelete(item)}
                        sx={{
                          color: "#dc2626",
                          bgcolor: alpha("#dc2626", 0.08),
                          "&:hover": {
                            bgcolor: alpha("#dc2626", 0.14),
                          },
                        }}
                      >
                        <DeleteRoundedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

          <Stack alignItems="center" sx={{ pt: 2 }}>
            <Pagination
              count={pagination.last_page}
              page={pagination.current_page}
              onChange={(_, page) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                }))
              }
              sx={{
                "& .Mui-selected": {
                  bgcolor: `${BRAND.orange} !important`,
                  color: "#fff",
                  fontWeight: 900,
                },
              }}
            />
          </Stack>
        </Stack>
      )}

      <AppVersionFormDialog
        open={open}
        editing={editing}
        form={form}
        apps={apps}
        platforms={platforms}
        printerTypes={printerTypes}
        saving={saving}
        onClose={handleClose}
        onChange={handleChange}
        onTogglePrinterType={handleTogglePrinterType}
        onSave={handleSave}
      />
      
    </Box>
  );
}
