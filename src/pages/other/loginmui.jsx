import React, { useEffect, useState } from "react";
import { Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import OverlayPanel from "../../components/login/OverlayPanel";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";

const LoginOverlayResponsiveMUI = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const navigate = useNavigate();

  const resetLoginForm = () => setResetForm(true);
  const resetRegisterForm = () => setResetForm(true);

  // ✅ Verifica si ya hay sesión activa y redirige
  useEffect(() => {
    const token = localStorage.getItem("TOKEN") || localStorage.getItem("POS_TOKEN");

    if (token) {
      // Redirige reemplazando el historial (para evitar que regrese con "atrás")
      navigate("/home-fashion-three", { replace: true }); // Cambia por la ruta privada real
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f6f5f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: "100%",
          maxWidth: 1100,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          minHeight: 600,
        }}
      >
        <Box sx={{ display: "flex", width: "100%" }}>
          <LoginForm
            visible={!rightPanelActive}
            setRightPanelActive={setRightPanelActive}
            resetForm={resetForm}
          />
          <RegisterForm
            visible={rightPanelActive}
            setRightPanelActive={setRightPanelActive}
            resetForm={resetForm}
          />
        </Box>

        <OverlayPanel
          rightPanelActive={rightPanelActive}
          setRightPanelActive={setRightPanelActive}
          resetLoginForm={resetLoginForm}
          resetRegisterForm={resetRegisterForm}
        />
      </Paper>
    </Box>
  );
};

export default LoginOverlayResponsiveMUI;
