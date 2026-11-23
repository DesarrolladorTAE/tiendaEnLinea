import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
  OutlinedInput,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import RestrictionAlert from "./RestrictionAlert";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const EMPTY_WORKER = {
  id: null,
  branch_id: "",
  pos_location_id: "",
  work_area_ids: [],
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address: "",
  position: "",
  entry_time: "",
  exit_time: "",
  hire_date: "",
  rfc: "",
  fiscal_name: "",
  fiscal_postal_code: "",
  fiscal_regime: "",
  curp: "",
  notes: "",
  is_active: true,
  profile_photo: null,
  profile_photo_url: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

const sxBtnOutlined = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  borderColor: alpha("#000", 0.15),
  color: COLORS.black,
  bgcolor: "#fff",
  "&:hover": { bgcolor: alpha("#000", 0.03) },
};

const sxBtnBlack = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  bgcolor: COLORS.black,
  color: "#fff",
  "&:hover": { bgcolor: alpha(COLORS.black, 0.86) },
};

function Section({ title, subtitle, icon, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: COLORS.paper,
        border: `1px solid ${alpha("#000", 0.08)}`,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={0.6} sx={{ mb: 1.4 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon ? (
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                bgcolor: alpha(COLORS.accent, 0.18),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}

          <Typography sx={{ fontWeight: 950, fontSize: 14 }}>
            {title}
          </Typography>
        </Stack>

        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={1.2}>{children}</Stack>
    </Paper>
  );
}

function ImagePreviewCard({ url }) {
  const hasImage = Boolean(url);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: "#fff",
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={url || ""}
          sx={{
            width: 90,
            height: 90,
            border: `3px solid ${alpha(COLORS.accent, 0.35)}`,
            flexShrink: 0,
          }}
        >
          <BadgeRoundedIcon />
        </Avatar>

        <Stack spacing={0.7} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Vista previa de la foto
          </Typography>

          <Typography variant="caption" color="text.secondary">
            La imagen se mostrará como avatar principal del trabajador.
          </Typography>

        </Stack>
      </Stack>
    </Paper>
  );
}

export default function WorkerDialog({
  open,
  onClose,
  canManage,
  nombrePlanActual,
  branchId,
  row,
  onSaved,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState(EMPTY_WORKER);
  const [saving, setSaving] = useState(false);

  const [posLocations, setPosLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (row) {
      setForm({
        id: row?.id || null,
        branch_id: row?.branch_id || branchId || "",
        pos_location_id: row?.pos_location_id || "",
        work_area_ids: Array.isArray(row?.work_areas)
          ? row.work_areas.map((item) => item.id)
          : [],
        first_name: row?.first_name || "",
        last_name: row?.last_name || "",
        phone: row?.phone || "",
        email: row?.email || "",
        address: row?.address || "",
        position: row?.position || "",
        entry_time: row?.entry_time || "",
        exit_time: row?.exit_time || "",
        hire_date: row?.hire_date || "",
        rfc: row?.rfc || "",
        fiscal_name: row?.fiscal_name || "",
        fiscal_postal_code: row?.fiscal_postal_code || "",
        fiscal_regime: row?.fiscal_regime || "",
        curp: row?.curp || "",
        notes: row?.notes || "",
        is_active: typeof row?.is_active === "boolean" ? row.is_active : true,
        profile_photo: null,
        profile_photo_url: row?.profile_photo || "",
      });
    } else {
      setForm({
        ...EMPTY_WORKER,
        branch_id: branchId || "",
      });
    }
  }, [open, row, branchId]);

  useEffect(() => {
    if (!open || !branchId) return;

    let cancelled = false;

    const fetchCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [posRes, areasRes] = await Promise.all([
          axiosClient.get("/pos-locations/simple", {
            params: { branch_id: branchId },
          }),
          axiosClient.get("/work-areas/simple", {
            params: { branch_id: branchId },
          }),
        ]);

        const posList = Array.isArray(posRes?.data?.data)
          ? posRes.data.data
          : [];
        const areasList = Array.isArray(areasRes?.data?.data)
          ? areasRes.data.data
          : [];

        if (!cancelled) {
          setPosLocations(posList);
          setAreas(areasList);
        }
      } catch (err) {
        if (!cancelled) {
          setPosLocations([]);
          setAreas([]);
        }
        alertFromAxiosError(err, "No se pudieron cargar puntos de venta y áreas");
      } finally {
        if (!cancelled) {
          setLoadingCatalogs(false);
        }
      }
    };

    fetchCatalogs();

    return () => {
      cancelled = true;
    };
  }, [open, branchId]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({
      ...prev,
      profile_photo: file,
      profile_photo_url: file ? URL.createObjectURL(file) : prev.profile_photo_url,
    }));
  };

  const filteredAreas = useMemo(() => {
    return areas;
  }, [areas]);

  const selectedAreaNames = useMemo(() => {
    return filteredAreas
      .filter((item) => form.work_area_ids.includes(item.id))
      .map((item) => item.name || `Área #${item.id}`);
  }, [filteredAreas, form.work_area_ids]);

  const handleSubmit = async () => {
    if (!canManage || saving) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("branch_id", form.branch_id || "");
      formData.append("pos_location_id", form.pos_location_id || "");
      formData.append("first_name", form.first_name || "");
      formData.append("last_name", form.last_name || "");
      formData.append("phone", form.phone || "");
      formData.append("email", form.email || "");
      formData.append("address", form.address || "");
      formData.append("position", form.position || "");
      formData.append("entry_time", form.entry_time || "");
      formData.append("exit_time", form.exit_time || "");
      formData.append("hire_date", form.hire_date || "");
      formData.append("rfc", form.rfc || "");
      formData.append("fiscal_name", form.fiscal_name || "");
      formData.append("fiscal_postal_code", form.fiscal_postal_code || "");
      formData.append("fiscal_regime", form.fiscal_regime || "");
      formData.append("curp", form.curp || "");
      formData.append("notes", form.notes || "");
      formData.append("is_active", form.is_active ? "1" : "0");

      form.work_area_ids.forEach((id) => {
        formData.append("work_area_ids[]", id);
      });

      if (form.profile_photo) {
        formData.append("profile_photo", form.profile_photo);
      }

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      const { data } = form.id
        ? await axiosClient.post(`/workers/${form.id}?_method=PUT`, formData, config)
        : await axiosClient.post(`/workers`, formData, config);

      await showSuccess(form.id ? "Trabajador actualizado" : "Trabajador creado");
      onSaved(data?.data || data);
      onClose();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar el trabajador");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          border: fullScreen ? "none" : `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <PersonRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
              {form.id ? "Editar trabajador" : "Nuevo trabajador"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registra datos personales, laborales, fiscales y foto de perfil.
            </Typography>
          </Box>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={1.5}>
          {!canManage ? (
            <RestrictionAlert nombrePlanActual={nombrePlanActual} />
          ) : null}

          <Section
            title="Foto de perfil"
            subtitle="Sube una imagen para identificar visualmente al trabajador."
            icon={<ImageRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <ImagePreviewCard url={form.profile_photo_url} />

            <Button
              component="label"
              startIcon={<ImageRoundedIcon />}
              variant="outlined"
              sx={{
                ...sxBtnOutlined,
                justifyContent: "flex-start",
              }}
              disabled={!canManage || saving}
            >
              Seleccionar foto
              <input hidden type="file" accept="image/*" onChange={handleFile} />
            </Button>
          </Section>

          <Section
            title="Asignación y estatus"
            subtitle="Puedes dejar el trabajador sin punto de venta y sin áreas."
            icon={<StorefrontRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Punto de venta</InputLabel>
              <Select
                label="Punto de venta"
                value={form.pos_location_id}
                onChange={(e) => handleChange("pos_location_id", e.target.value)}
                disabled={loadingCatalogs}
              >
                <MenuItem value="">Sin punto de venta</MenuItem>
                {posLocations.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name || `Punto #${item.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Áreas</InputLabel>
              <Select
                multiple
                value={form.work_area_ids}
                onChange={(e) => handleChange("work_area_ids", e.target.value)}
                input={<OutlinedInput label="Áreas" />}
                disabled={loadingCatalogs}
                renderValue={(selected) => {
                  if (!selected?.length) {
                    return "Sin áreas";
                  }

                  const names = filteredAreas
                    .filter((item) => selected.includes(item.id))
                    .map((item) => item.name || `Área #${item.id}`);

                  return (
                    <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap" }}>
                      {names.map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Box>
                  );
                }}
              >
                {filteredAreas.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name || `Área #${item.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!!selectedAreaNames.length ? (
              <Typography variant="caption" color="text.secondary">
                Áreas seleccionadas: {selectedAreaNames.join(", ")}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No hay áreas seleccionadas
              </Typography>
            )}

            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Estatus</InputLabel>
              <Select
                label="Estatus"
                value={form.is_active ? 1 : 0}
                onChange={(e) =>
                  handleChange("is_active", Number(e.target.value) === 1)
                }
              >
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </Select>
            </FormControl>

            {loadingCatalogs ? (
              <Typography variant="caption" color="text.secondary">
                Cargando puntos de venta y áreas...
              </Typography>
            ) : null}
          </Section>

          <Section
            title="Información general"
            subtitle="Datos principales del trabajador."
            icon={<BusinessCenterRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label="Nombre(s)"
              fullWidth
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Apellidos"
              fullWidth
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Teléfono"
              fullWidth
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <PhoneIphoneRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />

            <TextField
              label="Correo electrónico"
              fullWidth
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <EmailRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />

            <TextField
              label="Puesto"
              fullWidth
              value={form.position}
              onChange={(e) => handleChange("position", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Dirección"
              fullWidth
              multiline
              minRows={2}
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, mt: 1, alignSelf: "flex-start" }}>
                    <HomeRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />
          </Section>

          <Section
            title="Horario y fechas"
            subtitle="Asigna horario de entrada, salida y fecha de ingreso."
            icon={<AccessTimeRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label="Hora de entrada"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.entry_time}
              onChange={(e) => handleChange("entry_time", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Hora de salida"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.exit_time}
              onChange={(e) => handleChange("exit_time", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Fecha de ingreso"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.hire_date}
              onChange={(e) => handleChange("hire_date", e.target.value)}
              sx={fieldSx}
            />
          </Section>

          <Section
            title="Información fiscal"
            subtitle="Datos fiscales opcionales del trabajador."
            icon={<ReceiptLongRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label="RFC"
              fullWidth
              value={form.rfc}
              onChange={(e) => handleChange("rfc", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Razón social"
              fullWidth
              value={form.fiscal_name}
              onChange={(e) => handleChange("fiscal_name", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Código postal fiscal"
              fullWidth
              value={form.fiscal_postal_code}
              onChange={(e) => handleChange("fiscal_postal_code", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="Régimen fiscal"
              fullWidth
              value={form.fiscal_regime}
              onChange={(e) => handleChange("fiscal_regime", e.target.value)}
              sx={fieldSx}
            />

            <TextField
              label="CURP"
              fullWidth
              value={form.curp}
              onChange={(e) => handleChange("curp", e.target.value)}
              sx={fieldSx}
            />
          </Section>

          <Section
            title="Notas internas"
            subtitle="Observaciones adicionales del trabajador."
            icon={<NotesRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label="Notas"
              fullWidth
              multiline
              minRows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              sx={fieldSx}
            />
          </Section>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          startIcon={<CloseRoundedIcon />}
          variant="outlined"
          sx={sxBtnOutlined}
        >
          Cerrar
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handleSubmit}
          disabled={!canManage || saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
          }
          variant="contained"
          sx={sxBtnBlack}
        >
          {saving
            ? form.id
              ? "Actualizando..."
              : "Guardando..."
            : form.id
            ? "Actualizar"
            : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}