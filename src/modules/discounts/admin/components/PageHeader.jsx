import React from "react";
import {
  Box,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

export function PageHeader({
  title,
  subtitle,
  branch,
  planName,
  canUse,
  tiendaLoading,
  loading,
  onBack,
  onRefresh,
  onCreate,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.08)}`,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: COLORS.black, lineHeight: 1.1 }}
              >
                {title}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}
              >
                <Chip
                  label={
                    branch?.name ? `Sucursal: ${branch.name}` : "Sin sucursal"
                  }
                  variant="outlined"
                  sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                />

                <Chip
                  label={`Plan actual: ${planName || "Sin plan asignado"}`}
                  variant="outlined"
                  sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                />

                {!canUse ? (
                  <Chip
                    icon={<LockRoundedIcon />}
                    label="Acceso restringido"
                    variant="outlined"
                    sx={{
                      fontWeight: 900,
                      borderColor: alpha(COLORS.danger, 0.25),
                      color: COLORS.danger,
                    }}
                  />
                ) : null}

                {tiendaLoading ? (
                  <Chip
                    label="Validando plan…"
                    variant="outlined"
                    sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                  />
                ) : null}
              </Stack>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                px: 1,
                py: 0.75,
                bgcolor: "#fff",
                minWidth: { xs: "100%", md: "auto" },
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Tooltip title="Cambiar sucursal">
                <IconButton
                  onClick={onBack}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                  }}
                >
                  <ArrowBackRoundedIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Recargar">
                <span>
                  <IconButton
                    onClick={onRefresh}
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                    }}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={onCreate}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 2,
                  boxShadow: "none",
                  bgcolor: COLORS.black,
                  "&:hover": {
                    bgcolor: alpha(COLORS.black, 0.88),
                    boxShadow: "none",
                  },
                }}
              >
                Nuevo
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}