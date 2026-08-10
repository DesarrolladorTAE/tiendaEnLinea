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
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

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
  display_name: "",
  description: "",
  type: "boolean",
  sort_order: 0,
  is_active: true,
};

export default function PlanFeaturesTab({
  categories,
  onChange,
  onCreateFeature,
  creatingFeature = false,
}) {
  const [openCreate, setOpenCreate] =
    useState(false);

  const [newFeature, setNewFeature] =
    useState(emptyFeature);

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
              Boolean(feature.included)
          ).length,
        0
      ),
    [categories]
  );

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
    setNewFeature(emptyFeature);
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

    const success =
      await onCreateFeature({
        ...newFeature,

        category_id: Number(
          newFeature.category_id
        ),

        sort_order: Number(
          newFeature.sort_order || 0
        ),

        is_active: Boolean(
          newFeature.is_active
        ),
      });

    if (success !== false) {
      setOpenCreate(false);
      setNewFeature(emptyFeature);
    }
  };

  const canCreate =
    newFeature.category_id &&
    newFeature.name.trim() &&
    newFeature.display_name.trim();

  return (
    <Stack spacing={3}>
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
                  color: BRAND.orange,
                }}
              >
                <ChecklistRoundedIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    letterSpacing: "-.02em",
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
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 999,
                px: 2.75,
                bgcolor: BRAND.orange,
                fontWeight: 900,
                textTransform: "none",

                "&:hover": {
                  bgcolor: "#e94e1b",
                },
              }}
            >
              Nueva característica
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

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
              value={
                Math.max(
                  total - included,
                  0
                )
              }
            />
          </Box>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,

            border: "1px dashed",

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
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                mx: "auto",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(
                  BRAND.orange,
                  0.09
                ),
                color: BRAND.orange,
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
                category={
                  category
                }
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

      <Dialog
        open={openCreate}
        onClose={handleCloseCreate}
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
                  placeItems: "center",
                  bgcolor: alpha(
                    BRAND.orange,
                    0.09
                  ),
                  color: BRAND.orange,
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
                    {category.display_name ||
                      category.name}
                  </MenuItem>
                )
              )}
            </TextField>

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
                label="Nombre interno"
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
                placeholder="usuarios"
                helperText="Identificador interno."
                sx={fieldSx}
              />

              <TextField
                label="Nombre visible"
                value={
                  newFeature.display_name
                }
                onChange={(event) =>
                  handleNewFeatureChange(
                    "display_name",
                    event.target.value
                  )
                }
                required
                fullWidth
                placeholder="Usuarios"
                sx={fieldSx}
              />
            </Box>

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
                  newFeature.type
                }
                onChange={(event) =>
                  handleNewFeatureChange(
                    "type",
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

            <Box
              sx={{
                p: 2,

                borderRadius: 3,

                border: "1px solid",

                borderColor: newFeature.is_active
                  ? alpha(
                      BRAND.orange,
                      0.3
                    )
                  : "divider",

                bgcolor: newFeature.is_active
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
              color: "text.secondary",
              fontWeight: 800,
              textTransform: "none",
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
              bgcolor: BRAND.orange,
              fontWeight: 900,
              textTransform: "none",

              "&:hover": {
                bgcolor: "#e94e1b",
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
        Boolean(feature.included)
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
                placeItems: "center",
                bgcolor: alpha(
                  BRAND.orange,
                  0.09
                ),
                color: BRAND.orange,
              }}
            >
              <CategoryRoundedIcon />
            </Box>

            <Box>
              <Typography
                fontWeight={900}
                fontSize={17}
              >
                {category.display_name ||
                  category.name ||
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

              color: BRAND.orange,
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

function FeatureRow({
  feature,
  categoryIndex,
  featureIndex,
  onChange,
}) {
  const included =
    Boolean(feature.included);

  const type =
    feature.type ||
    feature.value_type ||
    "text";

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
            md: type === "boolean"
              ? "minmax(280px,1fr) 180px"
              : "minmax(280px,1fr) 160px minmax(180px,240px)",
          },

          gap: 2,

          alignItems: "center",
        }}
      >
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
                {feature.display_name ||
                  feature.name}
              </Typography>

              <TypeChip
                type={type}
              />
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
                onChange(
                  categoryIndex,
                  featureIndex,
                  "included",
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
                ? "Incluido"
                : "No incluido"}
            </Typography>
          </Stack>
        </Box>

        {type !== "boolean" && (
          <FeatureValueField
            feature={feature}
            type={type}
            included={included}
            onChange={(value) =>
              onChange(
                categoryIndex,
                featureIndex,
                "value",
                value
              )
            }
          />
        )}
      </Box>
    </Box>
  );
}

function FeatureValueField({
  feature,
  type,
  included,
  onChange,
}) {
  if (type === "number") {
    return (
      <TextField
        size="small"
        label="Límite"
        type="number"
        value={
          feature.value ?? ""
        }
        disabled={!included}
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
    );
  }

  return (
    <TextField
      size="small"
      label="Valor"
      value={
        feature.value ?? ""
      }
      disabled={!included}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      fullWidth
      placeholder="Ej. Ilimitado"
      sx={fieldSx}
    />
  );
}

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
        borderColor: "divider",
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