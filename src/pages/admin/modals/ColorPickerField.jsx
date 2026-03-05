import React, { useMemo } from "react";
import { Box, Stack, TextField, Typography, Tooltip, IconButton } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { alpha } from "@mui/material/styles";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const PRESET_COLORS = [
  { name: "Negro", hex: "#000000" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Rojo", hex: "#EF4444" },
  { name: "Naranja", hex: "#F97316" },
  { name: "Ámbar", hex: "#F59E0B" },
  { name: "Amarillo", hex: "#EAB308" },
  { name: "Verde", hex: "#22C55E" },
  { name: "Azul", hex: "#3B82F6" },
  { name: "Morado", hex: "#8B5CF6" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Café", hex: "#92400E" },
];

async function copyToClipboard(text) {
  if (!text) return false;
  try {
    const isSecure =
      window.isSecureContext ||
      ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isSecure && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

export default function ColorPickerField({
  label,
  value,
  onChange,
  helperText = "Ejemplo: #F9B233",
  disabled = false,
}) {
  const clean = (value || "").trim();
  const isValid = !clean || HEX_RE.test(clean);

  const palette = useMemo(() => PRESET_COLORS, []);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
        <Typography sx={{ fontWeight: 900 }}>{label}</Typography>

        {!!clean ? (
          <Tooltip title="Copiar HEX">
            <IconButton
              size="small"
              onClick={() => copyToClipboard(clean)}
              disabled={disabled}
              sx={{ borderRadius: 2 }}
            >
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}

        <Box sx={{ flex: 1 }} />
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: 1,
            border: `1px solid ${alpha("#000", 0.18)}`,
            bgcolor: isValid && clean ? clean : alpha("#000", 0.04),
          }}
        />
      </Stack>

      {/* Input de texto HEX */}
      <TextField
        value={clean}
        onChange={(e) => onChange?.(e.target.value)}
        fullWidth
        disabled={disabled}
        placeholder="#F9B233"
        error={!isValid}
        helperText={!isValid ? "Color inválido. Usa formato HEX: #RGB o #RRGGBB" : helperText}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
      />

      {/* Selector tipo color */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
          Elegir con selector:
        </Typography>

        <TextField
          type="color"
          value={isValid && clean ? clean : "#000000"}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          sx={{
            width: 90,
            "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" },
          }}
        />
      </Stack>

      {/* Catálogo de colores */}
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {palette.map((c) => (
          <Tooltip key={c.hex} title={`${c.name} ${c.hex}`}>
            <Box
              onClick={() => !disabled && onChange?.(c.hex)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: 2,
                cursor: disabled ? "not-allowed" : "pointer",
                bgcolor: c.hex,
                border: `2px solid ${
                  clean?.toLowerCase() === c.hex.toLowerCase()
                    ? alpha("#000", 0.75)
                    : alpha("#000", 0.18)
                }`,
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}