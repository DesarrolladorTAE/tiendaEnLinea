import React from "react";
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

function UniformReportCard({ title, description, icon, onClick, disabled = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const stroke = alpha(theme.palette.divider, 0.7);
  const base = isDark ? alpha("#0b1020", 0.6) : alpha("#ffffff", 0.8);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 18,
        border: `1px solid ${stroke}`,
        background: base,
        display: "flex",
        flexDirection: "column",
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isDark
            ? `0 10px 30px ${alpha("#000", 0.4)}`
            : `0 10px 30px ${alpha("#000", 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.45),
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          p: 0,
          "&:focus-visible": {
            outline: `2px solid ${alpha(theme.palette.primary.main, 0.7)}`,
            outlineOffset: 4,
            borderRadius: 16,
          },
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            p: 3,
            width: "100%",
          }}
        >
          {/* Header compacto */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                background: `linear-gradient(140deg, ${alpha(
                  theme.palette.primary.main,
                  0.12
                )}, ${alpha(theme.palette.primary.main, 0.04)})`,
                boxShadow: `inset 0 2px 10px ${alpha("#000", 0.08)}`,
              }}
            >
              {icon}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 0.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: 0.2,
                }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {description}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Footer sutil */}
          <Box sx={{ mt: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">
              Abrir reporte
            </Typography>
            <Box
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                fontSize: 12,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
              }}
            >
              Ver detalles
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Reportes() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Reporte de Utilidades por Sucursal",
      description: "Visualiza las utilidades por punto de venta.",
      icon: <AssessmentIcon sx={{ fontSize: 30 }} />,
      route: "/admin/reportes/ventas",
    },
    {
      title: "Reporte de Ventas",
      description: "Consulta ventas por fecha, sucursal y forma de pago.",
      icon: <ReceiptLongIcon sx={{ fontSize: 30 }} />,
      route: "/admin/reportes/tipo-venta",
    },
    {
      title: "Inventario",
      description: "Consulta tu inventario actualizado 24/7.",
      icon: <ReceiptLongIcon sx={{ fontSize: 30 }} />,
      route: "/admin/reportes/inventario",
    },
    {
      title: "Más reportes en camino",
      description: "Pronto añadiremos más reportes útiles.",
      icon: <HourglassEmptyIcon sx={{ fontSize: 30 }} />,
      route: null,
      disabled: true,
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        minHeight: "100%",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha("#0b1020", 1)} 0%, ${alpha("#0b1020", 0.9)} 100%)`
            : `linear-gradient(180deg, ${alpha("#f8fafc", 1)} 0%, ${alpha("#f1f5f9", 0.9)} 100%)`,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 700,
          letterSpacing: 0.3,
          mb: 3,
        }}
      >
        📓 Reportes
      </Typography>

      {/* Grid uniforme: todas las tarjetas misma altura */}
      <Grid container spacing={3}>
        {items.map((it, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${it.title}-${idx}`}>
            <Box sx={{ height: "100%" }}>
              <UniformReportCard
                title={it.title}
                description={it.description}
                icon={it.icon}
                disabled={!!it.disabled}
                onClick={() => it.route && navigate(it.route)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
