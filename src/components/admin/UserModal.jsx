import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  alpha,
  useMediaQuery,
  Box,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocalPhoneRoundedIcon from "@mui/icons-material/LocalPhoneRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

const MotionDialog = motion(Dialog);
const MotionPaper = motion(Paper);

const dialogAnim = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};

const sheetAnim = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const btnMotion = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
};

const blank = {
  name: "",
  apellidos: "",
  email: "",
  phone: "",
  role: "usuario",
  ganancias: 0,
};

const UserModal = ({ open, handleClose, handleSubmit, modo, initialData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // ✅ sheet
  const isEdit = modo === "editar";

  const [formData, setFormData] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setLocalError("");
    if (isEdit && initialData) {
      setFormData({
        ...blank,
        ...initialData,
        ganancias: Number(initialData?.ganancias ?? 0),
      });
    } else {
      setFormData(blank);
    }
  }, [isEdit, initialData, open]);

  const title = useMemo(() => {
    return isEdit ? "Editar usuario" : "Crear usuario";
  }, [isEdit]);

  const subtitle = useMemo(() => {
    return isEdit
      ? "Actualiza datos. Email y teléfono quedan bloqueados."
      : "Crea un usuario con rol y ganancia asignada.";
  }, [isEdit]);

  const stopAutoFill = {
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: "false",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: cleaned }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "ganancias" ? Number(value) : value,
    }));
  };

  const validate = () => {
    if (!formData.name.trim()) return "El nombre es obligatorio.";
    if (!formData.apellidos.trim()) return "Los apellidos son obligatorios.";

    if (!isEdit && !formData.email.trim()) return "El email es obligatorio.";
    if (!isEdit && !formData.phone.trim()) return "El teléfono es obligatorio.";
    if (!isEdit && formData.phone.trim().length !== 10)
      return "El teléfono debe tener 10 dígitos.";

    if (Number.isNaN(Number(formData.ganancias)) || Number(formData.ganancias) < 0)
      return "La ganancia debe ser un número mayor o igual a 0.";

    return "";
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }
    try {
      setSaving(true);
      setLocalError("");
      await handleSubmit(formData);
    } catch (_) {
      // toast ya se dispara afuera
    } finally {
      setSaving(false);
    }
  };

  const headerIcon = isEdit ? <EditRoundedIcon /> : <AddRoundedIcon />;

  // ✅ Estilo premium inputs (más “app-like”)
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: alpha(theme.palette.background.paper, 0.7),
      transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
      "&:hover": { boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.08)}` },
      "&.Mui-focused": { boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.18)}` },
    },
  };

  // ==========================
  // ✅ MOBILE: Bottom Sheet UI
  // ==========================
  if (isMobile) {
    return (
      <Dialog
        open={open}
        onClose={saving ? undefined : handleClose}
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-end",
          },
        }}
        PaperProps={{
          sx: {
            width: "100%",
            m: 0,
            borderRadius: "22px 22px 0 0",
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            boxShadow: `0 -14px 50px ${alpha(theme.palette.common.black, 0.22)}`,
            background: `
              radial-gradient(800px 240px at 15% 0%, ${alpha(
                theme.palette.primary.main,
                0.18
              )} 0%, transparent 60%),
              ${theme.palette.background.paper}
            `,
          },
        }}
      >
        <MotionPaper
          variants={sheetAnim}
          initial="hidden"
          animate={open ? "show" : "hidden"}
          elevation={0}
          sx={{ bgcolor: "transparent" }}
        >
          {/* Handle */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.1 }}>
            <Box
              sx={{
                width: 44,
                height: 5,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, 0.18),
              }}
            />
          </Box>

          {/* Header sticky */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              px: 2,
              pt: 1.2,
              pb: 1.2,
              backdropFilter: "blur(10px)",
              backgroundColor: alpha(theme.palette.background.paper, 0.72),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                  }}
                >
                  {headerIcon}
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                    {title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {subtitle}
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                onClick={handleClose}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={isEdit ? "Modo edición" : "Modo creación"}
                sx={{ borderRadius: 999, fontWeight: 900 }}
              />
              <Chip
                size="small"
                label={`Rol: ${formData.role}`}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }}
              />
            </Stack>
          </Box>

          {/* Body */}
          <DialogContent
            sx={{
              px: 2,
              pt: 2,
              pb: 12, // espacio para footer sticky
            }}
          >
            {localError ? (
              <Alert
                severity="warning"
                variant="outlined"
                sx={{ borderRadius: 3, mb: 2, fontWeight: 800 }}
              >
                {localError}
              </Alert>
            ) : null}

            {/* Sección 1 */}
            <Paper
              elevation={0}
              sx={{
                p: 1.6,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
                mb: 1.4,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>Datos personales</Typography>

              <Stack spacing={1.2}>
                <TextField
                  label="Nombre"
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={stopAutoFill}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Apellidos"
                  fullWidth
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={stopAutoFill}
                  sx={fieldSx}
                />
              </Stack>
            </Paper>

            {/* Sección 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 1.6,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
                mb: 1.4,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>Contacto</Typography>

              <Stack spacing={1.2}>
                <TextField
                  label="Email"
                  fullWidth
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEdit}
                  autoComplete="new-email"
                  inputProps={{ ...stopAutoFill, inputMode: "email" }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Teléfono"
                  fullWidth
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isEdit}
                  autoComplete="new-password"
                  inputProps={{
                    ...stopAutoFill,
                    maxLength: 10,
                    inputMode: "numeric",
                  }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalPhoneRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText={isEdit ? "En edición se bloquea por seguridad." : "10 dígitos."}
                />
              </Stack>
            </Paper>

            {/* Sección 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 1.6,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>Permisos & comisiones</Typography>

              <Stack spacing={1.2}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Rol"
                    sx={{
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <ShieldRoundedIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="usuario">Usuario</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">SuperAdmin</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Ganancia (%)"
                  fullWidth
                  name="ganancias"
                  type="number"
                  value={formData.ganancias}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={{
                    ...stopAutoFill,
                    step: "0.1",
                    min: "0",
                    inputMode: "decimal",
                  }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Paper>
          </DialogContent>

          {/* Footer sticky */}
          <Box
            sx={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              p: 1.6,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
              backdropFilter: "blur(12px)",
              backgroundColor: alpha(theme.palette.background.paper, 0.78),
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={handleClose}
                disabled={saving}
                fullWidth
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 950,
                  border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
                }}
              >
                Cancelar
              </Button>

              <Button
                component={motion.button}
                {...btnMotion}
                onClick={onSubmit}
                disabled={saving}
                fullWidth
                variant="contained"
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 950,
                  boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.28)}`,
                }}
              >
                {saving ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
              </Button>
            </Stack>
          </Box>
        </MotionPaper>
      </Dialog>
    );
  }

  // ==========================
  // ✅ DESKTOP: Premium modal (2 columnas)
  // ==========================
  return (
    <MotionDialog
      open={open}
      onClose={saving ? undefined : handleClose}
      fullWidth
      maxWidth="md"
      variants={dialogAnim}
      initial="hidden"
      animate={open ? "show" : "hidden"}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          background: `
            radial-gradient(1200px 380px at 18% 0%, ${alpha(
              theme.palette.primary.main,
              0.16
            )} 0%, transparent 60%),
            ${theme.palette.background.paper}
          `,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            >
              {headerIcon}
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            disabled={saving}
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
          <Chip
            size="small"
            label={isEdit ? "Modo edición" : "Modo creación"}
            sx={{ borderRadius: 999, fontWeight: 900 }}
          />
          <Chip
            size="small"
            label={`Rol: ${formData.role}`}
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          />
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.2 }}>
        {localError ? (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ borderRadius: 3, mb: 2, fontWeight: 800 }}
          >
            {localError}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          {/* Columna izquierda */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>
                Datos personales
              </Typography>

              <Stack spacing={1.2}>
                <TextField
                  label="Nombre"
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={stopAutoFill}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Apellidos"
                  fullWidth
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={stopAutoFill}
                  sx={fieldSx}
                />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
                mt: 2,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>
                Contacto
              </Typography>

              <Stack spacing={1.2}>
                <TextField
                  label="Email"
                  fullWidth
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEdit}
                  autoComplete="new-email"
                  inputProps={{ ...stopAutoFill, inputMode: "email" }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Teléfono"
                  fullWidth
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isEdit}
                  autoComplete="new-password"
                  inputProps={{
                    ...stopAutoFill,
                    maxLength: 10,
                    inputMode: "numeric",
                  }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalPhoneRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText={isEdit ? "En edición se bloquea por seguridad." : "10 dígitos."}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Columna derecha */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1 }}>
                Permisos & comisiones
              </Typography>

              <Stack spacing={1.2}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Rol"
                    sx={{
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <ShieldRoundedIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="usuario">Usuario</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">SuperAdmin</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Ganancia (%)"
                  fullWidth
                  name="ganancias"
                  type="number"
                  value={formData.ganancias}
                  onChange={handleChange}
                  autoComplete="off"
                  inputProps={{
                    ...stopAutoFill,
                    step: "0.1",
                    min: "0",
                    inputMode: "decimal",
                  }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentRoundedIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <Divider sx={{ my: 1 }} />

                <Box
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.info.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, mb: 0.3 }}>
                    Nota
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Para mantener integridad de cuentas, en edición el email y teléfono quedan bloqueados.
                    Si ocupas editar esos campos, lo habilitamos con un flujo seguro.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
        >
          Cancelar
        </Button>

        <Button
          component={motion.button}
          {...btnMotion}
          onClick={onSubmit}
          disabled={saving}
          variant="contained"
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 950,
            px: 2.4,
            boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.26)}`,
          }}
        >
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
};

export default UserModal;