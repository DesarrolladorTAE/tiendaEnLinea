import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Box,
  Container,
  Divider,
  Typography,
  Link as MuiLink
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NavMenu from "../../components/header/NavMenu";
import IconGroup from "../../components/header/IconGroup";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import FlashOnIcon from "@mui/icons-material/FlashOn";

const HeaderOne = ({
  layout,
  top,
  borderStyle,
  headerPaddingClass,
  headerPositionClass,
  headerBgClass
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(prev => !prev);

  const currency = useSelector((state) => state.currency);
  const user = useSelector((state) => state.user.user);

  const saldo = Number(user?.saldo) || 0;
  const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
  const isBajoSaldo = saldo < 100;

  return (
    <>
      {/* AppBar completamente fijo y menos ancho */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#00B4F0",
          color: "#fff",
          zIndex: 1201,
          boxShadow: 2,
          transition: "all 0.3s ease"
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              minHeight: { xs: 80, md: 100 },
              px: { xs: 2, md: 4 },
              position: "relative"
            }}
          >
            {/* IZQUIERDA: Botón hamburguesa */}
            <Box sx={{ position: "absolute", left: 0 }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer}
                sx={{ p: 1 }} // padding más ajustado
              >
                <MenuIcon sx={{ fontSize: 34 }} /> {/* aquí defines el tamaño exacto */}
              </IconButton>

            </Box>

            {/* CENTRO: Logo */}
            <Box sx={{ display: "flex", justifyContent: "center", flexGrow: 1 }}>
              <Link to="/home-fashion-three">
                <Box
                  component="img"
                  src="/assets/img/logo/logo.png"
                  alt="Logo"
                  sx={{ height: 48, opacity: 0.9 }}
                />
              </Link>
            </Box>

            {/* DERECHA: Saldo y Bienvenida */}
            {user && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  textAlign: "right",
                  gap: 0.5
                }}
              >
                {/* 💰 SALDO */}
                <Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MonetizationOnIcon fontSize="small" />
                  El saldo de tu Cartera es{" "}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 700,
                      color: isBajoSaldo ? "#f44336" : "#00e676"
                    }}
                  >
                    {currency.currencySymbol + saldoConvertido}
                  </Box>
                </Typography>

                {/* 🔋 BOTÓN DE RECARGA */}
                {isBajoSaldo && (
                  <Button
                    component={Link}
                    to="/recargar-saldo"
                    size="small"
                    variant="contained"
                    startIcon={<FlashOnIcon />}
                    sx={{
                      mt: 0.5,
                      backgroundColor: "#9c27b0",
                      textTransform: "none",
                      fontWeight: 600,
                      ":hover": { backgroundColor: "#7b1fa2" }
                    }}
                  >
                    Recarga ahora
                  </Button>
                )}

                {/* 👤 BIENVENIDA */}
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccountCircleIcon fontSize="small" />
                  Bienvenido, <strong> {user.name} {user.apellidos}</strong>
                </Typography>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Contenido necesita margen para no quedar debajo del header */}
      <Box sx={{ mt: { xs: 10, md: 12 } }} />

      {/* Drawer lateral izquierdo */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            backgroundColor: "#fff",
            color: "#333",
            paddingX: 2,
            paddingY: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%"
          }
        }}
      >
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Link to="/home-fashion-three" onClick={toggleDrawer}>
              <Box
                component="img"
                src="/assets/img/logo/logo.png"
                alt="Logo"
                sx={{ height: 40, opacity: 0.8 }}
              />
            </Link>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "bold", color: "text.secondary", px: 2, mb: 1 }}
          >
            Navegación
          </Typography>
          <NavMenu sidebarMenu />

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "bold", color: "text.secondary", px: 2, mb: 1 }}
          >
            Acciones
          </Typography>
          <Box sx={{ px: 1 }}>
            <IconGroup />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

HeaderOne.propTypes = {
  borderStyle: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  layout: PropTypes.string,
  top: PropTypes.string
};

export default HeaderOne;
