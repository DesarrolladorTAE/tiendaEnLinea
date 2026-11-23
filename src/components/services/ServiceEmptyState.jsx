import React from "react";
import { Box, Button, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DesignServicesRoundedIcon from "@mui/icons-material/DesignServicesRounded";

export default function ServiceEmptyState({ hasFilters, onCreate }) {
  return (
    <Box sx={{ py: 8, px: 2, textAlign: "center", color: "#adb5bd" }}>
      <DesignServicesRoundedIcon sx={{ fontSize: 64, color: "#f9b233", mb: 1 }} />
      <Typography variant="h6" fontWeight={800} color="white">
        {hasFilters ? "No encontramos servicios" : "Aún no hay servicios"}
      </Typography>
      <Typography sx={{ mt: 0.5, mb: 2 }}>
        {hasFilters ? "Prueba con otra búsqueda o filtro." : "Crea el primer servicio de esta sucursal."}
      </Typography>
      {!hasFilters && (
        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onCreate} sx={{ color: "#fff", borderColor: "#fff" }}>
          Crear servicio
        </Button>
      )}
    </Box>
  );
}
