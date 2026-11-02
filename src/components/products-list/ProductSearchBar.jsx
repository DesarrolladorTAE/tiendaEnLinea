// src/components/admin/ProductSearchBar.jsx
import React from "react";
import { Box, FormControl, InputAdornment, MenuItem, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const ProductSearchBar = ({ searchTerm, setSearchTerm, searchField = "all", setSearchField, showOeNumber = false }) => {
  return (
    <Box className="mb-3" sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
      <TextField select label="Buscar en" size="small" value={searchField} onChange={e => setSearchField(e.target.value)}
        InputLabelProps={{ sx: { color: "#fdd835", fontWeight: 500, textShadow: "0px 0px 1px #000", "&.Mui-focused": { color: "#fdd835" } } }}
        sx={{ minWidth: { sm: 220 }, "& .MuiOutlinedInput-root": { bgcolor: "#1a1a1a", color: "#fff", borderRadius: "12px", "& fieldset": { borderColor: "#fff" }, "&:hover fieldset, &.Mui-focused fieldset": { borderColor: "#fff" }, "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(255,255,255,0.1)" } }, "& .MuiSelect-icon": { color: "#fff" } }}>
        <MenuItem value="all">Todos los campos</MenuItem>
        <MenuItem value="name">Nombre del producto</MenuItem>
        <MenuItem value="sku">SKU</MenuItem>
        {showOeNumber && <MenuItem value="oe_number">Número OE</MenuItem>}
      </TextField>
    <FormControl fullWidth>
      <TextField
        variant="outlined"
        size="small"
        label="Buscar productos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon style={{ color: "#fff" }} />
            </InputAdornment>
          ),
          style: {
            backgroundColor: "#1a1a1a", // Fondo oscuro
            color: "#fff", // Texto blanco
            borderRadius: "12px",
          },
        }}
        InputLabelProps={{
          style: {
            color: "#fdd835", // Amarillo suave
            fontWeight: 500,
            textShadow: "0px 0px 1px #000",
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#fff", // borde blanco
            },
            "&:hover fieldset": {
              borderColor: "#fff",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#fff",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.1)",
            },
          },
          input: {
            color: "#fff", // texto dentro del input
          },
        }}
      />
    </FormControl>
    </Box>
  );
};

export default ProductSearchBar;
