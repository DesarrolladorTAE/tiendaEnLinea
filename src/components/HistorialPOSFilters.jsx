import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

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
}) {
  const theme = useTheme();

  const fieldSx = {
    minWidth: { xs: "100%", md: 170 },
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      bgcolor: "background.paper",
      fontWeight: 700,
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: 5,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(135deg, rgba(15,23,42,.025), rgba(255,255,255,.98))",
        boxShadow: "0 18px 45px rgba(15,23,42,.06)",
      }}
    >
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
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <FilterAltRoundedIcon />
            </Box>

            <Box>
              <Typography fontWeight={950} fontSize={18}>
                Filtros de consulta
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Filtra movimientos por fecha y método de pago.
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={loading ? "Consultando..." : "Listo para consultar"}
            color={loading ? "warning" : "success"}
            variant="outlined"
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems="stretch"
          flexWrap="wrap"
          useFlexGap
        >
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
            sx={{
              ...fieldSx,
              minWidth: { xs: "100%", md: 210 },
            }}
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
              ml: { md: "auto" },
              width: { xs: "100%", md: "auto" },
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
              }}
            >
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}