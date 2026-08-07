import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { useNavigate } from "react-router-dom";

import { planService } from "../../services/superadmin/planService";

import {
  showConfirm,
  showSuccess,
  alertFromAxiosError,
} from "../../utils/alerts";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

function getMonthlyPrice(plan) {
  const prices =
    plan?.prices ||
    plan?.active_prices ||
    [];

  const monthly = prices.find(
    (price) =>
      price.billing_period === "monthly"
  );

  return monthly?.price ?? plan?.price ?? 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function PlanesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [plans, setPlans] = useState([]);

  const [search, setSearch] =
    useState("");

  const loadPlans = async () => {
    try {
      setLoading(true);

      const response =
        await planService.getAll();

      const payload =
        response?.data?.data ??
        response?.data ??
        [];

      setPlans(
        Array.isArray(payload)
          ? payload
          : []
      );
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudieron cargar los planes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return plans;
    }

    return plans.filter((plan) => {
      return [
        plan.name,
        plan.display_name,
        plan.subtitle,
        plan.description,
        plan.badge,
      ]
        .filter(Boolean)
        .some((text) =>
          String(text)
            .toLowerCase()
            .includes(value)
        );
    });
  }, [plans, search]);

  const handleEdit = (plan) => {
    navigate(
      `/panel/planes/${plan.id}`
    );
  };

  const handleCreate = () => {
    navigate(
      "/panel/planes/nuevo"
    );
  };

  const handleToggleStatus = async (
    plan
  ) => {
    try {
      await planService.toggleStatus(
        plan.id
      );

      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id
            ? {
                ...item,
                is_active:
                  !item.is_active,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudo cambiar el estado del plan."
      );
    }
  };

  const handleToggleFeatured = async (
    plan
  ) => {
    try {
      await planService.toggleFeatured(
        plan.id
      );

      /*
       * El backend deja solamente uno
       * como recomendado.
       */
      setPlans((current) =>
        current.map((item) => ({
          ...item,

          is_featured:
            item.id === plan.id
              ? !plan.is_featured
              : false,
        }))
      );
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudo actualizar el plan recomendado."
      );
    }
  };

  const handleDelete = async (plan) => {
    const ok = await showConfirm(
      `¿Eliminar el plan ${
        plan.display_name ||
        plan.name
      }?`,
      "Sí, eliminar"
    );

    if (!ok) return;

    try {
      await planService.delete(plan.id);

      setPlans((current) =>
        current.filter(
          (item) =>
            item.id !== plan.id
        )
      );

      await showSuccess(
        "El plan se eliminó correctamente."
      );
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudo eliminar el plan."
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        p: {
          xs: 2,
          md: 3,
        },

        background:
          "radial-gradient(circle at top left, rgba(255,181,46,.12), transparent 32%), linear-gradient(180deg, #fff 0%, #fafafa 100%)",
      }}
    >
      {/* HERO */}

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

            width: 230,
            height: 230,

            borderRadius: "50%",

            background:
              "rgba(255,181,46,.22)",
          }}
        />

        <Box
          sx={{
            position: "absolute",

            right: 100,
            bottom: -100,

            width: 180,
            height: 180,

            borderRadius: "50%",

            background:
              "rgba(255,90,31,.12)",
          }}
        />

        <CardContent
          sx={{
            p: {
              xs: 3,
              md: 4,
            },

            position: "relative",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            justifyContent="space-between"
            spacing={3}
          >
            <Box>
              <Chip
                icon={
                  <WorkspacePremiumRoundedIcon />
                }
                label="Configuración comercial"
                size="small"
                sx={{
                  mb: 1.5,

                  color: "#fff",

                  bgcolor:
                    "rgba(255,255,255,.12)",

                  border:
                    "1px solid rgba(255,255,255,.18)",

                  fontWeight: 800,

                  "& .MuiChip-icon": {
                    color: BRAND.amber,
                  },
                }}
              />

              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-.03em",

                  fontSize: {
                    xs: 28,
                    md: 36,
                  },

                  color:
                    "rgba(255,255,255,.94)",
                }}
              >
                Planes y precios
              </Typography>

              <Typography
                sx={{
                  mt: 1,

                  color:
                    "rgba(255,255,255,.72)",

                  maxWidth: 720,
                }}
              >
                Administra los planes,
                precios, características y
                complementos que se muestran
                en Mi Tienda en Línea MX.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={
                <AddRoundedIcon />
              }
              onClick={handleCreate}
              sx={{
                borderRadius: 999,

                px: 3,
                py: 1.2,

                bgcolor: BRAND.amber,
                color: BRAND.dark,

                fontWeight: 900,

                boxShadow:
                  "0 14px 34px rgba(255,181,46,.28)",

                "&:hover": {
                  bgcolor: "#ffc14d",
                },
              }}
            >
              Nuevo plan
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* BUSCADOR */}

      <Card
        elevation={0}
        sx={{
          mb: 3,

          borderRadius: 4,

          border: "1px solid",
          borderColor: "divider",

          boxShadow:
            "0 16px 50px rgba(15,23,42,.06)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <TextField
            fullWidth
            placeholder="Buscar plan..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            slotProps={{
              input: {
                startAdornment: (
                  <SearchRoundedIcon
                    sx={{
                      mr: 1,
                      color:
                        "text.secondary",
                    }}
                  />
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* CONTENIDO */}

      {loading ? (
        <Stack
          alignItems="center"
          sx={{
            py: 10,
          }}
        >
          <CircularProgress
            sx={{
              color: BRAND.orange,
            }}
          />

          <Typography
            color="text.secondary"
            sx={{
              mt: 2,
            }}
          >
            Cargando planes...
          </Typography>
        </Stack>
      ) : filteredPlans.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,

            border: "1px solid",
            borderColor: "divider",
          }}
        >
          No hay planes disponibles.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },

            gap: 2.5,
          }}
        >
          {filteredPlans.map((plan) => {
            const monthlyPrice =
              getMonthlyPrice(plan);

            const featureCount =
              plan.feature_values?.length ??
              plan.featureValues?.length ??
              0;

            const addonCount =
              plan.addons?.length ?? 0;

            return (
              <Card
                key={plan.id}
                elevation={0}
                sx={{
                  borderRadius: 4,

                  border:
                    "1px solid",

                  borderColor:
                    plan.is_featured
                      ? alpha(
                          BRAND.amber,
                          0.65
                        )
                      : "divider",

                  position: "relative",

                  overflow: "hidden",

                  boxShadow:
                    plan.is_featured
                      ? "0 20px 55px rgba(255,181,46,.16)"
                      : "0 12px 35px rgba(15,23,42,.05)",

                  transition:
                    ".2s ease",

                  "&:hover": {
                    transform:
                      "translateY(-3px)",

                    boxShadow:
                      "0 20px 60px rgba(15,23,42,.10)",

                    borderColor:
                      alpha(
                        BRAND.orange,
                        0.35
                      ),
                  },
                }}
              >
                {plan.is_featured && (
                  <Box
                    sx={{
                      height: 5,

                      background:
                        "linear-gradient(90deg, #ff5a1f, #ffb52e)",
                    }}
                  />
                )}

                <CardContent
                  sx={{
                    p: 3,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          label={
                            plan.is_active
                              ? "Activo"
                              : "Inactivo"
                          }
                          size="small"
                          sx={{
                            fontWeight: 800,

                            bgcolor:
                              plan.is_active
                                ? alpha(
                                    "#16a34a",
                                    0.12
                                  )
                                : alpha(
                                    "#64748b",
                                    0.12
                                  ),

                            color:
                              plan.is_active
                                ? "#15803d"
                                : "#475569",
                          }}
                        />

                        {plan.is_featured && (
                          <Chip
                            icon={
                              <StarRoundedIcon />
                            }
                            label={
                              plan.badge ||
                              "Recomendado"
                            }
                            size="small"
                            sx={{
                              fontWeight:
                                800,

                              bgcolor:
                                alpha(
                                  BRAND.amber,
                                  0.16
                                ),

                              color:
                                "#9a6200",

                              "& .MuiChip-icon":
                                {
                                  color:
                                    "#d88b00",
                                },
                            }}
                          />
                        )}

                        {!plan.show_on_landing && (
                          <Chip
                            label="Oculto"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      <Typography
                        variant="h5"
                        fontWeight={900}
                        sx={{
                          letterSpacing:
                            "-.02em",
                        }}
                      >
                        {plan.display_name ||
                          plan.name}
                      </Typography>

                      {plan.subtitle && (
                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                          }}
                        >
                          {plan.subtitle}
                        </Typography>
                      )}
                    </Box>

                    <Tooltip
                      title={
                        plan.is_featured
                          ? "Quitar recomendado"
                          : "Marcar como recomendado"
                      }
                    >
                      <IconButton
                        onClick={() =>
                          handleToggleFeatured(
                            plan
                          )
                        }
                        sx={{
                          color:
                            plan.is_featured
                              ? "#d88b00"
                              : "text.secondary",

                          bgcolor:
                            plan.is_featured
                              ? alpha(
                                  BRAND.amber,
                                  0.12
                                )
                              : alpha(
                                  "#64748b",
                                  0.06
                                ),
                        }}
                      >
                        {plan.is_featured ? (
                          <StarRoundedIcon />
                        ) : (
                          <StarBorderRoundedIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Box
                    sx={{
                      mt: 3,

                      p: 2,

                      borderRadius: 3,

                      bgcolor:
                        alpha(
                          BRAND.orange,
                          0.055
                        ),

                      border:
                        "1px solid",

                      borderColor:
                        alpha(
                          BRAND.orange,
                          0.12
                        ),
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Desde
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="baseline"
                      spacing={0.6}
                    >
                      <Typography
                        variant="h4"
                        fontWeight={950}
                        color={
                          BRAND.dark
                        }
                      >
                        {formatMoney(
                          monthlyPrice
                        )}
                      </Typography>

                      <Typography
                        color="text.secondary"
                      >
                        / mes
                      </Typography>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",

                      gridTemplateColumns:
                        "repeat(3, 1fr)",

                      gap: 1,

                      mt: 2,
                    }}
                  >
                    <Stat
                      icon={
                        <PaymentsRoundedIcon />
                      }
                      value={
                        plan.prices
                          ?.length ?? 0
                      }
                      label="Precios"
                    />

                    <Stat
                      icon={
                        <ChecklistRoundedIcon />
                      }
                      value={
                        featureCount
                      }
                      label="Funciones"
                    />

                    <Stat
                      icon={
                        <ExtensionRoundedIcon />
                      }
                      value={addonCount}
                      label="Extras"
                    />
                  </Box>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      mt: 3,

                      pt: 2,

                      borderTop:
                        "1px solid",

                      borderColor:
                        "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Switch
                        checked={
                          Boolean(
                            plan.is_active
                          )
                        }
                        onChange={() =>
                          handleToggleStatus(
                            plan
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
                              backgroundColor:
                                BRAND.orange,
                            },
                        }}
                      />

                      <Typography
                        variant="body2"
                        fontWeight={700}
                      >
                        {plan.is_active
                          ? "Activo"
                          : "Inactivo"}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.7}
                    >
                      <Tooltip title="Editar plan">
                        <IconButton
                          onClick={() =>
                            handleEdit(
                              plan
                            )
                          }
                          sx={{
                            color:
                              BRAND.orange,

                            bgcolor:
                              alpha(
                                BRAND.orange,
                                0.08
                              ),

                            "&:hover": {
                              bgcolor:
                                alpha(
                                  BRAND.orange,
                                  0.14
                                ),
                            },
                          }}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Vista previa">
                        <IconButton
                          disabled
                          sx={{
                            color:
                              "#2563eb",

                            bgcolor:
                              alpha(
                                "#2563eb",
                                0.07
                              ),
                          }}
                        >
                          <VisibilityRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton
                          onClick={() =>
                            handleDelete(
                              plan
                            )
                          }
                          sx={{
                            color:
                              "#dc2626",

                            bgcolor:
                              alpha(
                                "#dc2626",
                                0.07
                              ),

                            "&:hover": {
                              bgcolor:
                                alpha(
                                  "#dc2626",
                                  0.14
                                ),
                            },
                          }}
                        >
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function Stat({
  icon,
  value,
  label,
}) {
  return (
    <Box
      sx={{
        textAlign: "center",

        py: 1.4,
        px: 1,

        borderRadius: 2.5,

        bgcolor: "#fafafa",

        border:
          "1px solid",

        borderColor:
          "divider",
      }}
    >
      <Box
        sx={{
          color:
            BRAND.orange,

          display: "flex",

          justifyContent:
            "center",

          mb: 0.5,

          "& svg": {
            fontSize: 19,
          },
        }}
      >
        {icon}
      </Box>

      <Typography
        fontWeight={900}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
      >
        {label}
      </Typography>
    </Box>
  );
}