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

export function FiltersBar({ q, status, loading, onQ, onStatus, onSearch }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.12)}`,
        background: "#fff",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Estado"
            value={status}
            onChange={(e) => onStatus(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="inactive">Inactivas</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}