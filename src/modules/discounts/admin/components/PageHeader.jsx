import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";

export function PageHeader({
  title,
  subtitle,
  branch,
  loading,
  onBack,
  onRefresh,
  onCreate,
}) {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ md: "center" }}
      justifyContent="space-between"
    >
      <Box>
        <Typography variant="h5" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {subtitle}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
          {branch?.id ? (
            <Chip
              icon={<LocationOnRoundedIcon />}
              label={
                branch?.name ? `Sucursal: ${branch.name}` : `Sucursal #${branch.id}`
              }
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          ) : null}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center">
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
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onCreate}>
          Nuevo
        </Button>
      </Stack>
    </Stack>
  );
}