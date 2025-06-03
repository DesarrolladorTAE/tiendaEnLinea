import React from "react";
import { Box, Button, Typography, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";

const LoginSelector = ({ onSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 550,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: "white",
        borderRadius: 4,
        py: 4,
        px: isMobile ? 2 : 6,
        boxShadow: 2,
        gap: 2,
      }}
    >
      <Typography variant="h5" fontWeight="bold" color="#222" mb={2}>
        Iniciar Sesión
      </Typography>

      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={isMobile ? 2 : 3}
        width="100%"
        justifyContent="center"
        alignItems="stretch"
      >
        {/* Opción Usuario */}
        <Box
          sx={{
            flex: 1,
            py: 3,
            px: 1,
            backgroundColor: "#f8f8f8",
            borderRadius: 3,
            textAlign: "center",
            boxShadow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
          }}
        >
          <PersonIcon sx={{ fontSize: 48, color: "#555" }} />
          <Typography variant="h6" fontWeight="500">
            Usuario
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSelect("usuario")}
            sx={{
              mt: 1,
              bgcolor: "#444",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { bgcolor: "#333" },
            }}
          >
            ENTRAR
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            mt={1}
            textAlign="center"
          >
            ¿Eres un usuario de TLR? 💠
            <br />
            Ingresa aquí
          </Typography>
        </Box>

        {/* Opción Agente */}
        <Box
          sx={{
            flex: 1,
            py: 3,
            px: 1,
            backgroundColor: "#e0f8ff",
            borderRadius: 3,
            textAlign: "center",
            boxShadow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
          }}
        >
          <HeadsetMicIcon sx={{ fontSize: 48, color: "#00b5e5" }} />
          <Typography variant="h6" fontWeight="500">
            Agente
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSelect("agente")}
            sx={{
              mt: 1,
              bgcolor: "#00cfff",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { bgcolor: "#00b5e5" },
            }}
          >
            ENTRAR
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            mt={1}
            textAlign="center"
          >
            ¿Un usuario de TLR te dio un acceso? 🤔
            <br />
            Ingresa aquí
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default LoginSelector;
