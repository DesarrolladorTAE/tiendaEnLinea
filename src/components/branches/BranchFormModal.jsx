import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import axiosClient from "../../config/axiosClient";
import { showSuccess, alertFromAxiosError } from "../../utils/alerts";

const COLORS = { accent: "#f9b233", black: "#000000", danger: "#e94e1b" };

export default function BranchFormModal({
  open,
  mode = "create", // "create" | "edit"
  storeId,
  branch,
  onClose,
  onSaved,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    is_active: true,
    address_line1: "",
    address_line2: "",
    neighborhood: "",
    city: "",
    state: "",
    postal_code: "",
    country: "MX",
    lat: "",
    lng: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && branch) {
      setForm({
        name: branch?.name ?? "",
        code: branch?.code ?? "",
        phone: branch?.phone ?? "",
        email: branch?.email ?? "",
        is_active: branch?.is_active ?? true,

        address_line1: branch?.address_line1 ?? "",
        address_line2: branch?.address_line2 ?? "",
        neighborhood: branch?.neighborhood ?? "",
        city: branch?.city ?? "",
        state: branch?.state ?? "",
        postal_code: branch?.postal_code ?? "",
        country: branch?.country ?? "MX",
        lat: branch?.lat ?? "",
        lng: branch?.lng ?? "",
        notes: branch?.notes ?? "",
      });
    } else {
      setForm((p) => ({
        ...p,
        name: "",
        code: "",
        phone: "",
        email: "",
        is_active: true,
        address_line1: "",
        address_line2: "",
        neighborhood: "",
        city: "",
        state: "",
        postal_code: "",
        country: "MX",
        lat: "",
        lng: "",
        notes: "",
      }));
    }
  }, [open, isEdit, branch]);

  const title = useMemo(() => (isEdit ? "Editar sucursal" : "Nueva sucursal"), [isEdit]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        store_id: storeId ?? null,
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };

      if (isEdit) {
        await axiosClient.put(`/branches/${branch.id}`, payload);
        await showSuccess("Sucursal actualizada");
      } else {
        await axiosClient.post(`/branches`, payload);
        await showSuccess("Sucursal creada");
      }

      onSaved?.();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar la sucursal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          border: `1px solid ${alpha("#000", 0.08)}`,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack>
          <Typography sx={{ fontWeight: 900, color: COLORS.black }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Completa lo básico y la dirección (todo puede ir en blanco).
          </Typography>
        </Stack>

        <IconButton onClick={onClose} disabled={saving} sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Nombre" value={form.name} onChange={set("name")} fullWidth />
            <TextField label="Código" value={form.code} onChange={set("code")} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Teléfono" value={form.phone} onChange={set("phone")} fullWidth />
            <TextField label="Email" value={form.email} onChange={set("email")} fullWidth />
          </Stack>

          <Divider />

          <Typography sx={{ fontWeight: 900, color: COLORS.black }}>Dirección</Typography>

          <TextField label="Calle y número" value={form.address_line1} onChange={set("address_line1")} fullWidth />
          <TextField label="Interior / referencias" value={form.address_line2} onChange={set("address_line2")} fullWidth />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Colonia" value={form.neighborhood} onChange={set("neighborhood")} fullWidth />
            <TextField label="Ciudad" value={form.city} onChange={set("city")} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Estado" value={form.state} onChange={set("state")} fullWidth />
            <TextField label="CP" value={form.postal_code} onChange={set("postal_code")} fullWidth />
            <TextField label="País" value={form.country} onChange={set("country")} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Lat" value={form.lat} onChange={set("lat")} fullWidth />
            <TextField label="Lng" value={form.lng} onChange={set("lng")} fullWidth />
          </Stack>

          <TextField
            label="Notas"
            value={form.notes}
            onChange={set("notes")}
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving} variant="text" sx={{ textTransform: "none" }}>
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} /> : <SaveRoundedIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            bgcolor: COLORS.black,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
            borderRadius: 2,
            minWidth: 180,
          }}
        >
          {saving ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
