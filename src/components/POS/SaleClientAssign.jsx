import React from "react";
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
  Chip,
  Stack,
} from "@mui/material";

export default function SaleClientAssign({
  clients = [],
  value = null,
  onChange,
}) {
  const renderCreditStatus = (client) => {
    const acc = client?.credit_account || null;

    if (!acc?.id) {
      return (
        <Chip
          size="small"
          label="Sin fiado"
          variant="outlined"
        />
      );
    }

    if (!acc.is_active) {
      return (
        <Chip
          size="small"
          label="Fiado inactivo"
          variant="outlined"
        />
      );
    }

    if (Number(acc.current_balance) > 0) {
      return (
        <Chip
          size="small"
          color="warning"
          label={`Debe $${Number(acc.current_balance).toFixed(2)}`}
        />
      );
    }

    return (
      <Chip
        size="small"
        color="success"
        label="Fiado activo"
      />
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Cliente de la venta
      </Typography>

      <Autocomplete
        options={clients}
        value={value}
        onChange={(_, newValue) => onChange?.(newValue)}
        getOptionLabel={(option) =>
          option
            ? `${option.nombre_alias || "Cliente sin nombre"}${
                option.telefono ? ` · ${option.telefono}` : ""
              }`
            : ""
        }
        isOptionEqualToValue={(option, val) =>
          Number(option.id) === Number(val.id)
        }
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ py: 0.5, width: "100%" }}>
              <Typography sx={{ fontWeight: 800 }}>
                {option.nombre_alias || "Cliente sin nombre"}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {option.telefono || "Sin teléfono"}
              </Typography>

              <Stack direction="row" sx={{ mt: 0.7 }}>
                {renderCreditStatus(option)}
              </Stack>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Seleccionar cliente"
            placeholder="Buscar por alias o teléfono"
            fullWidth
          />
        )}
      />

      {value && (
        <Box
          sx={{
            mt: 1,
            p: 1.2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#fafafa",
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>
            {value.nombre_alias}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {value.telefono || "Sin teléfono"}
          </Typography>

          <Stack direction="row" sx={{ mt: 1 }}>
            {renderCreditStatus(value)}
          </Stack>
        </Box>
      )}
    </Box>
  );
}