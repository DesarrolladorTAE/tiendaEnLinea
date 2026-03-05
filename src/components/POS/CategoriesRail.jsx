// src/components/POS/CategoriesRail.jsx
import React from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  Divider,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function CategoriesRail({
  categories = [],
  selectedCategoryId = null,
  onSelect,
  onClear,
}) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const selected = selectedCategoryId ?? "all";

  // ✅ Móvil: chips horizontales (scroll)
  if (!isMdUp) {
    return (
      <Paper
        sx={{
          p: 1,
          mb: 2,
          borderRadius: 3,
          background: "#fff",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          <Chip
            label="Todas"
            clickable
            onClick={onClear}
            color={selected === "all" ? "primary" : "default"}
            sx={{ fontWeight: 900 }}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              clickable
              onClick={() => onSelect?.(c.id)}
              color={String(selected) === String(c.id) ? "primary" : "default"}
              sx={{ fontWeight: 800 }}
            />
          ))}
        </Stack>
      </Paper>
    );
  }

  // ✅ Desktop: rail izquierda con scroll (sticky)
  return (
    <Paper
      sx={{
        position: "sticky",
        top: 16,
        height: "calc(100vh - 32px)",
        borderRadius: 4,
        background: "#fff",
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ fontWeight: 950, fontSize: 14, color: "#111827" }}>
          Categorías
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
          Filtra por sucursal
        </Typography>
      </Box>

      <Divider />

      <Box
        sx={{
          p: 1.5,
          overflow: "auto",
          height: "100%",
          pb: 10,
        }}
      >
        <Stack spacing={1}>
          <Chip
            label="Todas"
            clickable
            onClick={onClear}
            sx={{
              justifyContent: "flex-start",
              fontWeight: 900,
              borderRadius: 3,
              py: 2,
              ...(selected === "all"
                ? {
                    background: "linear-gradient(135deg, #111827, #374151)",
                    color: "#fff",
                    boxShadow: "0 16px 30px rgba(0,0,0,0.12)",
                  }
                : {
                    background: alpha("#111827", 0.04),
                    border: `1px solid ${alpha("#111827", 0.08)}`,
                  }),
            }}
          />

          {categories.map((c) => {
            const active = selected === c.id;
            return (
              <Chip
                key={c.id}
                label={c.name}
                clickable
                onClick={() => onSelect?.(c.id)}
                sx={{
                  justifyContent: "flex-start",
                  fontWeight: 850,
                  borderRadius: 3,
                  py: 2,
                  ...(active
                    ? {
                        background:
                          "linear-gradient(135deg, #f59e0b, #fbbf24)",
                        color: "#111827",
                        boxShadow: "0 16px 30px rgba(245,158,11,0.22)",
                        border: `1px solid ${alpha("#f59e0b", 0.35)}`,
                      }
                    : {
                        background: alpha("#111827", 0.03),
                        border: `1px solid ${alpha("#111827", 0.08)}`,
                        "&:hover": {
                          background: alpha("#111827", 0.06),
                        },
                      }),
                }}
              />
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
}
