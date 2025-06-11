import React from "react";
import {
  Box,
  Typography,
  Grid,
  Link,
  IconButton,
  Container,
  Divider,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PinterestIcon from "@mui/icons-material/Pinterest";

const LandingFooterSection = ({ showLinks = true }) => {
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
            <Typography variant="body2" color="white" fontSize={16}>
              Plataforma confiable para enviar recargas electrónicas, gestionar
              contactos y mantener el control de tu negocio móvil.
            </Typography>
          </Grid>

          {/* Enlaces condicionales */}
          {showLinks && (
            <Grid item xs={12} sm={6} md={4} textAlign={{ xs: "center", md: "left" }}>
              <Typography variant="h6" fontWeight="bold" mb={1} color="#00bfff">
                Enlaces
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Link href="#features" color="inherit" underline="hover">
                  Funciones
                </Link>
                <Link href="#pricing" color="inherit" underline="hover">
                  Recargas y Paquetes
                </Link>
                <Link href="#faqs" color="inherit" underline="hover">
                  Testimonios
                </Link>
                <Link href="/terminos-condiciones" color="inherit" underline="hover">
                  Términos y Condiciones
                </Link>
                <Link href="/contact" color="inherit" underline="hover">
                  Contáctanos
                </Link>
              </Box>
            </Grid>
          )}

          {/* Redes Sociales y Soporte */}
          <Grid item xs={12} sm={6} md={4} textAlign={{ xs: "center", md: "left" }}>
            <Typography variant="h6" fontWeight="bold" mb={1} color="#00bfff">
              Síguenos
            </Typography>
            <Box
              display="flex"
              justifyContent={{ xs: "center", md: "flex-start" }}
              gap={1}
              mb={2}
            >
              <IconButton
                color="inherit"
                href="https://facebook.com/TAELADTI"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#3b5998" },
                }}
              >
                <FacebookIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://wa.me/527442188925"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#25D366" },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://www.instagram.com/taeladmx/"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#E4405F" },
                }}
              >
                <InstagramIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://twitter.com/TAELAD2?s=09"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#1DA1F2" },
                }}
              >
                <TwitterIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://youtube.com/channel/UCZqj4INBI_M6b8b9O3Y3H5w"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#FF0000" },
                }}
              >
                <YouTubeIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://www.pinterest.com.mx/TAELADMX/_created/"
                target="_blank"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)", color: "#E60023" },
                }}
              >
                <PinterestIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Box>
            <Typography variant="body2" color="white" fontSize={16}>
              Soporte disponible de 9am a 5pm (L-V)
            </Typography>
            <Typography variant="body2" color="white" fontSize={16}>
              contacto@telorecargo.com
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Footer final */}
        <Box textAlign="center">
          <Typography variant="body2" color="white" fontSize={16}>
            © {new Date().getFullYear()} TeLoRecargo. Desarrollado por{" "}
            <Link
              href="https://tecnologiasadministrativas.com/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="white"
              fontWeight="bold"
            >
              TAE
            </Link>
            . Todos los derechos reservados.
          </Typography>

          <Box
            component="img"
            src="/assets/img/logotaeblanco.png"
            alt="TAE sitio web"
            sx={{ width: 75, height: 75 }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooterSection;
