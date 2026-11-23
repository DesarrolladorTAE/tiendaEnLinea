import React from "react";
import { Box, Typography, Stack, Button, Chip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StoreIcon from "@mui/icons-material/Store";
import AddIcon from "@mui/icons-material/Add";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import { useTienda } from "../../context/TiendaContext";
import planes from "../../utils/planes";

const POSHeader = ({ puntosLength, limite, agregarPunto }) => {
  const { tienda } = useTienda();
  const nombrePlan = tienda?.plan_id
    ? planes.find((p) => p.plan_id === tienda.plan_id)?.nombre || `Plan ${tienda.plan_id}`
    : "Desconocido";

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      mb={3}
      gap={2}
    >
      <Typography variant="h4">Gestión de Puntos de Venta</Typography>

      <Box textAlign={{ xs: "left", md: "right" }} width="100%">
        {/* Etiquetas */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          flexWrap="wrap"
          mb={{ xs: 3, md: 1 }} // más espacio en móviles
        >
          <Chip
            icon={<StarIcon />}
            label={`Plan actual: ${nombrePlan}`}
            color="primary"
            sx={{
              fontWeight: "bold",
              bgcolor: "#2563eb",
              color: "#fff",
              px: 2,
              py: 0.5,
              fontSize: "0.9rem",
            }}
          />
          <Chip
            icon={<StoreIcon />}
            label={`Puntos usados: ${puntosLength} / ${limite === Infinity ? "∞" : limite}`}
            color="success"
            sx={{
              fontWeight: "bold",
              bgcolor: "#10b981",
              color: "#fff",
              px: 2,
              py: 0.5,
              fontSize: "0.9rem",
            }}
          />
        </Stack>

        {/* Botones */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          flexWrap="wrap"
        >
          <Button
            variant="contained"
            color="success"
            href="/prueba/pos"
            target="_blank"
            startIcon={<PointOfSaleIcon />}
            sx={{
              color: "white",
              "&:hover": { backgroundColor: "#2e7d32", color: "white" },
            }}
          >
            Ir al Punto de Venta
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={agregarPunto}
          >
            Nuevo punto
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default POSHeader;
