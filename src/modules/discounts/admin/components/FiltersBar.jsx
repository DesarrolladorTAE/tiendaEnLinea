import React from "react";
import {
  Paper,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const COLORS = {
  black: "#000000",
};

export function FiltersBar({ q, status, loading, onQ, onStatus, onSearch }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.08)}`,
        background: "#fff",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Buscador */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                background: "#fff",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ opacity: 0.7 }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Estado"
            value={status}
            onChange={(e) => onStatus(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                background: "#fff",
              },
            }}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="inactive">Inactivas</MenuItem>
          </TextField>
        </Grid>

        {/* Botón buscar */}
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            onClick={onSearch}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <SearchRoundedIcon />
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: COLORS.black,
              boxShadow: "none",
              py: 1.1,
              "&:hover": {
                bgcolor: alpha(COLORS.black, 0.85),
                boxShadow: "none",
              },
            }}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}