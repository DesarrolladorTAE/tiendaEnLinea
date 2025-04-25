import React from "react";
import { Box, Button, Typography } from "@mui/material";

const OverlayPanel = ({ rightPanelActive, setRightPanelActive }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: rightPanelActive ? 0 : "50%",
        width: "50%",
        height: "100%",
        background: rightPanelActive
          ? "linear-gradient(to right, #be4bdb)" // Lado izquierdo → Lila
          : "linear-gradient(to right,  #009dff)", // Lado derecho → Azul
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        px: 4,
        transition: "left 0.6s ease-in-out, background 0.6s ease-in-out",
        zIndex: 3,
        borderRadius: 4,
      }}
    >
      {rightPanelActive ? (
        <>
          <Typography variant="h5" fontWeight="bold">¡Bienvenido!</Typography>
          <Typography sx={{ mt: 1 }}>Inicia sesión con tu cuenta</Typography>
          <Button
            variant="outlined"
            sx={{
              mt: 3,
              borderColor: "white",
              color: "white",
              fontWeight: "bold",
              '&:hover': { backgroundColor: "white", color: "#be4bdb" },
            }}
            onClick={() => {
              setRightPanelActive(false);
              
            }}
          >
            Iniciar Sesión
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h5" fontWeight="bold">¡Hola!</Typography>
          <Typography sx={{ mt: 1 }}>Crea tu cuenta para comenzar</Typography>
          <Button
            variant="outlined"
            sx={{
              mt: 3,
              borderColor: "white",
              color: "white",
              fontWeight: "bold",
              '&:hover': { backgroundColor: "white", color: "#009dff" },
            }}
            onClick={() => {
              setRightPanelActive(true);
              
            }}
          >
            Registrarme
          </Button>
        </>
      )}
    </Box>
  );
};

export default OverlayPanel;
