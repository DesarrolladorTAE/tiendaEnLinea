import React from "react";
import {
  Box,
  Typography,
  Grid,
  Link,
  IconButton,
  Container,
  Divider
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";

const LandingFooterSection = () => {
  return (
    <Box sx={{ backgroundColor: "#2d3e50", color: "#ffffff", pt: 8, pb: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} justifyContent="center">
          {/* Logo + descripción */}
          <Grid item xs={12} md={4} textAlign={{ xs: "center", md: "left" }}>
            <Box mb={2}>
              <img
                src="/assets/img/logo1.png"
                alt="TeLoRecargo Logo"
                style={{ width: 160, height: "auto" }}
              />
            </Box>
            <Typography variant="body2" color="white">
              Plataforma confiable para enviar recargas electrónicas, gestionar contactos y mantener el control de tu negocio móvil.
            </Typography>
          </Grid>

          {/* Enlaces */}
          <Grid item xs={12} sm={6} md={4} textAlign={{ xs: "center", md: "left" }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>
              Enlaces
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Link href="#features" color="inherit" underline="hover">Funciones</Link>
              <Link href="#pricing" color="inherit" underline="hover">Recargas y Paquetes</Link>
              <Link href="#faqs" color="inherit" underline="hover">Testimonios</Link>
              <Link href="/terminos" color="inherit" underline="hover">Términos y Condiciones</Link>
              <Link href="/contacto" color="inherit" underline="hover">Contáctanos</Link>
            </Box>
          </Grid>

          {/* Redes Sociales y Soporte */}
          <Grid item xs={12} sm={6} md={4} textAlign={{ xs: "center", md: "left" }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>
              Síguenos
            </Typography>
            <Box display="flex" justifyContent={{ xs: "center", md: "flex-start" }} gap={1} mb={2}>
              <IconButton
                color="inherit"
                href="https://facebook.com"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#3b5998" }
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://wa.me/5217442188925"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#25D366" }
                }}
              >
                <WhatsAppIcon />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://instagram.com"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#E4405F" }
                }}
              >
                <InstagramIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" color="gray">
              Soporte disponible de 9am a 5pm (L-V)
            </Typography>
            <Typography variant="body2" color="gray">
              desarrollo@tecnologiasadministrativas.com
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Footer final */}
        <Box textAlign="center">
          <Typography variant="body2" color="gray">
            © {new Date().getFullYear()} TeLoRecargo. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooterSection;
