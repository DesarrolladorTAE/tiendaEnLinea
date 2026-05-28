import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";

import axiosClient from "../../config/axiosClient";
import { toast } from "react-hot-toast";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const EMPTY_SUPPLIER = {
  name: "",
  rfc: "",
  phone: "",
  email: "",
  contact_name: "",
  address: "",
  notes: "",
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

export default function SupplierModal({ open, onClose, branchId, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_SUPPLIER);
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Ingrese el nombre del proveedor.");
      return;
    }

    try {
      setSaving(true);

      const { data } = await axiosClient.post("/restocks/suppliers", {
        ...form,
        branch_id: branchId,
      });

      toast.success("Proveedor creado correctamente");

      onSaved?.(data?.supplier);
      onClose?.();
      resetForm();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "No se pudo crear el proveedor."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : handleClose}
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
            <LocalShippingRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 1000,
                fontSize: 18,
                lineHeight: 1.1,
              }}
            >
              Nuevo proveedor
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Registra los datos principales, fiscales y de contacto del
              proveedor.
            </Typography>
          </Box>

          <IconButton onClick={handleClose} disabled={saving}>
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
          <Section
            title="Información general"
            subtitle="Datos principales para identificar al proveedor."
            icon={
              <BusinessRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />
            }
          >
            <TextField
              label="Nombre del proveedor"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              fullWidth
              sx={fieldSx}
            />

            <TextField
              label="Contacto"
              value={form.contact_name}
              onChange={(e) => setField("contact_name", e.target.value)}
              fullWidth
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <PersonRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />
          </Section>

          <Section
            title="Datos fiscales"
            subtitle="Información fiscal opcional del proveedor."
            icon={
              <ReceiptLongRoundedIcon
                sx={{ fontSize: 17, color: COLORS.black }}
              />
            }
          >
            <TextField
              label="RFC"
              value={form.rfc}
              onChange={(e) => setField("rfc", e.target.value)}
              fullWidth
              sx={fieldSx}
            />
          </Section>

          <Section
            title="Contacto"
            subtitle="Medios para comunicarse con el proveedor."
            icon={
              <PhoneIphoneRoundedIcon
                sx={{ fontSize: 17, color: COLORS.black }}
              />
            }
          >
            <TextField
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              fullWidth
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
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              fullWidth
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <EmailRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />
          </Section>

          <Section
            title="Ubicación"
            subtitle="Dirección o referencia del proveedor."
            icon={
              <HomeRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />
            }
          >
            <TextField
              label="Dirección"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              fullWidth
              multiline
              minRows={2}
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
            title="Notas internas"
            subtitle="Observaciones adicionales para uso administrativo."
            icon={
              <NotesRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />
            }
          >
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              fullWidth
              multiline
              minRows={3}
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
          onClick={handleClose}
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
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
          sx={sxBtnBlack}
        >
          {saving ? "Guardando..." : "Guardar proveedor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}