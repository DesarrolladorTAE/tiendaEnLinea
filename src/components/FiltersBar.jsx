import React from "react";
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function FiltersBar({
  mes,
  folio,
  onChangeMes,
  onChangeFolio,
  onSearch,
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "linear-gradient(180deg, #f9f9fb, #ffffff)",
        boxShadow: (theme) =>
          `0 4px 12px ${
            theme.palette.mode === "dark"
              ? "rgba(0,0,0,.4)"
              : "rgba(0,0,0,.08)"
          }`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
      >
        <TextField
          label="Buscar por folio"
          value={folio}
          onChange={onChangeFolio}
          placeholder="Ej. A-000123"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={onSearch}
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: "primary.light", color: "#fff" },
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
            },
          }}
        />
      </Stack>
    </Paper>
  );
}
