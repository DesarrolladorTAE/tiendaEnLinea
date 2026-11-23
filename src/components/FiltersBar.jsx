import React from "react";
import {
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Box,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";

export default function FiltersBar({
  mes,
  folio,
  onChangeMes,
  onChangeFolio,
  onSearch,
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        mb: 2,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha("#1f2937", 0.9)}, ${alpha(
                "#111827",
                0.96
              )})`
            : `linear-gradient(180deg, #fbfcff, #ffffff)`,
        boxShadow: `0 10px 30px ${
          theme.palette.mode === "dark"
            ? "rgba(0,0,0,.28)"
            : "rgba(15, 23, 42, .06)"
        }`,
      })}
    >
      <Stack spacing={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterAltRoundedIcon color="primary" fontSize="small" />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.2,
              color: "text.primary",
            }}
          >
            Filtros de búsqueda
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            label="Mes"
            type="month"
            value={mes}
            onChange={onChangeMes}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              maxWidth: { xs: "100%", md: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "background.paper",
              },
            }}
          />

          <TextField
            label="Buscar por folio"
            value={folio}
            onChange={onChangeFolio}
            placeholder="Ej. 000123"
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onSearch}
                    sx={{
                      color: "primary.main",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "primary.main",
                        color: "#fff",
                      },
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "background.paper",
              },
            }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}