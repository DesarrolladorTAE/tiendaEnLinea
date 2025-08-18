import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";

import axiosClient from "../../config/axiosClient";
import { showError } from "../../utils/alerts";
import planes from "../../utils/planes";
import Renovar from "../../pages/other/Renovar";

// Config de las cuatro vistas
const VISTAS = [
  {
    id: 1,
    minPlan: 1,
    titulo: "👀 Plan Demo",
    subtitulo: "Catálogo básico",
    descripcion: "Vista simple para mostar y cargar tus primeros productos.",
    icon: <VisibilityOutlinedIcon fontSize="large" />,
    gradient: "linear-gradient(135deg, #2ecc71, #27ae60)",
  },
  {
    id: 2,
    minPlan: 2,
    titulo: "🏪 Plan Negocio",
    subtitulo: "Perfil de Tienda",
    descripcion: "Presentacion de tu tienda, destacar colecciones y productos.",
    icon: <StorefrontOutlinedIcon fontSize="large" />,
    gradient: "linear-gradient(135deg, #6a11cb, #2575fc)",
  },
  {
    id: 3,
    minPlan: 3,
    titulo: "⭐ Plan Profesional",
    subtitulo: "Conoce y Explora",
    descripcion: "Plan Negocio + Carrusel de Imagenes despues de productos.",
    icon: <WorkspacePremiumOutlinedIcon fontSize="large" />,
    gradient: "linear-gradient(135deg, #f7971e, #ffd200)",
  },
  {
    id: 4,
    minPlan: 4,
    titulo: "🚀 Plan Avanzado",
    subtitulo: "Premium y Escalable",
    descripcion: "Landing Page 100% completa editable 24/7 los 365 dias.",
    icon: <RocketLaunchOutlinedIcon fontSize="large" />,
    gradient: "linear-gradient(135deg, #ff416c, #ff4b2b)",
  },
];

export default function SelectorVistasTienda({ onSelect }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [store, setStore] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openRenovar, setOpenRenovar] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get("/perfil/mi-tienda")
      .then((res) => {
        const s = res.data;
        setStore(s);

        const p = planes.find((pl) => pl.plan_id === s.plan_id) || {
          plan_id: s.plan_id,
          nombre: `Plan ${s.plan_id}`,
          beneficios: [],
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

  const puedeUsarVista = (minPlan) => {
    if (!store) return false;
    if (isExpired) return false;
    return (store.plan_id || 1) >= minPlan;
  };

  const handleSelect = (vistaId) => {
    if (puedeUsarVista(vistaId)) {
      if (onSelect) return onSelect(vistaId);
      alert(`Vista ${vistaId} seleccionada`);
    } else {
      setOpenRenovar(true);
    }
  };

  if (loading) return <Typography sx={{ px: 2, py: 1 }}>Cargando…</Typography>;
  if (!store) return null;

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Encabezado */}
        <Box
          mb={2.5}
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          gap={1.5}
          justifyContent="space-between"
        >
          <Typography variant="h5" fontWeight={800}>
            🌐 Mi Sitio Web
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Chip
              label={isExpired ? "Plan inactivo" : "Plan activo"}
              color={isExpired ? "error" : "success"}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={plan?.nombre || `Plan ${store.plan_id}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Box>

        {/* Tarjetas centradas y responsivas */}
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          justifyContent="center"
          alignItems="stretch"
        >
          {VISTAS.map((v) => {
            const disponible = puedeUsarVista(v.minPlan);

            return (
              <Grid item xs={12} sm={6} md={6} lg={5} key={v.id}>
                <Card
                  elevation={disponible ? 6 : 1}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#fff",
                    transition: "transform .18s ease, box-shadow .18s ease",
                    "&:hover": {
                      transform: disponible ? "translateY(-3px)" : "none",
                      boxShadow: disponible ? 12 : 2,
                    },
                    opacity: disponible ? 1 : 0.9,
                    filter: disponible ? "none" : "grayscale(10%)",
                    border: `2px solid ${
                      disponible ? theme.palette.success.light : theme.palette.divider
                    }`,
                  }}
                >
                  {/* Cinta superior con gradiente */}
                  <Box
                    sx={{
                      height: 10,
                      width: "100%",
                      background: v.gradient,
                    }}
                  />

                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1.5}
                      flexWrap="wrap"
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          display: "grid",
                          placeItems: "center",
                          color: "#fff",
                          background: v.gradient,
                          boxShadow: "0 6px 18px rgba(0,0,0,.2)",
                        }}
                      >
                        {v.icon}
                      </Box>

                      <Box>
                        <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                          {v.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {v.subtitulo}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ opacity: 0.9 }}
                    >
                      {v.descripcion}
                    </Typography>

                    <Box mt={2}>
                      {disponible ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Disponible"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Chip
                          icon={<LockOutlinedIcon />}
                          label={isExpired ? "Plan vencido" : "Bloqueado"}
                          color="default"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: { xs: 2.5, md: 3 }, pt: 0 }}>
                    <Tooltip
                      placement="top"
                      enterTouchDelay={0}
                      leaveTouchDelay={2500}
                      title={
                        disponible
                          ? "Seleccionar esta vista"
                          : isExpired
                          ? "Tu plan está vencido. Renueva para habilitar."
                          : `Requiere al menos ${VISTAS[v.minPlan - 1]?.titulo.replace("👀 ","").replace("🏪 ","").replace("⭐ ","").replace("🚀 ","")}`
                      }
                    >
                      <span style={{ width: "100%" }}>
                        <Button
                          fullWidth
                          size="large"
                          variant={disponible ? "contained" : "outlined"}
                          color={disponible ? "primary" : "inherit"}
                          onClick={() => handleSelect(v.id)}
                          disabled={!disponible}
                          sx={{
                            fontWeight: 800,
                            py: 1.2,
                            borderRadius: 2,
                          }}
                        >
                          {disponible ? "SELECCIONAR" : "ACTUALIZAR PLAN"}
                        </Button>
                      </span>
                    </Tooltip>
                  </CardActions>

                  {/* Esquinero visual si es la vista mínima de su plan */}
                  {store.plan_id === v.minPlan && (
                    <Chip
                      label="Recomendado"
                      color="secondary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        fontWeight: 700,
                        background:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,.08)"
                            : "rgba(0,0,0,.04)",
                        backdropFilter: "blur(6px)",
                      }}
                    />
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Modal de Renovación/Upgrade (fullscreen en móvil) */}
      <Dialog
        open={openRenovar}
        onClose={() => setOpenRenovar(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isXs}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Renovar / Actualizar plan
          <IconButton
            aria-label="close"
            onClick={() => setOpenRenovar(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Renovar />
        </DialogContent>
      </Dialog>
    </>
  );
}
