import React from "react";
import { Box, Grid, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ReporteVentas from "../../components/ventas/ReporteVentas.jsx";



export default function Reportes() {
  const navigate = useNavigate();

  const tarjetas = [
    {
      titulo: "Reporte de Utilidades por Sucursal",
      descripcion: "Visualiza las utilidades por punto de venta.",
      icono: <AssessmentIcon sx={{ fontSize: 48, color: "#43a047" }} />,
      ruta: "/admin/reportes/ventas",
    },
    {
      titulo: "Más reportes en camino",
      descripcion: "Estamos trabajando para ofrecerte más reportes útiles pronto.",
      icono: <HourglassEmptyIcon sx={{ fontSize: 48, color: "#9e9e9e" }} />,
      ruta: null,
      disabled: true,
    },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
       📓 Reportes
      </Typography>

      <Grid container spacing={5}>
        {tarjetas.map((tarjeta, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                boxShadow: 3,
                borderRadius: 2,
                opacity: tarjeta.disabled ? 0.6 : 1,
                pointerEvents: tarjeta.disabled ? "none" : "auto",
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (tarjeta.ruta) navigate(tarjeta.ruta);
                }}
              >
                <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 4, py: 5}}>
                  {tarjeta.icono}
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {tarjeta.titulo}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", mt: 1 }}
                  >
                    {tarjeta.descripcion}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
