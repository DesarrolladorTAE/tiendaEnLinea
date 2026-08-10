import React from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#fff",

    "&:hover fieldset": {
      borderColor: BRAND.orange,
    },

    "&.Mui-focused fieldset": {
      borderColor: BRAND.orange,
    },
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: BRAND.orange,
  },
};

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(BRAND.orange, 0.09),
          color: BRAND.orange,

          "& svg": {
            fontSize: 23,
          },
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          variant="h6"
          fontWeight={900}
          sx={{
            letterSpacing: "-.02em",
          }}
        >
          {title}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.25,
            fontSize: 14,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function PlanGeneralTab({
  plan,
  onChange,
}) {
  return (
    <Stack spacing={3}>
      {/* INFORMACIÓN GENERAL */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3,
              },
            },
          }}
        >
          <SectionHeader
            icon={<SettingsRoundedIcon />}
            title="Información general"
            description="Configura cómo se identifica y se presenta el plan."
          />

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2.5,
            }}
          >
            <TextField
              label="Nombre interno"
              value={plan.name || ""}
              onChange={(event) =>
                onChange(
                  "name",
                  event.target.value
                )
              }
              fullWidth
              required
              helperText="Ejemplo: negocio"
              sx={fieldSx}
            />

            <TextField
              label="Nombre visible"
              value={plan.display_name || ""}
              onChange={(event) =>
                onChange(
                  "display_name",
                  event.target.value
                )
              }
              fullWidth
              required
              helperText="Ejemplo: Plan Negocio"
              sx={fieldSx}
            />

            <TextField
              label="Subtítulo"
              value={plan.subtitle || ""}
              onChange={(event) =>
                onChange(
                  "subtitle",
                  event.target.value
                )
              }
              fullWidth
              placeholder="Ideal para negocios en crecimiento"
              sx={fieldSx}
            />

            <TextField
              label="Badge"
              value={plan.badge || ""}
              onChange={(event) =>
                onChange(
                  "badge",
                  event.target.value
                )
              }
              fullWidth
              placeholder="Más popular"
              sx={fieldSx}
            />

            <TextField
              label="Icono"
              value={plan.icon || ""}
              onChange={(event) =>
                onChange(
                  "icon",
                  event.target.value
                )
              }
              fullWidth
              placeholder="store"
              helperText="Identificador o nombre del icono usado para el plan."
              sx={fieldSx}
            />

            <TextField
              label="Días de prueba"
              type="number"
              value={plan.trial_days ?? 0}
              onChange={(event) =>
                onChange(
                  "trial_days",
                  event.target.value
                )
              }
              fullWidth
              inputProps={{
                min: 0,
              }}
              sx={fieldSx}
            />

            <TextField
              select
              label="Estilo del plan"
              value={
                plan.background_style ||
                "light"
              }
              onChange={(event) =>
                onChange(
                  "background_style",
                  event.target.value
                )
              }
              fullWidth
              sx={fieldSx}
            >
              <MenuItem value="light">
                Claro
              </MenuItem>

              <MenuItem value="dark">
                Oscuro
              </MenuItem>

              <MenuItem value="featured">
                Destacado
              </MenuItem>

              <MenuItem value="gradient">
                Gradiente
              </MenuItem>
            </TextField>

            <TextField
              label="Orden"
              type="number"
              value={plan.sort_order ?? 0}
              onChange={(event) =>
                onChange(
                  "sort_order",
                  event.target.value
                )
              }
              fullWidth
              inputProps={{
                min: 0,
              }}
              helperText="Menor número = mayor prioridad."
              sx={fieldSx}
            />

            <TextField
              label="Descripción"
              value={plan.description || ""}
              onChange={(event) =>
                onChange(
                  "description",
                  event.target.value
                )
              }
              fullWidth
              multiline
              minRows={4}
              placeholder="Describe brevemente para qué tipo de negocio está pensado este plan."
              sx={{
                ...fieldSx,

                gridColumn: {
                  xs: "auto",
                  md: "1 / -1",
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ACCIÓN DEL PLAN */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3,
              },
            },
          }}
        >
          <SectionHeader
            icon={<CampaignRoundedIcon />}
            title="Acción del plan"
            description="Configura el botón principal que verá el usuario."
          />

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(220px, .7fr) minmax(0, 1.3fr)",
              },

              gap: 2.5,
            }}
          >
            <TextField
              label="Texto del botón"
              value={plan.button_text || ""}
              onChange={(event) =>
                onChange(
                  "button_text",
                  event.target.value
                )
              }
              fullWidth
              placeholder="Más información"
              sx={fieldSx}
            />

            <TextField
              label="URL del botón"
              value={plan.button_url || ""}
              onChange={(event) =>
                onChange(
                  "button_url",
                  event.target.value
                )
              }
              fullWidth
              placeholder="/registro"
              helperText="Puede ser una ruta interna o una URL completa."
              sx={fieldSx}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ESTADO Y VISIBILIDAD */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3,
              },
            },
          }}
        >
          <SectionHeader
            icon={<VisibilityRoundedIcon />}
            title="Estado y visibilidad"
            description="Controla dónde puede mostrarse este plan y si está disponible para contratación."
          />

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <VisibilityOption
              title="Plan activo"
              description="Permite utilizar y contratar este plan."
              checked={Boolean(
                plan.is_active
              )}
              onChange={(checked) =>
                onChange(
                  "is_active",
                  checked
                )
              }
              chip={
                plan.is_active
                  ? "Activo"
                  : "Inactivo"
              }
            />

            <VisibilityOption
              title="Plan destacado"
              description="Da mayor prioridad visual al plan."
              checked={Boolean(
                plan.is_featured
              )}
              onChange={(checked) =>
                onChange(
                  "is_featured",
                  checked
                )
              }
              chip={
                plan.is_featured
                  ? "Destacado"
                  : "Normal"
              }
            />

            <VisibilityOption
              title="Mostrar en landing"
              description="Hace visible el plan en el sitio público."
              checked={Boolean(
                plan.show_on_landing
              )}
              onChange={(checked) =>
                onChange(
                  "show_on_landing",
                  checked
                )
              }
              chip={
                plan.show_on_landing
                  ? "Visible"
                  : "Oculto"
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* RESUMEN */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,

          border:
            "1px solid rgba(255,90,31,.18)",

          bgcolor:
            alpha(BRAND.orange, 0.025),
        }}
      >
        <CardContent
          sx={{
            p: 2.5,

            "&:last-child": {
              pb: 2.5,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(
                  BRAND.amber,
                  0.18
                ),
                color: "#9a5d00",
              }}
            >
              <TuneRoundedIcon />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={900}>
                Resumen de configuración
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.25,
                }}
              >
                Los cambios realizados en esta sección se
                guardarán cuando presiones el botón Guardar
                del encabezado.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                label={
                  plan.is_active
                    ? "Activo"
                    : "Inactivo"
                }
                sx={{
                  fontWeight: 800,
                }}
              />

              {plan.is_featured && (
                <Chip
                  size="small"
                  label="Destacado"
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(
                      BRAND.amber,
                      0.2
                    ),
                  }}
                />
              )}

              {plan.show_on_landing && (
                <Chip
                  size="small"
                  label="Landing"
                  sx={{
                    fontWeight: 800,
                  }}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function VisibilityOption({
  title,
  description,
  checked,
  onChange,
  chip,
}) {
  return (
    <Box
      sx={{
        p: 2,

        borderRadius: 3,

        border: "1px solid",

        borderColor: checked
          ? alpha(BRAND.orange, 0.35)
          : "divider",

        bgcolor: checked
          ? alpha(BRAND.orange, 0.035)
          : "#fff",

        transition:
          "all .2s ease",

        "&:hover": {
          borderColor: alpha(
            BRAND.orange,
            0.45
          ),
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1}
      >
        <Box>
          <Typography
            fontWeight={900}
            fontSize={14}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        </Box>

        <Switch
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked
            )
          }
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked":
              {
                color:
                  BRAND.orange,
              },

            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
              {
                bgcolor:
                  BRAND.orange,
              },
          }}
        />
      </Stack>

      <Chip
        size="small"
        label={chip}
        sx={{
          mt: 2,

          height: 24,

          fontSize: 11,

          fontWeight: 800,

          bgcolor: checked
            ? alpha(
                BRAND.orange,
                0.1
              )
            : "#f3f4f6",

          color: checked
            ? BRAND.orange
            : "text.secondary",
        }}
      />
    </Box>
  );
}