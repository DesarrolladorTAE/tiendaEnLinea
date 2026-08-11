import React, {
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

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

const emptyFeature = {
  category_id: "",
  name: "",
  description: "",
  icon: "",
  value_type: "boolean",
  sort_order: 0,
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getFeatureStatus = (feature) => {
  return (
    feature?.configuration?.status ||
    feature?.status ||
    "not_included"
  );
};

const getFeatureValue = (feature) => {
  return (
    feature?.configuration?.value ??
    feature?.value ??
    ""
  );
};

const isFeatureIncluded = (feature) => {
  const status = getFeatureStatus(feature);

  return (
    status === "included" ||
    status === "limited"
  );
};

export default function PlanFeaturesTab({
  categories = [],
  onChange,
  onCreateFeature,
  creatingFeature = false,
}) {
  const [openCreate, setOpenCreate] =
    useState(false);

  const [newFeature, setNewFeature] =
    useState(emptyFeature);

  /*
  |--------------------------------------------------------------------------
  | Resumen
  |--------------------------------------------------------------------------
  */

  const total = useMemo(
    () =>
      categories.reduce(
        (sum, category) =>
          sum +
          (category.features?.length || 0),
        0
      ),
    [categories]
  );

  const included = useMemo(
    () =>
      categories.reduce(
        (sum, category) =>
          sum +
          (category.features || []).filter(
            (feature) =>
              isFeatureIncluded(feature)
          ).length,
        0
      ),
    [categories]
  );

  /*
  |--------------------------------------------------------------------------
  | Modal
  |--------------------------------------------------------------------------
  */

  const handleOpenCreate = () => {
    setNewFeature({
      ...emptyFeature,

      category_id:
        categories?.[0]?.id || "",
    });

    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    if (creatingFeature) {
      return;
    }

    setOpenCreate(false);

    setNewFeature(
      emptyFeature
    );
  };

  const handleNewFeatureChange = (
    field,
    value
  ) => {
    setNewFeature((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!onCreateFeature) {
      return;
    }

    const payload = {
      category_id: Number(
        newFeature.category_id
      ),

      name:
        newFeature.name.trim(),

      description:
        newFeature.description?.trim() ||
        null,

      icon:
        newFeature.icon?.trim() ||
        null,

      value_type:
        newFeature.value_type,

      sort_order: Number(
        newFeature.sort_order || 0
      ),

      is_active: Boolean(
        newFeature.is_active
      ),
    };

    const success =
      await onCreateFeature(
        payload
      );

    if (success !== false) {
      setOpenCreate(false);

      setNewFeature(
        emptyFeature
      );
    }
  };

  const canCreate =
    Boolean(
      newFeature.category_id
    ) &&
    Boolean(
      newFeature.name.trim()
    );

  return (
    <Stack spacing={3}>

      {/* =====================================================
          HEADER
      ===================================================== */}

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
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,

                  borderRadius: 2.5,

                  display: "grid",

                  placeItems: "center",

                  flexShrink: 0,

                  bgcolor: alpha(
                    BRAND.orange,
                    0.09
                  ),

                  color:
                    BRAND.orange,
                }}
              >
                <ChecklistRoundedIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    letterSpacing:
                      "-.02em",
                  }}
                >
                  Características del plan
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                    fontSize: 14,
                  }}
                >
                  Activa las funciones incluidas
                  y configura sus límites.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={
                <AddRoundedIcon />
              }
              onClick={
                handleOpenCreate
              }
              sx={{
                borderRadius: 999,

                px: 2.75,

                bgcolor:
                  BRAND.orange,

                fontWeight: 900,

                textTransform:
                  "none",

                "&:hover": {
                  bgcolor:
                    "#e94e1b",
                },
              }}
            >
              Nueva característica
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* =================================================
              RESUMEN
          ================================================= */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },

              gap: 2,
            }}
          >
            <SummaryItem
              label="Características"
              value={total}
            />

            <SummaryItem
              label="Incluidas"
              value={included}
            />

            <SummaryItem
              label="No incluidas"
              value={Math.max(
                total - included,
                0
              )}
            />
          </Box>
        </CardContent>
      </Card>

      {/* =====================================================
          CATEGORÍAS
      ===================================================== */}

      {categories.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,

            border:
              "1px dashed",

            borderColor: alpha(
              BRAND.orange,
              0.35
            ),

            bgcolor: alpha(
              BRAND.orange,
              0.02
            ),
          }}
        >
          <CardContent
            sx={{
              py: 6,

              textAlign:
                "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,

                borderRadius: 4,

                mx: "auto",

                display: "grid",

                placeItems:
                  "center",

                bgcolor: alpha(
                  BRAND.orange,
                  0.09
                ),

                color:
                  BRAND.orange,

                mb: 2,
              }}
            >
              <ChecklistRoundedIcon
                sx={{
                  fontSize: 32,
                }}
              />
            </Box>

            <Typography
              variant="h6"
              fontWeight={900}
            >
              Sin características
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1,

                maxWidth: 500,

                mx: "auto",
              }}
            >
              Todavía no existen
              características configurables
              para este plan.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {categories.map(
            (
              category,
              categoryIndex
            ) => (
              <CategoryCard
                key={
                  category.id ||
                  `category-${categoryIndex}`
                }
                category={category}
                categoryIndex={
                  categoryIndex
                }
                onChange={
                  onChange
                }
              />
            )
          )}
        </Stack>
      )}

      {/* =====================================================
          MODAL NUEVA CARACTERÍSTICA
      ===================================================== */}

      <Dialog
        open={openCreate}
        onClose={
          handleCloseCreate
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,

                  borderRadius: 2.5,

                  display: "grid",

                  placeItems:
                    "center",

                  bgcolor: alpha(
                    BRAND.orange,
                    0.09
                  ),

                  color:
                    BRAND.orange,
                }}
              >
                <AddRoundedIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  Nueva característica
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                  }}
                >
                  Agrega una nueva función al
                  catálogo de planes.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={
                handleCloseCreate
              }
              disabled={
                creatingFeature
              }
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            p: 3,
          }}
        >
          <Stack spacing={2.5}>

            {/* CATEGORÍA */}

            <TextField
              select
              label="Categoría"
              value={
                newFeature.category_id
              }
              onChange={(event) =>
                handleNewFeatureChange(
                  "category_id",
                  event.target.value
                )
              }
              fullWidth
              sx={fieldSx}
            >
              {categories.map(
                (category) => (
                  <MenuItem
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.name}
                  </MenuItem>
                )
              )}
            </TextField>

            {/* NOMBRE */}

            <TextField
              label="Nombre"
              value={
                newFeature.name
              }
              onChange={(event) =>
                handleNewFeatureChange(
                  "name",
                  event.target.value
                )
              }
              required
              fullWidth
              placeholder="Ej. Usuarios adicionales"
              helperText="El slug se generará automáticamente."
              sx={fieldSx}
            />

            {/* DESCRIPCIÓN */}

            <TextField
              label="Descripción"
              value={
                newFeature.description
              }
              onChange={(event) =>
                handleNewFeatureChange(
                  "description",
                  event.target.value
                )
              }
              fullWidth
              multiline
              minRows={3}
              placeholder="Describe qué controla esta característica."
              sx={fieldSx}
            />

            {/* ICONO */}

            <TextField
              label="Icono"
              value={
                newFeature.icon
              }
              onChange={(event) =>
                handleNewFeatureChange(
                  "icon",
                  event.target.value
                )
              }
              fullWidth
              placeholder="Ej. bi-people-fill"
              helperText="Clase de Bootstrap Icons."
              sx={fieldSx}
            />

            {/* TIPO Y ORDEN */}

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },

                gap: 2,
              }}
            >
              <TextField
                select
                label="Tipo de valor"
                value={
                  newFeature.value_type
                }
                onChange={(event) =>
                  handleNewFeatureChange(
                    "value_type",
                    event.target.value
                  )
                }
                fullWidth
                sx={fieldSx}
              >
                <MenuItem value="boolean">
                  Sí / No
                </MenuItem>

                <MenuItem value="number">
                  Cantidad / límite
                </MenuItem>

                <MenuItem value="text">
                  Texto
                </MenuItem>
              </TextField>

              <TextField
                label="Orden"
                type="number"
                value={
                  newFeature.sort_order
                }
                onChange={(event) =>
                  handleNewFeatureChange(
                    "sort_order",
                    event.target.value
                  )
                }
                fullWidth
                inputProps={{
                  min: 0,
                }}
                sx={fieldSx}
              />
            </Box>

            {/* ACTIVO */}

            <Box
              sx={{
                p: 2,

                borderRadius: 3,

                border: "1px solid",

                borderColor:
                  newFeature.is_active
                    ? alpha(
                        BRAND.orange,
                        0.3
                      )
                    : "divider",

                bgcolor:
                  newFeature.is_active
                    ? alpha(
                        BRAND.orange,
                        0.03
                      )
                    : "#fafafa",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography
                    fontWeight={900}
                  >
                    Característica activa
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.25,
                    }}
                  >
                    Permite utilizarla en los
                    planes.
                  </Typography>
                </Box>

                <Switch
                  checked={
                    newFeature.is_active
                  }
                  onChange={(event) =>
                    handleNewFeatureChange(
                      "is_active",
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
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Button
            onClick={
              handleCloseCreate
            }
            disabled={
              creatingFeature
            }
            sx={{
              borderRadius: 999,

              px: 2.5,

              color:
                "text.secondary",

              fontWeight: 800,

              textTransform:
                "none",
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={
              <AddRoundedIcon />
            }
            onClick={
              handleCreate
            }
            disabled={
              !canCreate ||
              creatingFeature
            }
            sx={{
              borderRadius: 999,

              px: 3,

              bgcolor:
                BRAND.orange,

              fontWeight: 900,

              textTransform:
                "none",

              "&:hover": {
                bgcolor:
                  "#e94e1b",
              },
            }}
          >
            {creatingFeature
              ? "Creando..."
              : "Crear característica"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

/*
|--------------------------------------------------------------------------
| Categoría
|--------------------------------------------------------------------------
*/

function CategoryCard({
  category,
  categoryIndex,
  onChange,
}) {
  const features =
    category.features || [];

  const includedCount =
    features.filter(
      (feature) =>
        isFeatureIncluded(feature)
    ).length;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,

        border: "1px solid",

        borderColor: "divider",

        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 2.5,
            md: 3,
          },

          py: 2.25,

          background:
            "linear-gradient(90deg, rgba(255,90,31,.055), #fff)",

          borderBottom:
            "1px solid",

          borderColor:
            "divider",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 44,
                height: 44,

                borderRadius: 2.5,

                display: "grid",

                placeItems:
                  "center",

                bgcolor: alpha(
                  BRAND.orange,
                  0.09
                ),

                color:
                  BRAND.orange,
              }}
            >
              {category.icon ? (
                <i
                  className={
                    category.icon.startsWith(
                      "bi "
                    )
                      ? category.icon
                      : `bi ${category.icon}`
                  }
                  style={{
                    fontSize: 20,
                  }}
                />
              ) : (
                <CategoryRoundedIcon />
              )}
            </Box>

            <Box>
              <Typography
                fontWeight={900}
                fontSize={17}
              >
                {category.name ||
                  "Categoría"}
              </Typography>

              {category.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                  }}
                >
                  {category.description}
                </Typography>
              )}
            </Box>
          </Stack>

          <Chip
            size="small"
            label={`${includedCount} de ${features.length} incluidas`}
            sx={{
              fontWeight: 800,

              bgcolor: alpha(
                BRAND.orange,
                0.08
              ),

              color:
                BRAND.orange,
            }}
          />
        </Stack>
      </Box>

      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 2.5,
          },

          "&:last-child": {
            pb: {
              xs: 2,
              md: 2.5,
            },
          },
        }}
      >
        {features.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
            }}
          >
            Esta categoría todavía no tiene
            características.
          </Alert>
        ) : (
          <Stack spacing={1.25}>
            {features.map(
              (
                feature,
                featureIndex
              ) => (
                <FeatureRow
                  key={
                    feature.id ||
                    `feature-${featureIndex}`
                  }
                  feature={feature}
                  categoryIndex={
                    categoryIndex
                  }
                  featureIndex={
                    featureIndex
                  }
                  onChange={
                    onChange
                  }
                />
              )
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| Característica
|--------------------------------------------------------------------------
*/

function FeatureRow({
  feature,
  categoryIndex,
  featureIndex,
  onChange,
}) {
  const type =
    feature.value_type ||
    feature.type ||
    "text";

  const status =
    getFeatureStatus(feature);

  const value =
    getFeatureValue(feature);

  const included =
    isFeatureIncluded(feature);

  const handleToggle = (
    checked
  ) => {
    /*
     * Desactivar
     */

    if (!checked) {
      onChange(
        categoryIndex,
        featureIndex,
        "status",
        "not_included"
      );

      onChange(
        categoryIndex,
        featureIndex,
        "value",
        null
      );

      return;
    }

    /*
     * Numérico:
     *
     * Debe usar limited porque necesita
     * un valor de límite.
     */

    if (type === "number") {
      onChange(
        categoryIndex,
        featureIndex,
        "status",
        "limited"
      );

      return;
    }

    /*
     * Boolean / texto
     */

    onChange(
      categoryIndex,
      featureIndex,
      "status",
      "included"
    );
  };

  const handleValueChange = (
    newValue
  ) => {
    onChange(
      categoryIndex,
      featureIndex,
      "value",
      newValue
    );

    /*
     * Un number con valor debe
     * mantenerse como limited.
     */

    if (
      type === "number" &&
      status !== "limited"
    ) {
      onChange(
        categoryIndex,
        featureIndex,
        "status",
        "limited"
      );
    }
  };

  return (
    <Box
      sx={{
        px: {
          xs: 1.5,
          md: 2,
        },

        py: 1.75,

        borderRadius: 3,

        border: "1px solid",

        borderColor: included
          ? alpha(
              BRAND.orange,
              0.28
            )
          : "divider",

        bgcolor: included
          ? alpha(
              BRAND.orange,
              0.025
            )
          : "#fafafa",

        transition:
          "all .2s ease",

        "&:hover": {
          borderColor: included
            ? alpha(
                BRAND.orange,
                0.5
              )
            : "#cfd3d8",
        },
      }}
    >
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            md:
              type === "boolean"
                ? "minmax(280px,1fr) 180px"
                : "minmax(280px,1fr) 180px minmax(200px,260px)",
          },

          gap: 2,

          alignItems: "center",
        }}
      >

        {/* INFORMACIÓN */}

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
        >
          <FeatureTypeIcon
            type={type}
            active={included}
          />

          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography
                fontWeight={900}
              >
                {feature.name}
              </Typography>

              <TypeChip
                type={type}
              />

              {status === "limited" && (
                <Chip
                  size="small"
                  label="Limitado"
                  sx={{
                    height: 22,

                    fontSize: 10,

                    fontWeight: 800,

                    bgcolor: alpha(
                      BRAND.amber,
                      0.16
                    ),

                    color:
                      "#9a6500",
                  }}
                />
              )}

              {status ===
                "optional" && (
                <Chip
                  size="small"
                  label="Opcional"
                  sx={{
                    height: 22,

                    fontSize: 10,

                    fontWeight: 800,

                    bgcolor: alpha(
                      BRAND.orange,
                      0.1
                    ),

                    color:
                      BRAND.orange,
                  }}
                />
              )}
            </Stack>

            {feature.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.4,

                  lineHeight: 1.5,
                }}
              >
                {feature.description}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* SWITCH */}

        <Box
          sx={{
            display: "flex",

            alignItems: "center",

            justifyContent: {
              xs: "space-between",
              md: "flex-start",
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
          >
            <Switch
              checked={included}
              onChange={(event) =>
                handleToggle(
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

            <Typography
              variant="body2"
              fontWeight={800}
              color={
                included
                  ? BRAND.orange
                  : "text.secondary"
              }
            >
              {included
                ? status === "limited"
                  ? "Con límite"
                  : "Incluido"
                : "No incluido"}
            </Typography>
          </Stack>
        </Box>

        {/* VALOR */}

        {type !== "boolean" && (
          <FeatureValueField
            value={value}
            type={type}
            included={
              included
            }
            onChange={
              handleValueChange
            }
          />
        )}
      </Box>
    </Box>
  );
}

/*
|--------------------------------------------------------------------------
| Campo valor
|--------------------------------------------------------------------------
*/

function FeatureValueField({
  value,
  type,
  included,
  onChange,
}) {
  const [unlimited, setUnlimited] =
    useState(
      value === "unlimited" ||
      value === "-1"
    );

  /*
   * Número
   */

  if (type === "number") {
    return (
      <Stack spacing={1}>
        <TextField
          size="small"
          label="Límite"
          type="number"
          value={
            unlimited
              ? ""
              : value ?? ""
          }
          disabled={
            !included ||
            unlimited
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          fullWidth
          placeholder="Ej. 5"
          inputProps={{
            min: 0,
          }}
          sx={fieldSx}
        />

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
        >
          <Switch
            size="small"
            checked={unlimited}
            disabled={!included}
            onChange={(event) => {
              const checked =
                event.target.checked;

              setUnlimited(
                checked
              );

              onChange(
                checked
                  ? "unlimited"
                  : ""
              );
            }}
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

          <Typography
            variant="caption"
            fontWeight={800}
            color={
              unlimited
                ? BRAND.orange
                : "text.secondary"
            }
          >
            Ilimitado
          </Typography>
        </Stack>
      </Stack>
    );
  }

  /*
   * Texto
   */

  return (
    <TextField
      size="small"
      label="Valor"
      value={value ?? ""}
      disabled={!included}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      fullWidth
      placeholder="Ej. Personalizado"
      sx={fieldSx}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Icono tipo
|--------------------------------------------------------------------------
*/

function FeatureTypeIcon({
  type,
  active,
}) {
  let icon =
    <TextFieldsRoundedIcon />;

  if (type === "boolean") {
    icon =
      <ToggleOnRoundedIcon />;
  }

  if (type === "number") {
    icon =
      <NumbersRoundedIcon />;
  }

  return (
    <Box
      sx={{
        width: 38,
        height: 38,

        flexShrink: 0,

        borderRadius: 2,

        display: "grid",

        placeItems: "center",

        bgcolor: active
          ? alpha(
              BRAND.orange,
              0.09
            )
          : "#eee",

        color: active
          ? BRAND.orange
          : "text.secondary",

        "& svg": {
          fontSize: 20,
        },
      }}
    >
      {icon}
    </Box>
  );
}

/*
|--------------------------------------------------------------------------
| Chip tipo
|--------------------------------------------------------------------------
*/

function TypeChip({
  type,
}) {
  const labels = {
    boolean: "Sí / No",
    number: "Límite",
    text: "Texto",
  };

  return (
    <Chip
      size="small"
      label={
        labels[type] ||
        "Valor"
      }
      sx={{
        height: 22,

        fontSize: 10,

        fontWeight: 800,
      }}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Resumen
|--------------------------------------------------------------------------
*/

function SummaryItem({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        p: 2,

        borderRadius: 3,

        bgcolor: "#fafafa",

        border: "1px solid",

        borderColor:
          "divider",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        fontWeight={900}
        fontSize={20}
        sx={{
          mt: 0.35,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}