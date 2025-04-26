import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import OverlayPanel from "../../components/login/OverlayPanel";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";

const LoginOverlayResponsiveMUI = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [resetForm, setResetForm] = useState(false);

  const resetLoginForm = () => {
    setResetForm(true);  // Trigger reset for login form
  };

  const resetRegisterForm = () => {
    setResetForm(true);  // Trigger reset for register form
  };

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
        {/* Formularios lado a lado */}
        <Box sx={{ display: "flex", width: "100%" }}>
          <LoginForm
            visible={!rightPanelActive}
            setRightPanelActive={setRightPanelActive}
            resetForm={resetForm}  // Pass resetForm to LoginForm
          />
          <RegisterForm
            visible={rightPanelActive}
            setRightPanelActive={setRightPanelActive}
            resetForm={resetForm}  // Pass resetForm to RegisterForm
          />
        </Box>

        {/* Overlay */}
        <OverlayPanel
          rightPanelActive={rightPanelActive}
          setRightPanelActive={setRightPanelActive}
          resetLoginForm={resetLoginForm}  // Pass resetLoginForm to OverlayPanel
          resetRegisterForm={resetRegisterForm}  // Pass resetRegisterForm to OverlayPanel
        />
      </Paper>
    </Box>
  );
};

export default LoginOverlayResponsiveMUI;
