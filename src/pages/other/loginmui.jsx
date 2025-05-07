import React, { useEffect, useState } from "react";
import { Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import OverlayPanel from "../../components/login/OverlayPanel";
import LoginForm from "../../components/login/LoginForm";
import LoginAgentForm from "../../components/login/LoginAgentForm";
import RegisterForm from "../../components/login/RegisterForm";
import LoginSelector from "../../components/login/LoginSelector"; // 👈 Asegúrate de importarlo

const LoginOverlayResponsiveMUI = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [loginType, setLoginType] = useState(null); // 👈 usuario | agente | null
  const navigate = useNavigate();

  const resetLoginForm = () => setResetForm(true);
  const resetRegisterForm = () => setResetForm(true);

  useEffect(() => {
    const token = localStorage.getItem("TOKEN") || localStorage.getItem("POS_TOKEN");
    if (token) {
      navigate("/home-fashion-three", { replace: true });
    }
  }, [navigate]);

  const renderLoginComponent = () => {
    if (loginType === "usuario") {
      return (
        <LoginForm
          visible={!rightPanelActive}
          setRightPanelActive={setRightPanelActive}
          resetForm={resetForm}
          onBack={() => setLoginType(null)} // 👈
        />
      );
    }

    if (loginType === "agente") {
      return (
        <LoginAgentForm
          visible={!rightPanelActive}
          setRightPanelActive={setRightPanelActive}
          resetForm={resetForm}
          onBack={() => setLoginType(null)} // 👈
        />
      );
    }

    // Pantalla inicial (selector)
    return (
      <LoginSelector
        onSelect={(type) => setLoginType(type)}
      />
    );
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
        <Box sx={{ display: "flex", width: "100%" }}>
          {renderLoginComponent()}
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
