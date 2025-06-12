import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Room as RoomIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LandingContactSection = () => {
  return (
    <Box
      id="contact"
      sx={{
        py: 10,
        px: { xs: 2, md: 8 },
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        mb={1}
        color="#0077B6"
      >
        ¿Listo para comenzar?
      </Typography>
      <Typography textAlign="center" mb={4}>
        Contáctanos hoy y descubre cómo podemos transformar tu negocio 🚀
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Información de contacto */}
        <Grid item xs={12} md={3}>
          <Box display="flex" flexDirection="column" gap={4} px={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <EmailIcon sx={{ color: "#0077B6" }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Email
                </Typography>
                <Typography>contacto@telorecargo.com</Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <PhoneIcon sx={{ color: "#0077B6" }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Teléfono
                </Typography>
                <Typography>+52 (744) 218 8925</Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <RoomIcon sx={{ color: "#0077B6" }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Ubicación
                </Typography>
                <Typography>
                  Carretera Cayaco Puerto Marques Oficina 106 A,
                </Typography>
                <Typography>
                  El Coloso, 39810, Acapulco de Juárez, Gro.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Formulario */}
        <Grid item xs={12} md={9}>
          <Paper
            elevation={6}
            sx={{
              background: "linear-gradient(135deg, #0077B6, #00B4D8)",
              p: 5,
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              color="#ffffff"
              mb={3}
              textAlign="center"
            >
              ✍️ Envíanos un mensaje
            </Typography>
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Nombre"
                fullWidth
                variant="filled"
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Email"
                fullWidth
                variant="filled"
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Teléfono"
                fullWidth
                variant="filled"
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Mensaje"
                multiline
                rows={4}
                fullWidth
                variant="filled"
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                sx={{
                  backgroundColor: "#023E8A",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "25px",
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "#0077B6",
                  },
                }}
              >
                Enviar Mensaje
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Mapa */}
        <Grid item xs={12} md={10}>
          <Box
            sx={{
              height: 350,
              mt: 6,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            <MapContainer
              center={[16.8531, -99.8237]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[16.8531, -99.8237]}>
                <Popup>📍 Aquí nos encuentras</Popup>
              </Marker>
            </MapContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandingContactSection;
