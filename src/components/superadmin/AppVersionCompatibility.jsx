// src/components/superadmin/AppVersionCompatibility.jsx
import React, { useMemo } from "react";
import {
  alpha,
  Box,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import AppleIcon from "@mui/icons-material/Apple";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

import {
  getOsVersions,
  getOsVersionLabel,
} from "./constants/osVersions";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

const PLATFORM_META = {
  android: {
    title: "Compatibilidad Android",
    icon: <AndroidRoundedIcon fontSize="small" />,
    color: "#15803d",
    bg: "#22c55e",
    minLabel: "Android mínimo soportado",
    targetLabel: "SDK objetivo",
  },
  ios: {
    title: "Compatibilidad iOS",
    icon: <AppleIcon fontSize="small" />,
    color: "#111827",
    bg: "#64748b",
    minLabel: "iOS mínimo soportado",
    targetLabel: "iOS objetivo",
  },
  windows: {
    title: "Compatibilidad Windows",
    icon: <DesktopWindowsRoundedIcon fontSize="small" />,
    color: "#0369a1",
    bg: "#0ea5e9",
    minLabel: "Windows mínimo soportado",
    targetLabel: "Windows objetivo",
  },
  macos: {
    title: "Compatibilidad macOS",
    icon: <LaptopMacRoundedIcon fontSize="small" />,
    color: "#6d28d9",
    bg: "#8b5cf6",
    minLabel: "macOS mínimo soportado",
    targetLabel: "macOS objetivo",
  },
};

export default function AppVersionCompatibility({
  platform,
  form,
  printerTypes,
  onChange,
  onTogglePrinterType,
}) {
  const versions = useMemo(() => getOsVersions(platform), [platform]);

  const meta = PLATFORM_META[platform] || PLATFORM_META.android;

  const minValue = form.min_os_version || versions[0]?.value || "";
  const targetValue = form.target_os_version || versions[0]?.value || "";

  const minLabel = useMemo(
    () => getOsVersionLabel(platform, minValue) || "No definido",
    [platform, minValue]
  );

  const targetLabel = useMemo(
    () => getOsVersionLabel(platform, targetValue) || "No definido",
    [platform, targetValue]
  );

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(BRAND.amber, 0.16),
            border: `1px solid ${alpha(BRAND.amber, 0.45)}`,
          }}
        >
          <PrintRoundedIcon fontSize="small" />
        </Box>

        <Box>
          <Typography fontWeight={900}>Compatibilidad</Typography>
          <Typography variant="body2" color="text.secondary">
            Define sistema soportado y tipos de impresora compatibles.
          </Typography>
        </Box>
      </Stack>

      {versions.length > 0 && (
        <>
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2.5,
              bgcolor: alpha(meta.bg, 0.06),
              border: `1px solid ${alpha(meta.bg, 0.18)}`,
            }}
          >
            <Stack
              direction="row"
              spacing={1.3}
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  color: meta.color,
                  bgcolor: alpha(meta.bg, 0.14),
                }}
              >
                {meta.icon}
              </Box>

              <Box>
                <Typography fontWeight={900}>{meta.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona la versión mínima y la versión objetivo.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label={meta.minLabel}
                  value={minValue}
                  onChange={(e) =>
                    onChange("min_os_version", e.target.value)
                  }
                >
                  {versions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                      {item.api ? ` — API ${item.api}` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label={meta.targetLabel}
                  value={targetValue}
                  onChange={(e) =>
                    onChange("target_os_version", e.target.value)
                  }
                >
                  {versions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                      {item.api ? ` — API ${item.api}` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 2 }}
            >
              <Chip
                icon={meta.icon}
                label={`Compatible desde ${minLabel}`}
                sx={{
                  fontWeight: 900,
                  color: meta.color,
                  bgcolor: alpha(meta.bg, 0.12),
                  border: `1px solid ${alpha(meta.bg, 0.22)}`,
                }}
              />

              <Chip
                label={`Objetivo: ${targetLabel}`}
                sx={{
                  fontWeight: 900,
                  color: BRAND.dark,
                  bgcolor: alpha(BRAND.amber, 0.18),
                  border: `1px solid ${alpha(BRAND.amber, 0.38)}`,
                }}
              />
            </Stack>
          </Box>

          <Divider sx={{ mb: 2 }} />
        </>
      )}

      <Typography fontWeight={900} sx={{ mb: 1 }}>
        Tipos de impresora
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {printerTypes.map((printer) => {
          const selected = form.printer_type_ids.includes(printer.id);

          return (
            <Chip
              key={printer.id}
              label={printer.name}
              onClick={() => onTogglePrinterType(printer.id)}
              sx={{
                mb: 1,
                fontWeight: 800,
                borderRadius: 2,
                border: "1px solid",
                cursor: "pointer",
                borderColor: selected ? alpha(BRAND.orange, 0.45) : "divider",
                bgcolor: selected ? alpha(BRAND.orange, 0.1) : "#fff",
                color: selected ? BRAND.orange : "text.primary",
                "&:hover": {
                  bgcolor: selected
                    ? alpha(BRAND.orange, 0.16)
                    : alpha(BRAND.amber, 0.08),
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}