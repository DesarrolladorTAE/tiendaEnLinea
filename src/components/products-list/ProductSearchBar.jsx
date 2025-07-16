// src/components/admin/ProductSearchBar.jsx
import React from "react";
import { FormControl, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const ProductSearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <FormControl fullWidth className="mb-3">
      <TextField
        variant="outlined"
        size="small"
        label="Buscar por nombre"
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
  );
};

export default ProductSearchBar;
