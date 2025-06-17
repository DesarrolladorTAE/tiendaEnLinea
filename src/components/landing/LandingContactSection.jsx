import React, { useState } from "react";
import { Box, Grid, Typography, TextField, Button, Paper } from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Room as RoomIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import axios from "../../axiosConfig";
import Swal from "sweetalert2";

const LandingContactSection = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [respuesta, setRespuesta] = useState(null);

  const handleSubmit = async () => {
    setEnviando(true);

    try {
      await axios.post("/contacto", {
        nombre,
        email,
        telefono,
        mensaje,
      });

      Swal.fire({
        icon: "success",
        title: "¡Mensaje enviado!",
        text: "Nos pondremos en contacto contigo pronto.",
        confirmButtonColor: "#0077B6",
      });

      setNombre("");
      setEmail("");
      setTelefono("");
      setMensaje("");
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al enviar tu mensaje. Inténtalo más tarde.",
        confirmButtonColor: "#0077B6",
      });
    } finally {
      setEnviando(false);
    }
  };

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
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Email"
                fullWidth
                variant="filled"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Teléfono"
                fullWidth
                variant="filled"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                sx={{
                  backgroundColor: "#ffffffdd",
                  borderRadius: 1,
                }}
              />
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={enviando}
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
                {enviando ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandingContactSection;
