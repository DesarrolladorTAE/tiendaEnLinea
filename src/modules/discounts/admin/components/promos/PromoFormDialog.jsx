import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  TextField,
  MenuItem,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

import HelpInstructionsDialog from "./HelpInstructionsDialog";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

function Section({ title, subtitle, children }) {
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
      <Stack spacing={0.4} sx={{ mb: 1.2 }}>
        <Typography sx={{ fontWeight: 950, fontSize: 14 }}>{title}</Typography>
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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

export function PromoFormDialog({
  open = false,
  onClose = () => { },
  editing = false,
  form = {},
  setForm,
  onSave,
  saving = false,
  imgPreview = "",
  imgUploading = false,
  onPickImage,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [openHelp, setOpenHelp] = useState(false);

  const discountType = form?.discount_type || "percentage";

  const discountTypeLabel =
    discountType === "percentage"
      ? "Porcentaje"
      : discountType === "fixed"
        ? "Monto fijo"
        : discountType === "special_price"
          ? "Precio especial"
          : discountType === "bulk"
            ? "Mayoreo"
            : discountType === "bxgy"
              ? "2x1 / 3x2"
              : discountType === "combo"
                ? "Combo"
                : "Descuento";

  const isAdvancedType =
    discountType === "bulk" || discountType === "bxgy" || discountType === "combo";

  const helpSections = useMemo(
    () => [
      {
        title: "¿Qué hace este formulario?",
        items: [
          "Aquí creas la promoción y defines sus datos principales.",
          "Después podrás decir a qué productos, categorías o variantes aplica.",
          "La imagen y las reglas se manejan por separado, pero desde el mismo módulo.",
        ],
      },
      {
        title: "Datos básicos",
        items: [
          "Nombre: es el título que usarás para identificar la promoción.",
          "Slug: es una versión corta del nombre. Si lo dejas vacío, el sistema lo genera.",
          "Descripción: sirve para anotar cómo funciona o para qué la hiciste.",
        ],
      },
      {
        title: "Tipo de descuento",
        items: [
          "Porcentaje: descuenta un porcentaje del precio.",
          "Monto fijo: descuenta una cantidad exacta en pesos.",
          "Precio especial: reemplaza el precio final por otro precio.",
          "Mayoreo, combo y 2x1 / 3x2 son tipos avanzados que normalmente luego ocupan configuración adicional.",
        ],
      },
      {
        title: "Fechas y condiciones",
        items: [
          "Fecha de inicio y fecha de fin controlan cuándo estará activa.",
          "Prioridad decide cuál promoción se evalúa primero si varias coinciden.",
          "Compra mínima, piezas mínimas y tope máximo ayudan a poner condiciones.",
        ],
      },
      {
        title: "Opciones de estado",
        items: [
          "Promoción activa: si está apagada, no funcionará.",
          "Permitir combinar: deja que esta promo trabaje junto con otras, si tu lógica lo permite.",
        ],
      },
      {
        title: "Imagen",
        items: [
          "La imagen es opcional.",
          "Puedes elegirla antes de guardar.",
          "Se sube cuando se guarda la promoción.",
        ],
      },
    ],
    []
  );

  const updateField = (key, value) => {
    setForm?.((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Dialog
        open={Boolean(open)}
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
              <LocalOfferRoundedIcon sx={{ color: COLORS.black }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
                {editing ? "Editar promoción" : "Nueva promoción"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configura el nombre, tipo de descuento, fechas, imagen y estado.
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton onClick={() => setOpenHelp(true)} disabled={saving}>
                <HelpOutlineRoundedIcon />
              </IconButton>

              <IconButton onClick={onClose} disabled={saving}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            bgcolor: COLORS.softBg,
            p: { xs: 1.5, sm: 2 },
          }}
        >
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={8}>
              <Stack spacing={1.5}>
                <Section
                  title="Datos básicos"
                  subtitle="Información principal para identificar la promoción."
                >
                  <TextField
                    label="Nombre de la promoción"
                    value={form?.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    fullWidth
                    disabled={saving}
                    sx={fieldSx}
                    placeholder="Ejemplo: Oferta fin de semana"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalOfferRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Slug (opcional)"
                    value={form?.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    helperText="Si lo dejas vacío, el sistema lo genera automáticamente."
                    fullWidth
                    disabled={saving}
                    sx={fieldSx}
                    placeholder="oferta-fin-semana"
                  />

                  <TextField
                    label="Descripción"
                    value={form?.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    disabled={saving}
                    sx={fieldSx}
                    placeholder="Explica brevemente en qué consiste la promoción."
                  />
                </Section>

                <Section
                  title="Tipo de descuento"
                  subtitle="Define cómo se aplicará el beneficio."
                >
                  <Grid container spacing={1.2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Tipo de descuento"
                        value={discountType}
                        onChange={(e) => updateField("discount_type", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PercentRoundedIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="percentage">Porcentaje (%)</MenuItem>
                        <MenuItem value="fixed">Monto fijo ($)</MenuItem>
                        <MenuItem value="special_price">Precio especial</MenuItem>
                        <MenuItem value="bulk">Mayoreo</MenuItem>
                        <MenuItem value="bxgy">2x1 / 3x2</MenuItem>
                        <MenuItem value="combo">Combo</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      {discountType === "special_price" ? (
                        <TextField
                          label="Precio especial"
                          value={form?.special_price || ""}
                          onChange={(e) => updateField("special_price", e.target.value)}
                          fullWidth
                          disabled={saving}
                          sx={fieldSx}
                          placeholder="Ejemplo: 99"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoneyRoundedIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          helperText="Este será el precio final que pagará el cliente."
                        />
                      ) : (
                        <TextField
                          label={
                            discountType === "percentage"
                              ? "Porcentaje de descuento"
                              : "Monto de descuento"
                          }
                          value={form?.discount_value || ""}
                          onChange={(e) => updateField("discount_value", e.target.value)}
                          fullWidth
                          disabled={saving || isAdvancedType}
                          sx={fieldSx}
                          placeholder={
                            discountType === "percentage" ? "Ejemplo: 10" : "Ejemplo: 50"
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {discountType === "percentage" ? (
                                  <PercentRoundedIcon fontSize="small" />
                                ) : (
                                  <AttachMoneyRoundedIcon fontSize="small" />
                                )}
                              </InputAdornment>
                            ),
                          }}
                          helperText={
                            isAdvancedType
                              ? `Tipo seleccionado: ${discountTypeLabel}. Este tipo normalmente requiere configuración adicional.`
                              : `Tipo seleccionado: ${discountTypeLabel}`
                          }
                        />
                      )}
                    </Grid>
                  </Grid>

                  {isAdvancedType ? (
                    <Alert
                      severity="info"
                      icon={<InfoRoundedIcon />}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: alpha("#000", 0.03),
                        border: `1px solid ${alpha("#000", 0.08)}`,
                      }}
                    >
                      Elegiste <b>{discountTypeLabel}</b>. Tu backend lo acepta, pero normalmente este tipo
                      de promoción necesita reglas o configuración adicional para funcionar correctamente.
                    </Alert>
                  ) : null}
                </Section>

                <Section
                  title="Fechas y condiciones"
                  subtitle="Puedes limitar cuándo aplica y qué requisitos debe cumplir."
                >
                  <Grid container spacing={1.2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Fecha de inicio (opcional)"
                        type="datetime-local"
                        value={form?.starts_at || ""}
                        onChange={(e) => updateField("starts_at", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthRoundedIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Fecha de fin (opcional)"
                        type="datetime-local"
                        value={form?.ends_at || ""}
                        onChange={(e) => updateField("ends_at", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={1.2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Prioridad"
                        value={form?.priority ?? ""}
                        onChange={(e) => updateField("priority", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        placeholder="Ejemplo: 100"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SortRoundedIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="Entre menor número, primero se revisa esta promoción."
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Compra mínima (subtotal)"
                        value={form?.min_subtotal || ""}
                        onChange={(e) => updateField("min_subtotal", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        placeholder="Ejemplo: 300"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoneyRoundedIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Cantidad mínima de piezas"
                        value={form?.min_qty || ""}
                        onChange={(e) => updateField("min_qty", e.target.value)}
                        fullWidth
                        disabled={saving}
                        sx={fieldSx}
                        placeholder="Ejemplo: 2"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Inventory2RoundedIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Tope máximo de descuento (opcional)"
                    value={form?.max_discount_amount || ""}
                    onChange={(e) => updateField("max_discount_amount", e.target.value)}
                    fullWidth
                    disabled={saving}
                    sx={fieldSx}
                    placeholder="Ejemplo: 200"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pt: 0.5 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${alpha("#000", 0.08)}`,
                        bgcolor: "#fff",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!form?.is_active}
                            onChange={(e) => updateField("is_active", e.target.checked)}
                          />
                        }
                        label="Promoción activa"
                      />
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${alpha("#000", 0.08)}`,
                        bgcolor: "#fff",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!form?.stackable}
                            onChange={(e) => updateField("stackable", e.target.checked)}
                          />
                        }
                        label="Permitir combinar con otras promociones"
                      />
                    </Paper>
                  </Stack>
                </Section>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Section
                title="Imagen"
                subtitle="Puedes agregar una imagen para identificar mejor la promoción."
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 260,
                    borderRadius: 3,
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    bgcolor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1.5,
                  }}
                >
                  {imgPreview ? (
                    <Box
                      component="img"
                      src={imgPreview}
                      alt="Vista previa promoción"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={1} sx={{ opacity: 0.7 }}>
                      <ImageRoundedIcon />
                      <Typography variant="caption">Sin imagen</Typography>
                    </Stack>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  component="label"
                  startIcon={<ImageRoundedIcon />}
                  disabled={saving || imgUploading}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    borderColor: alpha("#000", 0.18),
                    color: COLORS.black,
                    bgcolor: "#fff",
                    justifyContent: "flex-start",
                    "&:hover": { bgcolor: alpha("#000", 0.03) },
                  }}
                >
                  Elegir imagen
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage?.(e.target.files?.[0] || null)}
                  />
                </Button>

                {imgUploading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="caption">Subiendo imagen...</Typography>
                  </Stack>
                ) : null}

                <Alert
                  severity="info"
                  icon={<InfoRoundedIcon />}
                  sx={{
                    width: "100%",
                    borderRadius: 2.5,
                    bgcolor: alpha("#000", 0.03),
                    border: `1px solid ${alpha("#000", 0.08)}`,
                  }}
                >
                  La imagen se sube al guardar la promoción.
                </Alert>
              </Section>
            </Grid>
          </Grid>
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
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              borderColor: alpha("#000", 0.15),
              color: COLORS.black,
              bgcolor: "#fff",
              "&:hover": { bgcolor: alpha("#000", 0.03) },
            }}
          >
            Cancelar
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={onSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : <DoneRoundedIcon />}
            variant="contained"
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 950,
              bgcolor: COLORS.black,
              px: 2.2,
              "&:hover": { bgcolor: alpha(COLORS.black, 0.88) },
            }}
          >
            {saving ? "Guardando..." : "Guardar promoción"}
          </Button>
        </DialogActions>
      </Dialog>

      <HelpInstructionsDialog
        open={openHelp}
        onClose={() => setOpenHelp(false)}
        title="Cómo funciona una promoción"
        subtitle="Aquí te explicamos cada parte con palabras sencillas."
        sections={helpSections}
      />
    </>
  );
}