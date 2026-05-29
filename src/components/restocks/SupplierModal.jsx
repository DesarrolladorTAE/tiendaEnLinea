// src/components/restocks/SupplierModal.jsx
import React, { useEffect, useState } from "react";
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
  Divider,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import axiosClient from "../../config/axiosClient";
import {
  showError,
  showConfirm,
  showToastSuccess,
  alertFromAxiosError,
} from "../../utils/alerts";

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

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Stack spacing={1.2}>{children}</Stack>
    </Paper>
  );
}

export default function SupplierModal({ open, onClose, branchId, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingId);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_SUPPLIER);
    setEditingId(null);
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      const { data } = await axiosClient.get("/restocks/suppliers", {
        params: {
          branch_id: branchId,
        },
      });

      const list = Array.isArray(data)
        ? data
        : data?.suppliers || data?.data || [];

      setSuppliers(list);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar los proveedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadSuppliers();
  }, [open, branchId]);

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose?.();
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name || "",
      rfc: supplier.rfc || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      contact_name: supplier.contact_name || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showError("Ingrese el nombre del proveedor.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        branch_id: branchId,
      };

      if (isEditing) {
        await axiosClient.put(`/restocks/suppliers/${editingId}`, payload);
        showToastSuccess("Proveedor actualizado correctamente");
      } else {
        await axiosClient.post("/restocks/suppliers", payload);
        showToastSuccess("Proveedor creado correctamente");
      }

      onSaved?.();
      resetForm();
      await loadSuppliers();
    } catch (err) {
      alertFromAxiosError(
        err,
        "No se pudo guardar la información del proveedor."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const ok = await showConfirm(
      `¿Desea eliminar el proveedor "${supplier.name}"?`,
      "Sí, eliminar"
    );

    if (!ok) return;

    try {
      await axiosClient.delete(`/restocks/suppliers/${supplier.id}`);

      showToastSuccess("Proveedor eliminado correctamente");

      if (editingId === supplier.id) resetForm();

      await loadSuppliers();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar el proveedor.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        if (saving) return;
        handleClose();
      }}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          height: fullScreen ? "100dvh" : "90vh",
          maxHeight: fullScreen ? "100dvh" : "90vh",
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
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
          flexShrink: 0,
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

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
              Proveedores
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Registre, edite, consulte y elimine proveedores.
            </Typography>
          </Box>

          <IconButton onClick={handleClose} disabled={saving}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            height: "100%",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "45%" },
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: COLORS.paper,
                border: `1px solid ${alpha("#000", 0.08)}`,
                p: 2,
                mb: 1.5,
                flexShrink: 0,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950 }}>
                    {isEditing ? "Editar proveedor" : "Nuevo proveedor"}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {isEditing
                      ? "Modifique los datos del proveedor seleccionado."
                      : "Complete los datos para registrar un proveedor."}
                  </Typography>
                </Box>

                {isEditing && (
                  <Button
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={resetForm}
                    sx={sxBtnOutlined}
                  >
                    Nuevo
                  </Button>
                )}
              </Stack>
            </Paper>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pr: 0.5,
                pb: 1,
              }}
            >
              <Stack spacing={1.5}>
                <Section
                  title="Información general"
                  subtitle="Datos principales para identificar al proveedor."
                  icon={
                    <BusinessRoundedIcon
                      sx={{ fontSize: 17, color: COLORS.black }}
                    />
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
                        <Box sx={{ mr: 1, display: "flex" }}>
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
                  />

                  <TextField
                    label="Correo electrónico"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    fullWidth
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "flex" }}>
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
                    <HomeRoundedIcon
                      sx={{ fontSize: 17, color: COLORS.black }}
                    />
                  }
                >
                  <TextField
                    label="Dirección"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={fieldSx}
                  />
                </Section>

                <Section
                  title="Notas internas"
                  subtitle="Observaciones adicionales para uso administrativo."
                  icon={
                    <NotesRoundedIcon
                      sx={{ fontSize: 17, color: COLORS.black }}
                    />
                  }
                >
                  <TextField
                    label="Notas"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                    sx={fieldSx}
                  />
                </Section>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", md: "55%" },
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: COLORS.paper,
                border: `1px solid ${alpha("#000", 0.08)}`,
                overflow: "hidden",
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 2,
                  flexShrink: 0,
                  bgcolor: COLORS.paper,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950 }}>
                    Listado de proveedores
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    La lista queda fija y puede desplazarse con scroll.
                  </Typography>
                </Box>

                <Button
                  onClick={loadSuppliers}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                  sx={sxBtnOutlined}
                >
                  Recargar
                </Button>
              </Stack>

              <Divider />

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  p: 1.5,
                  bgcolor: "#fff",
                }}
              >
                {loading ? (
                  <Stack alignItems="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Cargando proveedores...
                    </Typography>
                  </Stack>
                ) : suppliers.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: `1px dashed ${alpha("#000", 0.2)}`,
                      p: 3,
                      textAlign: "center",
                      bgcolor: alpha("#000", 0.02),
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      No hay proveedores registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cuando registre proveedores aparecerán aquí.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.2}>
                    {suppliers.map((supplier) => (
                      <Paper
                        key={supplier.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          border: `1px solid ${
                            editingId === supplier.id
                              ? COLORS.accent
                              : alpha("#000", 0.08)
                          }`,
                          bgcolor:
                            editingId === supplier.id
                              ? alpha(COLORS.accent, 0.08)
                              : "#fff",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.2}
                          alignItems={{ xs: "stretch", sm: "center" }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 950 }}>
                              {supplier.name}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {supplier.contact_name || "Sin contacto"} ·{" "}
                              {supplier.phone || "Sin teléfono"}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              RFC: {supplier.rfc || "N/A"} · Correo:{" "}
                              {supplier.email || "N/A"}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<EditRoundedIcon />}
                              onClick={() => handleEdit(supplier)}
                              sx={sxBtnOutlined}
                            >
                              Editar
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteRoundedIcon />}
                              onClick={() => handleDelete(supplier)}
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 900,
                              }}
                            >
                              Eliminar
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          gap: 1,
          flexShrink: 0,
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
          {saving
            ? "Guardando..."
            : isEditing
              ? "Actualizar proveedor"
              : "Guardar proveedor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}