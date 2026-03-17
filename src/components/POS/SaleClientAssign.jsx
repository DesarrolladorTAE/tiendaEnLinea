import React from "react";
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
} from "@mui/material";

export default function SaleClientAssign({
  clients = [],
  value = null,
  onChange,
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Cliente de la venta
      </Typography>

      <Autocomplete
        options={clients}
        value={value}
        onChange={(_, newValue) => onChange?.(newValue)}
        getOptionLabel={(option) => option?.nombre_alias || ""}
        isOptionEqualToValue={(option, val) => Number(option.id) === Number(val.id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Seleccionar cliente"
            placeholder="Buscar por alias"
            fullWidth
          />
        )}
      />
    </Box>
  );
}