import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

export default function HistorialPOSFilters({
  sucursalLabel = "Sucursal #6",
  puntoVenta = "",
  setPuntoVenta,
  trabajadores = [],
  trabajadorId = "",
  setTrabajadorId,
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
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 0,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "#efefef",
      }}
    >
      <Box sx={{ px: { xs: 1.2, md: 2 }, py: 1.25 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.25 }}
        >

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: "none", md: "block" } }}
          >
            Configura los filtros para consultar el historial
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          alignItems="stretch"
          flexWrap="wrap"
        >
          

          <TextField
            select
            size="small"
            label="Modo"
            value={modoConsulta}
            onChange={(e) => setModoConsulta(e.target.value)}
            sx={{
              minWidth: { xs: "100%", md: 130 },
              bgcolor: "white",
            }}
          >
            <MenuItem value="dia">Día</MenuItem>
            <MenuItem value="personalizada">Rango</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="date"
            label="Fecha inicio"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            sx={{
              minWidth: { xs: "100%", md: 165 },
              bgcolor: "white",
            }}
          />

          <TextField
            size="small"
            type="date"
            label="Fecha fin"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            sx={{
              minWidth: { xs: "100%", md: 165 },
              bgcolor: "white",
            }}
          />

          <TextField
            select
            size="small"
            label="Pago"
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value)}
            sx={{
              minWidth: { xs: "100%", md: 180 },
              bgcolor: "white",
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="efectivo">Efectivo</MenuItem>
            <MenuItem value="transferencia">Transferencia</MenuItem>
            <MenuItem value="tc">Tarjeta crédito</MenuItem>
            <MenuItem value="td">Tarjeta débito</MenuItem>
          </TextField>

          <Stack
            direction="row"
            spacing={1}
            sx={{ ml: { md: "auto" } }}
            alignItems="center"
          >
            <Button
              variant="contained"
              onClick={onApply}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                minWidth: 110,
              }}
            >
              {loading ? "Cargando..." : "Aplicar"}
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              onClick={onClear}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Limpiar
            </Button>

            <IconButton onClick={onApply}>
              <ReplayIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}