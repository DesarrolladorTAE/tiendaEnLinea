import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

import { useNavigate, useParams } from "react-router-dom";

import { planService } from "../../services/superadmin/planService";
import { planPriceService } from "../../services/superadmin/planPriceService";
import { planFeatureValueService } from "../../services/superadmin/planFeatureValueService";
import { planAddonService } from "../../services/superadmin/planAddonService";
import { planFeatureService } from "../../services/superadmin/planFeatureService";

import { alertFromAxiosError, showSuccess } from "../../utils/alerts";

import PlanGeneralTab from "./components/PlanGeneralTab";
import PlanPricesTab from "./components/PlanPricesTab";
import PlanFeaturesTab from "./components/PlanFeaturesTab";
import PlanAddonsTab from "./components/PlanAddonsTab";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

const TABS = [
  {
    value: "general",
    label: "General",
    icon: <SettingsRoundedIcon fontSize="small" />,
  },
  {
    value: "prices",
    label: "Precios",
    icon: <PaymentsRoundedIcon fontSize="small" />,
  },
  {
    value: "features",
    label: "Características",
    icon: <ChecklistRoundedIcon fontSize="small" />,
  },
  {
    value: "addons",
    label: "Complementos",
    icon: <ExtensionRoundedIcon fontSize="small" />,
  },
];

const emptyPlan = {
  name: "",
  display_name: "",
  subtitle: "",
  description: "",
  badge: "",
  icon: "",
  trial_days: 0,
  is_active: true,
  is_featured: false,
  show_on_landing: true,
  button_text: "Más información",
  button_url: "",
  background_style: "light",
  sort_order: 0,
};

export default function PlanEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isNew = id === "nuevo";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("general");

  const [plan, setPlan] = useState(emptyPlan);
  const [prices, setPrices] = useState([]);
  const [featureMatrix, setFeatureMatrix] = useState([]);
  const [addons, setAddons] = useState([]);

  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [addonsLoaded, setAddonsLoaded] = useState(false);

  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingAddons, setLoadingAddons] = useState(false);

  const [creatingFeature, setCreatingFeature] = useState(false);

  const title = useMemo(() => {
    if (isNew) {
      return "Nuevo plan";
    }

    return plan.display_name || plan.name || "Editar plan";
  }, [isNew, plan.display_name, plan.name]);

  const loadPlan = useCallback(async () => {
    if (isNew) {
      setPlan(emptyPlan);
      setPrices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await planService.getById(id);

      const data = response?.data?.data ?? response?.data ?? {};

      setPlan({
        ...emptyPlan,
        ...data,
      });

      setPrices(Array.isArray(data?.prices) ? data.prices : []);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudo cargar la información del plan.");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    setFeaturesLoaded(false);
    setAddonsLoaded(false);
    setFeatureMatrix([]);
    setAddons([]);
    setTab("general");
  }, [id]);

  const loadFeatures = useCallback(async () => {
    if (isNew) {
      return;
    }

    try {
      setLoadingFeatures(true);

      const response = await planFeatureValueService.getMatrix(id);

      const data = response?.data?.data ?? response?.data ?? {};

      setFeatureMatrix(Array.isArray(data?.categories) ? data.categories : []);

      setFeaturesLoaded(true);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudieron cargar las características.");
    } finally {
      setLoadingFeatures(false);
    }
  }, [id, isNew]);

  const loadAddons = useCallback(async () => {
    if (isNew) {
      return;
    }

    try {
      setLoadingAddons(true);

      const response = await planAddonService.getMatrix(id);

      const data = response?.data?.data ?? response?.data ?? {};

      setAddons(Array.isArray(data?.addons) ? data.addons : []);

      setAddonsLoaded(true);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudieron cargar los complementos.");
    } finally {
      setLoadingAddons(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    if (tab === "features" && !featuresLoaded && !loadingFeatures) {
      loadFeatures();
    }

    if (tab === "addons" && !addonsLoaded && !loadingAddons) {
      loadAddons();
    }
  }, [
    tab,
    featuresLoaded,
    addonsLoaded,
    loadingFeatures,
    loadingAddons,
    loadFeatures,
    loadAddons,
  ]);

  const handleChange = (field, value) => {
    setPlan((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);

      const payload = {
        name: plan.name?.trim() || "",

        display_name: plan.display_name?.trim() || "",

        subtitle: plan.subtitle?.trim() || null,

        description: plan.description?.trim() || null,

        badge: plan.badge?.trim() || null,

        icon: plan.icon?.trim() || null,

        trial_days: Number(plan.trial_days || 0),

        is_active: Boolean(plan.is_active),

        is_featured: Boolean(plan.is_featured),

        show_on_landing: Boolean(plan.show_on_landing),

        button_text: plan.button_text?.trim() || "Más información",

        button_url: plan.button_url?.trim() || null,

        background_style: plan.background_style || "light",

        sort_order: Number(plan.sort_order || 0),
      };

      if (isNew) {
        const response = await planService.create(payload);

        const created = response?.data?.data ?? response?.data;

        await showSuccess("El plan se creó correctamente.");

        navigate(`/superadmin/planes/${created.id}`, {
          replace: true,
        });

        return;
      }

      await planService.update(id, payload);

      await showSuccess("El plan se actualizó correctamente.");

      await loadPlan();
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (index, field, value) => {
    setPrices((current) =>
      current.map((price, currentIndex) =>
        currentIndex === index
          ? {
              ...price,
              [field]: value,
            }
          : price,
      ),
    );
  };

  const handleAddPrice = () => {
    setPrices((current) => [
      ...current,
      {
        id: null,
        billing_cycle: "monthly",
        label: "",
        price: "",
        months_paid: 1,
        months_received: 1,
        is_active: true,
        sort_order: current.length,
      },
    ]);
  };

  const handleDeletePrice = (index) => {
    setPrices((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleSavePrices = async () => {
    try {
      setSaving(true);

      const data = prices.map((price, index) => ({
        id: price.id || null,

        billing_cycle: price.billing_cycle || "monthly",

        label: price.label?.trim() || null,

        price: Number(price.price || 0),

        months_paid: Number(price.months_paid || 1),

        months_received: Number(price.months_received || 1),

        is_active: price.is_active !== false,

        sort_order: Number(price.sort_order ?? index),
      }));

      await planPriceService.syncPlanPrices(id, data);

      await showSuccess("Los precios se actualizaron correctamente.");

      await loadPlan();
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudieron guardar los precios.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureChange = (categoryIndex, featureIndex, field, value) => {
    setFeatureMatrix((current) =>
      current.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        return {
          ...category,

          features: (category.features || []).map(
            (feature, currentFeatureIndex) => {
              if (currentFeatureIndex !== featureIndex) {
                return feature;
              }

              return {
                ...feature,
                [field]: value,
              };
            },
          ),
        };
      }),
    );
  };

  const handleSaveFeatures = async () => {
    try {
      setSaving(true);

      const features = [];

      featureMatrix.forEach((category) => {
        (category.features || []).forEach((feature) => {
          features.push({
            feature_id: feature.feature_id || feature.id,

            included: Boolean(feature.included),

            value:
              feature.value === "" ||
              feature.value === undefined ||
              feature.value === null
                ? null
                : feature.value,
          });
        });
      });

      await planFeatureValueService.syncPlanFeatures(id, features);

      await showSuccess("Las características se actualizaron correctamente.");

      await loadFeatures();
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudieron guardar las características.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddonChange = (index, field, value) => {
    setAddons((current) =>
      current.map((addon, currentIndex) =>
        currentIndex === index
          ? {
              ...addon,
              [field]: value,
            }
          : addon,
      ),
    );
  };

 const handleCreateFeature = async (feature) => {
  try {
    setCreatingFeature(true);

    await planFeatureService.create(feature);

    await showSuccess(
      "La característica se creó correctamente."
    );

    await loadFeatures();

    return true;
  } catch (error) {
    console.error(error);

    alertFromAxiosError(
      error,
      "No se pudo crear la característica."
    );

    return false;
  } finally {
    setCreatingFeature(false);
  }
};

  const handleSaveAddons = async () => {
    try {
      setSaving(true);

      const data = addons.map((addon) => ({
        addon_id: addon.addon_id || addon.id,

        availability:
          addon.availability || (addon.included ? "included" : "available"),

        included: Boolean(addon.included),

        price_override:
          addon.price_override === "" ||
          addon.price_override === null ||
          addon.price_override === undefined
            ? null
            : Number(addon.price_override),
      }));

      await planAddonService.syncPlanAddons(id, data);

      await showSuccess("Los complementos se actualizaron correctamente.");

      await loadAddons();
    } catch (error) {
      console.error(error);

      alertFromAxiosError(error, "No se pudieron guardar los complementos.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrentTab = () => {
    if (saving) {
      return;
    }

    switch (tab) {
      case "prices":
        return handleSavePrices();

      case "features":
        return handleSaveFeatures();

      case "addons":
        return handleSaveAddons();

      case "general":
      default:
        return handleSaveGeneral();
    }
  };

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: 500,
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
          Cargando plan...
        </Typography>
      </Stack>
    );
  }

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
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,181,46,.22)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            right: 130,
            bottom: -100,
            width: 170,
            height: 170,
            borderRadius: "50%",
            background: "rgba(255,90,31,.08)",
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
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            spacing={3}
          >
            <Box>
              <Chip
                icon={<WorkspacePremiumRoundedIcon />}
                label={isNew ? "Nuevo plan" : "Editor de plan"}
                size="small"
                sx={{
                  mb: 1.5,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,.12)",
                  border: "1px solid rgba(255,255,255,.18)",
                  fontWeight: 800,
                  "& .MuiChip-icon": {
                    color: BRAND.amber,
                  },
                }}
              />

              <Typography
                variant="h4"
                fontWeight={900}
                color="white"
                sx={{
                  letterSpacing: "-.03em",
                  fontSize: {
                    xs: 28,
                    md: 36,
                  },
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "rgba(255,255,255,.72)",
                  maxWidth: 720,
                }}
              >
                Configura datos generales, precios, características y
                complementos del plan.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/superadmin/planes")}
                disabled={saving}
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.25)",
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,.08)",
                  },
                }}
              >
                Volver
              </Button>

              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveRoundedIcon />
                  )
                }
                onClick={handleSaveCurrentTab}
                disabled={saving}
                sx={{
                  borderRadius: 999,
                  px: 3,
                  bgcolor: BRAND.amber,
                  color: BRAND.dark,
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#ffc14d",
                    boxShadow: "none",
                  },
                }}
              >
                {saving ? "Guardando..." : isNew ? "Crear plan" : "Guardar"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {!isNew && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 16px 50px rgba(15,23,42,.06)",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => {
              if (saving) {
                return;
              }

              setTab(value);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              "& .MuiTab-root": {
                minHeight: 64,
                fontWeight: 800,
                textTransform: "none",
              },
              "& .Mui-selected": {
                color: `${BRAND.orange} !important`,
              },
              "& .MuiTabs-indicator": {
                bgcolor: BRAND.orange,
                height: 3,
                borderRadius: 999,
              },
            }}
          >
            {TABS.map((item) => (
              <Tab
                key={item.value}
                value={item.value}
                label={item.label}
                icon={item.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>
      )}

      {isNew && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 3,
          }}
        >
          Primero crea el plan. Después podrás configurar sus precios,
          características y complementos.
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 16px 50px rgba(15,23,42,.06)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
            "&:last-child": {
              pb: {
                xs: 2,
                md: 3,
              },
            },
          }}
        >
          {tab === "general" && (
            <PlanGeneralTab plan={plan} onChange={handleChange} />
          )}

          {tab === "prices" && (
            <PlanPricesTab
              prices={prices}
              onChange={handlePriceChange}
              onAdd={handleAddPrice}
              onDelete={handleDeletePrice}
            />
          )}

          {tab === "features" &&
            (loadingFeatures ? (
              <SectionLoader text="Cargando características..." />
            ) : (
              <PlanFeaturesTab
                categories={featureMatrix}
                onChange={handleFeatureChange}
                onCreateFeature={handleCreateFeature}
                creatingFeature={creatingFeature}
              />
            ))}

          {tab === "addons" &&
            (loadingAddons ? (
              <SectionLoader text="Cargando complementos..." />
            ) : (
              <PlanAddonsTab addons={addons} onChange={handleAddonChange} />
            ))}
        </CardContent>
      </Card>
    </Box>
  );
}

function SectionLoader({ text }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: 300,
        py: 8,
      }}
    >
      <CircularProgress
        size={36}
        sx={{
          color: BRAND.orange,
        }}
      />

      <Typography
        color="text.secondary"
        sx={{
          mt: 2,
          fontWeight: 600,
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
}
