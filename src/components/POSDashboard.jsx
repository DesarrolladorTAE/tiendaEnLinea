import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Button,
  CircularProgress,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HistoryIcon from "@mui/icons-material/History";
import ReplayIcon from "@mui/icons-material/Replay";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LogoutIcon from "@mui/icons-material/Logout";

import POS from "./POS";
import HistorialVentas from "./HistorialVentas";
import ComprasFacturadas from "./ComprasFacturadas";
import CancelaDevoluciones from "./CancelaDevoluciones";

const POSDashboard = ({
  posName = "Mi Punto de Venta",
  storeName = "Mi Tienda",
  posDesdeAdmin = false, // 👈 se recibe desde POSWrapper
}) => {
  const [vista, setVista] = useState("menu");
  const [loadingLogout, setLoadingLogout] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const opciones = [
    {
      id: "venta",
      titulo: "Venta",
      descripcion: "Accede al módulo principal de ventas",
      color: "#4CAF50",
      icono: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "historial",
      titulo: "Historial",
      descripcion: "Consulta todas las ventas realizadas",
      color: "#2196F3",
      icono: <HistoryIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "cancelaciones",
      titulo: "Cancelaciones / Devoluciones",
      descripcion: "Administra ventas canceladas o devueltas",
      color: "#c12b1dff",
      icono: <ReplayIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "facturas",
      titulo: "Facturas",
      descripcion: "Revisa las Ventas facturadas",
      color: "#FF9800",
      icono: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "proximamente",
      titulo: "Próximamente",
      descripcion: "Nuevas funciones en desarrollo",
      color: "#2610efff",
      icono: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      disabled: true,
    },
  ];

  const cerrarSesion = async () => {
    setLoadingLogout(true);
    setTimeout(() => {
      localStorage.removeItem("POS_TOKEN");
      if (posDesdeAdmin) {
        window.location.href = "/admin/pos";
      } else {
        window.location.href = "/prueba/pos";
      }
    }, 1200);
  };

  const renderVista = () => {
    switch (vista) {
      case "venta":
        return (
          <POS
            posName={posName}
            posDesdeAdmin={posDesdeAdmin}
            cambiarVista={setVista}
          />
        );
      case "historial":
        return <HistorialVentas cambiarVista={setVista} />;
      case "cancelaciones":
        return <CancelaDevoluciones cambiarVista={setVista} />;
      case "facturas":
        return <ComprasFacturadas cambiarVista={setVista} />;
      default:
        return (
          <Box mt={4} sx={{ flexGrow: 1, minHeight: "80vh" }}>
            <Grid
              container
              spacing={4}
              justifyContent="center"
              alignItems="center"
            >
              {opciones.map((opcion) => (
                <Grid item xs={12} sm={6} md={6} key={opcion.id}>
                  <Card
                    sx={{
                      backgroundColor: opcion.color,
                      color: "white",
                      borderRadius: 4,
                      height: 220,
                      boxShadow: 8,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      opacity: opcion.disabled ? 0.6 : 1,
                      cursor: opcion.disabled ? "default" : "pointer",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: opcion.disabled ? "none" : "scale(1.03)",
                      },
                    }}
                  >
                    <CardActionArea
                      disabled={opcion.disabled}
                      onClick={() => setVista(opcion.id)}
                      sx={{ height: "100%" }}
                    >
                      <CardContent
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          padding: 2,
                          gap: 1.5,
                          minHeight: 160,
                        }}
                      >
                        {opcion.icono}
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          align="center"
                          sx={{
                            color: opcion.disabled ? "#555" : "#fff",
                            lineHeight: 1.3,
                          }}
                        >
                          {opcion.id === "cancelaciones" ? (
                            <>
                              Cancelaciones <br /> y Devoluciones
                            </>
                          ) : (
                            opcion.titulo
                          )}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: opcion.disabled ? "#ccc" : "#f0f0f0",
                            maxWidth: 200,
                          }}
                        >
                          {opcion.descripcion}
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
  };

  return (
    <Box p={4} display="flex" flexDirection="column" minHeight="100vh">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
      >
        <Box mb={isMobile ? 2 : 0}>
          <Typography variant="h4" fontWeight="bold">
            🏪 Punto de Venta: {posName} ✅
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={
            loadingLogout ? (
              <CircularProgress size={18} color="error" />
            ) : (
              <LogoutIcon />
            )
          }
          onClick={cerrarSesion}
          disabled={loadingLogout}
        >
          {loadingLogout ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </Box>

      {renderVista()}
    </Box>
  );
};

export default POSDashboard;
