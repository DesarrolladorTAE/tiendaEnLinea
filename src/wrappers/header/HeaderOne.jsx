import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  Drawer,
  Stack,
  Typography,
  Grid,
} from "@mui/material";

import Logo from "../../components/header/Logo";
import NavMenu from "../../components/header/NavMenu";
import IconGroup from "../../components/header/IconGroup";
import HeaderTop from "../../components/header/HeaderTop";

const HEADER_HEIGHT = 78; // ✅ ajusta 72–84 si quieres

const HeaderOne = ({
  layout,
  top,
  borderStyle,
  headerPaddingClass,
  headerPositionClass,
  headerBgClass,
}) => {
  const [elevate, setElevate] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setElevate(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDrawer = () => setDrawerOpen((s) => !s);

  return (
    <Box component="header">
      {top === "visible" && (
        <Box
          sx={{
            width: "100%",
            borderBottom: borderStyle === "fluid-border" ? "none" : "1px solid #ddd",
            backgroundColor: { xs: "#00bfff", md: "transparent" },
          }}
        >
          <HeaderTop borderStyle={borderStyle} toggleDrawer={toggleDrawer} />
        </Box>
      )}

      {/* HEADER DESKTOP */}
      <AppBar
        position="sticky"
        elevation={elevate ? 4 : 0}
        color="default"
        sx={{
          backgroundColor: headerBgClass || "#00bfff",
          display: { xs: "none", md: "block" },
          borderBottom: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <Container maxWidth={layout === "container-fluid" ? false : "lg"}>
          <Toolbar
            disableGutters
            sx={{
              height: HEADER_HEIGHT,
              minHeight: HEADER_HEIGHT,
              px: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {/* LOGO */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                height: HEADER_HEIGHT,
                flexShrink: 0, // ✅ que no se aplaste
              }}
            >
              <Logo
                imageUrl="/assets/img/logo4.png"
                height={HEADER_HEIGHT}
                maxLogoHeight={120} // ✅ ajusta 54–64
              />
            </Box>

            {/* MENÚ */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                flexGrow: 1,
                minWidth: 0, // ✅ evita que rompa layout
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <NavMenu menuWhiteClass="" />
            </Box>

            {/* ICONOS */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <IconGroup isMobile={false} />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* DRAWER MOBILE */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 270,
            backgroundColor: "#1b2a41",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
          },
        }}
      >
        {/* Logo del Drawer */}
        <Box
          sx={{
            px: 2,
            pt: 5,
            pb: 2,
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/img/logo3.png"
            alt="TeLoRecargo Logo"
            style={{
              width: "160px",
              maxHeight: "120px",
              objectFit: "contain",
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", py: 2 }}>
          <Stack spacing={3} px={2}>
            <NavMenu menuWhiteClass="" sidebarMenu />
            <Grid container spacing={2} justifyContent="center">
              <IconGroup isMobile={true} iconColor="white" grid layout />
            </Grid>
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" color="white" display="block" mt={2}>
            © {new Date().getFullYear()} TeLoRecargo
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

HeaderOne.propTypes = {
  borderStyle: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  layout: PropTypes.string,
  top: PropTypes.string,
  headerBgClass: PropTypes.string,
};

export default HeaderOne;