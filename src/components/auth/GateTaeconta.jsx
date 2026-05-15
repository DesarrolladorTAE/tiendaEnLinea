// src/components/auth/GateTaeconta.jsx
import React from "react";
import {
  Alert, Button, Card, CardContent, CircularProgress, Chip, Stack, Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useReglaTaeconta, {
  PLAN_TAECONTA_MIN,               // ← cambia este import
  COMPLEMENTO_TAECONTA_ID,
} from "../../hooks/useReglaTaeconta";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";

const GateTaeconta = ({ children, fallback, ignorePOS = false }) => {
  const { allowed, loading, reason, planId } = useReglaTaeconta(null, {
    ignorePOS,
  });
  const navigate = useNavigate();

  const reqPlan = planes.find((p) => p.plan_id === PLAN_TAECONTA_MIN);
  const reqPlanNombre = reqPlan?.nombre || `Plan ${PLAN_TAECONTA_MIN}`;
  const reqComp = complementos.find((c) => c.complemento_id === COMPLEMENTO_TAECONTA_ID);
  const reqCompNombre = reqComp?.nombre || `Complemento ${COMPLEMENTO_TAECONTA_ID}`;
  const currentPlan = planes.find((p) => p.plan_id === planId)?.nombre || (planId ? `Plan ${planId}` : "—");

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: "#e5e7eb" }}>Verificando permisos…</Typography>
      </Stack>
    );
  }

  if (!allowed) {
    if (fallback) return fallback;

    return (
      <Card
        sx={(theme) => ({
          backgroundColor: theme.palette.mode === "dark" ? "#111827" : "#ffffff",
          color: theme.palette.mode === "dark" ? "#fff" : "#111827",
          borderRadius: 2,
          border: `1px solid ${
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"
          }`,
        })}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Acceso restringido
          </Typography>

          <Alert
            icon={false}
            sx={(theme) => ({
              mb: 2,
              borderRadius: 2,
              border: `1px solid ${
                theme.palette.mode === "dark" ? "rgba(251,191,36,.35)" : "#FDE68A"
              }`,
              backgroundColor:
                theme.palette.mode === "dark" ? "rgba(251,191,36,.12)" : "#FFF7E6",
              color: theme.palette.mode === "dark" ? "#FDE68A" : "#92400E",
            })}
          >
            Esta sección requiere <b>{reqPlanNombre}</b> <u>o superior</u> y el complemento{" "}
            <b>{reqCompNombre}</b> activos.
          </Alert>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
            <Chip
              label={`Requisito: ${reqPlanNombre} o superior`}
              size="small"
              sx={(theme) => ({
                bgcolor: theme.palette.mode === "dark" ? "#0b1220" : "#eef2ff",
                color: theme.palette.mode === "dark" ? "#fff" : "#1e3a8a",
                border: `1px solid ${
                  theme.palette.mode === "dark" ? "rgba(255,255,255,.2)" : "#c7d2fe"
                }`,
              })}
            />
            <Chip
              label={`Requisito: ${reqCompNombre}`}
              size="small"
              sx={(theme) => ({
                bgcolor: theme.palette.mode === "dark" ? "#0b1220" : "#f0fdf4",
                color: theme.palette.mode === "dark" ? "#fff" : "#166534",
                border: `1px solid ${
                  theme.palette.mode === "dark" ? "rgba(255,255,255,.2)" : "#bbf7d0"
                }`,
              })}
            />
            <Chip
              label={`Tu plan actual: ${currentPlan}`}
              size="small"
              sx={(theme) => ({
                bgcolor: theme.palette.mode === "dark" ? "#0f172a" : "#eef2f7",
                color: theme.palette.mode === "dark" ? "#fff" : "#0f172a",
                border: `1px solid ${
                  theme.palette.mode === "dark" ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.08)"
                }`,
              })}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => navigate("/admin/membresia")}>
              Cambiar de plan
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/admin/membresia")}
              sx={(theme) => ({
                color: theme.palette.mode === "dark" ? "#fff" : undefined,
                borderColor:
                  theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : undefined,
                "&:hover": {
                  borderColor: theme.palette.mode === "dark" ? "#fff" : undefined,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : undefined,
                },
              })}
            >
              Activar complementos
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ display: "block", mt: 2, color: "rgba(255,255,255,0.6)" }}>
            Motivo: {reason}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default GateTaeconta;
