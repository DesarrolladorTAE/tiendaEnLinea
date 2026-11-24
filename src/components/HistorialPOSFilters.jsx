import React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";

import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

export default function HistorialPOSFilters({
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  modoConsulta,
  setModoConsulta,
  tipoPago,
  setTipoPago,
  onApply,
  onClear,
  loading,
  classic = false,
}) {
  const fieldSx = classic ? {
    minWidth: 0,
    "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" },
  } : {
    minWidth: 0,
    colorScheme: "dark",
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#272c34",
      color: "#fff",
      fontWeight: 700,
      minHeight: 44,
      "& fieldset": { borderColor: "#65707d" },
      "&:hover fieldset": { borderColor: "#d0d6df" },
      "&.Mui-focused fieldset": { borderColor: "#ffc107" },
      "&.Mui-disabled fieldset": { borderColor: "#555e69" },
    },
    "& .MuiInputLabel-root, & .MuiSelect-icon": { color: "#e0e5ed" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#ffc107" },
    "& .MuiInputLabel-root.Mui-disabled": { color: "#adb6c2" },
    "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#adb6c2" },
  };

  return (
    <Box component="section" aria-labelledby="pos-history-filter-title" sx={classic ? {
      p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 5,
      background: "linear-gradient(135deg, #eee, #fff)", boxShadow: "0 18px 45px #0001",
    } : { pt: 2, borderTop: "1px solid #434953" }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: classic ? "#e3eef9" : "#3d3520",
                color: classic ? "primary.main" : "#ffd454",
              }}
            >
              <FilterAltRoundedIcon />
            </Box>

            <Box>
              <Typography id="pos-history-filter-title" component="h3" sx={{ color: classic ? "text.primary" : "#fff !important", fontWeight: 800, fontSize: classic ? 19 : 16 }}>
                Filtros de consulta
              </Typography>
              {classic && <Typography variant="body2" color="text.secondary">Filtra movimientos por fecha y método de pago.</Typography>}
            </Box>
          </Stack>

        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: classic ? "repeat(3, minmax(0, 170px)) minmax(0, 210px) minmax(0, 1fr)" : "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <TextField
            select
            size="small"
            label="Consulta"
            value={modoConsulta}
            onChange={(e) => setModoConsulta(e.target.value)}
            sx={fieldSx}
          >
            <MenuItem value="dia">Por día</MenuItem>
            <MenuItem value="personalizada">Rango personalizado</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="date"
            label="Fecha inicio"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value);

              if (modoConsulta === "dia") {
                setFechaFin(e.target.value);
              }
            }}
            sx={fieldSx}
          />

          <TextField
            size="small"
            type="date"
            label="Fecha fin"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            disabled={modoConsulta === "dia"}
            onChange={(e) => setFechaFin(e.target.value)}
            sx={fieldSx}
          />

          <TextField
            select
            size="small"
            label="Método de pago"
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value)}
            sx={fieldSx}
          >
            <MenuItem value="">Todos los métodos</MenuItem>
            <MenuItem value="efectivo">Efectivo</MenuItem>
            <MenuItem value="transferencia">Transferencia</MenuItem>
            <MenuItem value="tc">Tarjeta crédito</MenuItem>
            <MenuItem value="td">Tarjeta débito</MenuItem>
          </TextField>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              gridColumn: { xs: "1 / -1", lg: classic ? "auto" : "1 / -1" },
              justifySelf: { sm: "end" },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchRoundedIcon />}
              onClick={onApply}
              disabled={loading}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
                minHeight: 42,
                px: 2.5,
                "&.Mui-disabled": { bgcolor: "#555044", color: "#eee5cd" },
                bgcolor: classic ? "primary.main" : "#ffc107",
                color: classic ? "#fff" : "#17191c",
                "&:hover": { bgcolor: classic ? "primary.dark" : "#ffe082" },
              }}
            >
              {loading ? "Cargando..." : "Aplicar"}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ReplayRoundedIcon />}
              onClick={onClear}
              disabled={loading}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
                minHeight: 42,
                px: 2.5,
                color: classic ? "text.primary" : "#fff",
                borderColor: "#65707d",
                "&:hover": { borderColor: "#ffc107" },
                "&.Mui-disabled": { color: "#adb6c2", borderColor: "#555e69" },
              }}
            >
              Limpiar
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
