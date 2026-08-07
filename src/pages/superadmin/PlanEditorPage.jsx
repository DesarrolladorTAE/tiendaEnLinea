import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
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

import {
  alertFromAxiosError,
  showSuccess,
} from "../../utils/alerts";

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

  const title = useMemo(() => {
    if (isNew) {
      return "Nuevo plan";
    }

    return plan.display_name || plan.name || "Editar plan";
  }, [isNew, plan]);

  useEffect(() => {
    if (isNew) {
      return;
    }

    loadPlan();
  }, [id]);

  const loadPlan = async () => {
    try {
      setLoading(true);

      const response = await planService.getById(id);

      const data = response?.data?.data ?? response?.data;

      setPlan({
        ...emptyPlan,
        ...data,
      });

      setPrices(data?.prices || []);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudo cargar la información del plan."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    if (isNew) return;

    try {
      const response = await planService.getFeatureMatrix(id);

      const data = response?.data?.data ?? response?.data;

      setFeatureMatrix(data?.categories || []);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudieron cargar las características."
      );
    }
  };

  const loadAddons = async () => {
    if (isNew) return;

    try {
      const response = await planService.getAddons(id);

      const data = response?.data?.data ?? response?.data;

      setAddons(data?.addons || []);
    } catch (error) {
      console.error(error);

      alertFromAxiosError(
        error,
        "No se pudieron cargar los complementos."
      );
    }
  };

  useEffect(() => {
    if (tab === "features" && featureMatrix.length === 0) {
      loadFeatures();
    }

    if (tab === "addons" && addons.length === 0) {
      loadAddons();
    }
  }, [tab]);

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
        name: plan.name,
        display_name: plan.display_name,
        subtitle: plan.subtitle || null,
        description: plan.description || null,
        badge: plan.badge || null,
        icon: plan.icon || null,
        trial_days: Number(plan.trial_days || 0),
        is_active: Boolean(plan.is_active),
        is_featured: Boolean(plan.is_featured),
        show_on_landing: Boolean(plan.show_on_landing),
        button_text: plan.button_text || "Más información",
        button_url: plan.button_url || null,
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

      alertFromAxiosError(
        error,
        "No se pudo guardar el plan."
      );
    } finally {
      setSaving(false);
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
        <CircularProgress sx={{ color: BRAND.orange }} />

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

            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/superadmin/planes")}
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.25)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,.08)",
                  },
                }}
              >
                Volver
              </Button>

              {tab === "general" && (
                <Button
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    bgcolor: BRAND.amber,
                    color: BRAND.dark,
                    fontWeight: 900,
                    "&:hover": {
                      bgcolor: "#ffc14d",
                    },
                  }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              )}
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
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
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
          }}
        >
          {tab === "general" && (
            <GeneralTab
              plan={plan}
              onChange={handleChange}
            />
          )}

          {tab === "prices" && (
            <PlaceholderSection
              icon={<PaymentsRoundedIcon />}
              title="Precios"
              description="Aquí configuraremos mensual, semestral y anual."
              count={prices.length}
            />
          )}

          {tab === "features" && (
            <PlaceholderSection
              icon={<ChecklistRoundedIcon />}
              title="Características"
              description="Aquí editaremos qué incluye, qué limita y qué no incluye este plan."
              count={featureMatrix.reduce(
                (total, category) =>
                  total + (category.features?.length || 0),
                0
              )}
            />
          )}

          {tab === "addons" && (
            <PlaceholderSection
              icon={<ExtensionRoundedIcon />}
              title="Complementos"
              description="Aquí configuraremos complementos incluidos, disponibles o no disponibles."
              count={addons.length}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function GeneralTab({ plan, onChange }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={900}>
        Información general
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Configura cómo se identifica y se presenta el plan.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Alert severity="info" sx={{ borderRadius: 3 }}>
        En el siguiente paso llenaremos aquí los campos editables del plan.
      </Alert>
    </Box>
  );
}

function PlaceholderSection({
  icon,
  title,
  description,
  count,
}) {
  return (
    <Stack
      alignItems="center"
      textAlign="center"
      sx={{
        py: 8,
      }}
    >
      <Box
        sx={{
          width: 70,
          height: 70,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          color: BRAND.orange,
          bgcolor: alpha(BRAND.orange, 0.09),
          mb: 2,
          "& svg": {
            fontSize: 34,
          },
        }}
      >
        {icon}
      </Box>

      <Typography variant="h5" fontWeight={900}>
        {title}
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 1,
          maxWidth: 550,
        }}
      >
        {description}
      </Typography>

      <Chip
        label={`${count} registros cargados`}
        sx={{
          mt: 2,
          fontWeight: 800,
        }}
      />
    </Stack>
  );
}