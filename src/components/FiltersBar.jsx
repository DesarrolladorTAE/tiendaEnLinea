import React from "react";
import { Box, Stack, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";

export default function FiltersBar({ mes, folio, onChangeMes, onChangeFolio, onSearch }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>

        <TextField
          label="Buscar por folio"
          value={folio}
          onChange={onChangeFolio}
          placeholder="Ej. A-000123"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
        />
      </Stack>
    </Box>
  );
}
