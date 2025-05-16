import React from "react";
import {
  Box,
  Typography,
  Grid,
  Link,
  IconButton,
  Container
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";

const LandingFooterSection = () => {
  return (
    <Box sx={{ backgroundColor: "#2d3e50", color: "#fff", py: 6, mt: 10 }}>
      <Container>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold">Telorecargo</Typography>
            <Typography variant="body2" color="gray">
              Plataforma confiable para enviar recargas y gestionar tus clientes.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold">Enlaces</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Link href="#features" color="inherit" underline="hover">Funciones</Link>
              <Link href="#pricing" color="inherit" underline="hover">Precios</Link>
              <Link href="#faqs" color="inherit" underline="hover">FAQ</Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold">Síguenos</Typography>
            <Box mt={1}>
              <IconButton color="inherit" href="https://facebook.com">
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" href="https://wa.me/5217442188925">
                <WhatsAppIcon />
              </IconButton>
              <IconButton color="inherit" href="https://instagram.com">
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Box mt={4} textAlign="center" color="gray">
          <Typography variant="body2">
            © {new Date().getFullYear()} Telorecargo. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooterSection;
