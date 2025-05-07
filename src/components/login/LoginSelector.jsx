import React from "react";
import { Box, Button, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";

const LoginSelector = ({ onSelect }) => {
  return (
    <Box
      sx={{
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        px: 6,
        py: 0,
        zIndex: 2,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src="/assets/img/logo1.png"
        alt="Logo Te lo Recargo"
        sx={{
          width: 180,
          height: "auto",
          mb: 2,
          mt: -8,
        }}
      />

      {/* Título */}
      <Typography variant="h4" fontWeight="bold" color="#444" gutterBottom sx={{ mb: 3 }}>
        Iniciar Sesión
      </Typography>

      {/* Contenedor selector */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          boxShadow: 3,
          borderRadius: 4,
          overflow: "hidden",
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* Opción Usuario */}
        <Box
          sx={{
            flex: 1,
            py: 5,
            backgroundColor: "#f8f8f8",
            textAlign: "center",
          }}
        >
          <PersonIcon sx={{ fontSize: 60, color: "#444" }} />
          <Typography variant="h6" mt={1}>Usuarios</Typography>
          <Button
            variant="contained"
            onClick={() => onSelect("usuario")}
            sx={{
              mt: 2,
              bgcolor: "#999",
              fontWeight: "bold",
              borderRadius: 3,
              px: 4,
              "&:hover": { bgcolor: "#777" },
            }}
          >
            USUARIOS
          </Button>
        </Box>

        {/* Opción Agente */}
        <Box
          sx={{
            flex: 1,
            py: 5,
            backgroundColor: "#e0f8ff",
            textAlign: "center",
          }}
        >
          <HeadsetMicIcon sx={{ fontSize: 60, color: "#000" }} />
          <Typography variant="h6" mt={1}>Agentes</Typography>
          <Button
            variant="contained"
            onClick={() => onSelect("agente")}
            sx={{
              mt: 2,
              bgcolor: "#00cfff",
              fontWeight: "bold",
              borderRadius: 3,
              px: 4,
              "&:hover": { bgcolor: "#00b5e5" },
            }}
          >
            AGENTES
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginSelector;
