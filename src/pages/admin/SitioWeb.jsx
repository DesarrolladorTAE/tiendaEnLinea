// src/pages/other/SelectorVistasTienda.jsx
import React, { useEffect, useState } from "react";
import {
  Container, Grid, Card, CardContent, CardActions, Typography, Button,
  Chip, Box, Stack, Tooltip, Dialog, DialogTitle, DialogContent, IconButton,
  useMediaQuery, useTheme
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";

import axiosClient from "../../config/axiosClient";
import { showError, showSuccess } from "../../utils/alerts";
import planes from "../../utils/planes";
import Renovar from "../../pages/other/Renovar";

// Modales
import ModalPlanNegocio from "./modals/ModalPlanNegocio";
import ModalPlanProfesional from "./modals/ModalPlanProfesional";
import ModalPlanAvanzado from "./modals/ModalPlanAvanzado";

const VISTAS = [
  { id: 1, minPlan: 1, titulo: "👀 Plan Demo",       subtitulo: "Catálogo básico",           descripcion: "Vista simple para mostar y cargar tus primeros productos.", icon: <VisibilityOutlinedIcon fontSize="large" />,       gradient: "linear-gradient(135deg, #2ecc71, #27ae60)" },
  { id: 2, minPlan: 2, titulo: "🏪 Plan Negocio",    subtitulo: "Perfil de Tienda",          descripcion: "Presentación de tu tienda, destacar colecciones y productos.", icon: <StorefrontOutlinedIcon fontSize="large" />,     gradient: "linear-gradient(135deg, #6a11cb, #2575fc)" },
  { id: 3, minPlan: 3, titulo: "⭐ Plan Profesional", subtitulo: "Conoce y Explora",          descripcion: "Plan Negocio + Carrusel de imágenes después de productos.",    icon: <WorkspacePremiumOutlinedIcon fontSize="large" />,  gradient: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { id: 4, minPlan: 4, titulo: "🚀 Plan Avanzado",   subtitulo: "Premium y Escalable",       descripcion: "Landing Page 100% completa editable 24/7 los 365 días.",       icon: <RocketLaunchOutlinedIcon fontSize="large" />,      gradient: "linear-gradient(135deg, #ff416c, #ff4b2b)" },
];

export default function SelectorVistasTienda({ onSelect }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [store, setStore] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openRenovar, setOpenRenovar] = useState(false);

  // Modales
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  // Prefill
  const [defaults, setDefaults] = useState({});

  // Saving flags
  const [saving2, setSaving2] = useState(false);
  const [saving3, setSaving3] = useState(false);
  const [saving4, setSaving4] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get("/perfil/mi-tienda")
      .then((res) => {
        const s = res.data;
        setStore(s);

        const p = planes.find((pl) => pl.plan_id === s.plan_id) || {
          plan_id: s.plan_id, nombre: `Plan ${s.plan_id}`, beneficios: [],
        };
        setPlan(p);

        const fechaVigencia = s.plan_id === 1 ? s.trial_ends_at : s.plan_expiration;
        if (fechaVigencia) {
          const now = new Date();
          const fin = new Date(fechaVigencia);
          setIsExpired(fin < now);
        } else {
          setIsExpired(true);
        }
      })
      .catch(() => showError("No se pudo cargar la información de la tienda."))
      .finally(() => setLoading(false));
  }, []);

  const esPlanActual = (vistaId) => store?.plan_id === vistaId;
  const puedeConfigurar = (vistaId) => !isExpired && esPlanActual(vistaId);

  // Prefill del sitio
  const fetchDefaults = async () => {
    if (!store?.id) return setDefaults({});
    try {
      const { data } = await axiosClient.get(`/admin/sitios/${store.id}`);
      setDefaults(data?.data || {});
    } catch {
      setDefaults({});
    }
  };

  // Abrir modal según vista (solo si coincide con plan actual)
  const handleSelect = async (vistaId) => {
    if (isExpired) {
      showError("Tu plan está vencido. Renueva para habilitar la configuración.");
      setOpenRenovar(true);
      return;
    }
    if (!puedeConfigurar(vistaId)) {
      showError("Solo puedes configurar la vista de tu plan actual.");
      return;
    }

    await fetchDefaults();
    onSelect?.(vistaId);

    if (vistaId === 2) setOpen2(true);
    if (vistaId === 3) setOpen3(true);
    if (vistaId === 4) setOpen4(true);
  };

  // --- Submits ---
  const submitPlan2 = async (fd) => {
    try {
      if (!puedeConfigurar(2)) {
        showError("Solo puedes configurar la vista de tu plan actual.");
        return;
      }
      setSaving2(true);
      const url = defaults?.id
        ? `/admin/sitios/${store.id}/plan-2/update`
        : `/admin/sitios/${store.id}/plan-2/create`;
      await axiosClient.post(url, fd); // no fuerces Content-Type
      await fetchDefaults();
      setOpen2(false);
      showSuccess?.("Guardado correctamente (Plan Negocio)") || alert("Guardado (Plan Negocio)");
    } catch {
      showError("No se pudo guardar el Plan Negocio.");
    } finally {
      setSaving2(false);
    }
  };

  const submitPlan3 = async (fd) => {
    try {
      if (!puedeConfigurar(3)) {
        showError("Solo puedes configurar la vista de tu plan actual.");
        return;
      }
      setSaving3(true);
      const url = defaults?.id
        ? `/admin/sitios/${store.id}/plan-3/update`
        : `/admin/sitios/${store.id}/plan-3/create`;
      await axiosClient.post(url, fd);
      await fetchDefaults();
      setOpen3(false);
      showSuccess?.("Guardado correctamente (Plan Profesional)") || alert("Guardado (Plan Profesional)");
    } catch {
      showError("No se pudo guardar el Plan Profesional.");
    } finally {
      setSaving3(false);
    }
  };

  const submitPlan4 = async (fd) => {
    try {
      if (!puedeConfigurar(4)) {
        showError("Solo puedes configurar la vista de tu plan actual.");
        return;
      }
      setSaving4(true);
      await axiosClient.post(`/admin/sitios/${store.id}/plan-4/update`, fd);
      await fetchDefaults();
      setOpen4(false);
      showSuccess?.("Guardado correctamente (Plan Avanzado)") || alert("Guardado (Plan Avanzado)");
    } catch {
      showError("No se pudo guardar el Plan Avanzado.");
    } finally {
      setSaving4(false);
    }
  };

  if (loading) return <Typography sx={{ px: 2, py: 1 }}>Cargando…</Typography>;
  if (!store) return null;

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Encabezado */}
        <Box mb={2.5} display="flex" flexWrap="wrap" alignItems="center" gap={1.5} justifyContent="space-between">
          <Typography variant="h5" fontWeight={800}>🌐 Mi Sitio Web</Typography>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Chip label={isExpired ? "Plan inactivo" : "Plan activo"} color={isExpired ? "error" : "success"} variant="outlined" sx={{ fontWeight: 700 }}/>
            <Chip label={plan?.nombre || `Plan ${store.plan_id}`} color="primary" variant="outlined" sx={{ fontWeight: 700 }}/>
          </Stack>
        </Box>

        {/* Tarjetas */}
        <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center" alignItems="stretch">
          {VISTAS.map((v) => {
            const habilitado = puedeConfigurar(v.id);
            const esActual = esPlanActual(v.id);

            return (
              <Grid item xs={12} sm={6} md={6} lg={5} key={v.id}>
                <Card
                  elevation={habilitado ? 8 : 1}
                  sx={{
                    height: "100%", borderRadius: 3, overflow: "hidden", position: "relative",
                    bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#fff",
                    transition: "transform .18s ease, box-shadow .18s ease",
                    "&:hover": { transform: habilitado ? "translateY(-3px)" : "none", boxShadow: habilitado ? 12 : 2 },
                    opacity: habilitado ? 1 : 0.9,
                    filter: habilitado ? "none" : "grayscale(10%)",
                    border: `2px solid ${habilitado ? theme.palette.success.light : theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ height: 10, width: "100%", background: v.gradient }} />
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack direction="row" spacing={2} alignItems="center" mb={1.5} flexWrap="wrap">
                      <Box sx={{ width: 56, height: 56, borderRadius: 2, display: "grid", placeItems: "center", color: "#fff", background: v.gradient, boxShadow: "0 6px 18px rgba(0,0,0,.2)" }}>
                        {v.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={800} lineHeight={1.1}>{v.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.subtitulo}</Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" color="text.primary" sx={{ opacity: 0.9 }}>
                      {v.descripcion}
                    </Typography>

                    <Box mt={2}>
                      {habilitado ? (
                        <Chip icon={<CheckCircleIcon />} label="Plan actual" color="success" variant="outlined" sx={{ fontWeight: 700 }}/>
                      ) : (
                        <Chip icon={<LockOutlinedIcon />} label={isExpired ? "Plan vencido" : "No disponible"} color="default" variant="outlined" sx={{ fontWeight: 700 }}/>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: { xs: 2.5, md: 3 }, pt: 0 }}>
                    <Tooltip
                      placement="top"
                      enterTouchDelay={0}
                      leaveTouchDelay={2500}
                      title={
                        habilitado
                          ? "Editar/Configurar esta vista"
                          : isExpired
                          ? "Tu plan está vencido. Renueva para habilitar."
                          : "Solo puedes configurar la vista de tu plan actual."
                      }
                    >
                      <span style={{ width: "100%" }}>
                        <Button
                          fullWidth size="large"
                          variant={habilitado ? "contained" : "outlined"}
                          color={habilitado ? "primary" : "inherit"}
                          onClick={() => handleSelect(v.id)}
                          disabled={!habilitado}
                          sx={{ fontWeight: 800, py: 1.2, borderRadius: 2 }}
                        >
                          {habilitado ? "CONFIGURAR" : "BLOQUEADO"}
                        </Button>
                      </span>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Diálogo Renovar */}
      <Dialog open={openRenovar} onClose={() => setOpenRenovar(false)} fullWidth maxWidth="md" fullScreen={isXs}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Renovar / Actualizar plan
          <IconButton aria-label="close" onClick={() => setOpenRenovar(false)} sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Renovar />
        </DialogContent>
      </Dialog>

      {/* Modales */}
      <ModalPlanNegocio
        open={open2}
        onClose={() => setOpen2(false)}
        onSubmit={submitPlan2}
        storeId={store?.id}
        defaultValues={defaults}
        saving={saving2}
      />
      <ModalPlanProfesional
        open={open3}
        onClose={() => setOpen3(false)}
        onSubmit={submitPlan3}
        storeId={store?.id}
        defaultValues={defaults}
        saving={saving3}
      />
      <ModalPlanAvanzado
        open={open4}
        onClose={() => setOpen4(false)}
        onSubmit={submitPlan4}
        storeId={store?.id}
        defaultValues={defaults}
        saving={saving4}
      />
    </>
  );
}
