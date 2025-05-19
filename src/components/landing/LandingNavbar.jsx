import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Box,
  Link,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import AppsIcon from "@mui/icons-material/Apps";
import InfoIcon from "@mui/icons-material/Info";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import HelpIcon from "@mui/icons-material/Help";
import { Link as RouterLink } from "react-router-dom";

const sections = [
  { label: "Inicio", href: "#home", icon: <HomeIcon /> },
  { label: "Funciones", href: "#features", icon: <AppsIcon /> },
  { label: "Uso", href: "#about", icon: <InfoIcon /> },
  { label: "Recargas y Paquetes", href: "#pricing", icon: <MonetizationOnIcon /> },
  { label: "Testimonios", href: "#testimonials", icon: <EmojiPeopleIcon /> },
  { label: "FAQ", href: "#faqs", icon: <HelpIcon /> },
];

const LandingNavbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: scrolled ? "#023E8A" : "#0077B6",
          transition: "background-color 0.3s ease",
          boxShadow: scrolled ? 3 : 0,
          py: 1,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#fff" }}>
            TeLoRecargo
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
            {!isMobile &&
              sections.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  underline="none"
                  sx={{
                    fontWeight: 500,
                    fontSize: "1rem",
                    color: "#fff",
                    transition: "0.3s",
                    "&:hover": { color: "#90E0EF" },
                  }}
                >
                  {item.label}
                </Link>
              ))}

            <Button
              component={RouterLink}
              to="/loginmui"
              variant="contained"
              sx={{
                backgroundColor: "#00B4D8",
                px: 4,
                fontWeight: "bold",
                borderRadius: "50px",
                color: "#fff", // asegúrate de que el color sea blanco por defecto
                animation: "riseIn 0.6s ease-out forwards",
                transform: "translateY(20px)",
                opacity: 0,
                "&:hover": {
                  backgroundColor: "#be4bdb",
                  color: "#fff", // <== ESTO es clave para que no se vuelva invisible
                },
              }}
            >
              Registrarse
            </Button>


            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{ color: "#fff" }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Responsive */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: 270,
            backgroundColor: "#1b2a41",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 56px)",
            marginTop: "56px",
            [theme.breakpoints.up("sm")]: {
              height: "calc(100vh - 64px)",
              marginTop: "64px",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 3,
            pb: 2,
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/img/logo1.png"
            alt="TeLoRecargo Logo"
            style={{ width: "120px", maxHeight: "60px", objectFit: "contain" }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", py: 2 }}>
          <List>
            {sections.map((item) => (
              <ListItem
                key={item.href}
                component="a"
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                sx={{ cursor: "pointer" }}
              >

                <ListItemIcon sx={{ minWidth: 35, color: "#90e0ef" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: "bold",
                    fontSize: "1rem",
                    color: "#ffffff",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          <Typography variant="body2" color="gray" mb={1}>
            Soporte de 9am a 6pm (L-V)
          </Typography>
          <Typography variant="body2" color="gray">
            contacto@telorecargo.com
          </Typography>
          <Typography variant="caption" color="gray" display="block" mt={2}>
            © {new Date().getFullYear()} TeLoRecargo
          </Typography>
        </Box>
      </Drawer>

      {/* Spacer */}
      <Toolbar />
    </>
  );
};

export default LandingNavbar;
