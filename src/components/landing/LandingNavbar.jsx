import React from "react";
import { AppBar, Toolbar, Button, Box, Link } from "@mui/material";

const sections = [
  { label: "Inicio", href: "#home" },
  { label: "Funciones", href: "#features" },
  { label: "Nosotros", href: "#about" },
  { label: "Precios", href: "#pricing" },
  { label: "Testimonios", href: "#testimonials" },
  { label: "FAQ", href: "#faqs" },
];

const LandingNavbar = () => {
  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#00C2FF", py: 1 }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box component="img" src="/assets/img/logo1.png" height={40} alt="Telorecargo" />

        <Box display="flex" gap={3}>
          {sections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              underline="none"
              color="inherit"
              sx={{ fontWeight: 500 }}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="contained" sx={{ backgroundColor: "#D94DFF", ml: 2 }}>
            Registrarse
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default LandingNavbar;
