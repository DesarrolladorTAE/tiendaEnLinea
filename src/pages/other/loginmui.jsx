import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, useMediaQuery, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/login/LoginForm";
import LoginAgentForm from "../../components/login/LoginAgentForm";
import LoginSelector from "../../components/login/LoginSelector";
import RegisterForm from "../../components/login/RegisterForm";
// import logo from '../../assets/logo.png';

const LoginOverlayResponsiveMUI = () => {
  const [loginType, setLoginType] = useState(null); // usuario | agente | null
  const [mode, setMode] = useState("login"); // "login" | "register"
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const token = localStorage.getItem("TOKEN") || localStorage.getItem("POS_TOKEN");
    if (token) {
      navigate("/home-fashion-three", { replace: true });
    }
  }, [navigate]);

  // Renderiza login, selector o register según el modo
  const renderContent = () => {
    if (mode === "register") {
      return (
        <RegisterForm
          onSuccess={() => {
            setMode("login");
            setLoginType(null);
          }}
        />
      );
    }
    // login
    if (loginType === "usuario") {
      return (
        <LoginForm
          onBack={() => setLoginType(null)}
        />
      );
    }
    if (loginType === "agente") {
      return (
        <LoginAgentForm
          onBack={() => setLoginType(null)}
        />
      );
    }
    return <LoginSelector onSelect={setLoginType} />;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 400,
          mx: "auto",
          p: isMobile ? 3 : 5,
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* LOGO */}
        {/* <Box sx={{ mb: 1 }}>
          <img src={logo} alt="Logo" style={{ width: 120 }} />
        </Box> */}

        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
          Bienvenido a TeLoRecargo
        </Typography>
        <Typography color="text.secondary" fontSize={15} mb={2} textAlign="center">
          {mode === "register"
            ? "Regístrate para comenzar a usar tu cuenta"
            : "Inicia sesión para acceder a tu cuenta"}
        </Typography>

        {renderContent()}

        <Box sx={{ mt: 2, width: "100%", textAlign: "center" }}>
          {mode === "login" ? (
            <Typography fontSize={13}>
              ¿No tienes cuenta?{" "}
              <Button
                variant="text"
                size="small"
                onClick={() => setMode("register")}
              >
                Regístrate
              </Button>
            </Typography>
          ) : (
            <Typography fontSize={13}>
              ¿Ya tienes cuenta?{" "}
              <Button
                variant="text"
                size="small"
                onClick={() => setMode("login")}
              >
                Inicia sesión
              </Button>
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginOverlayResponsiveMUI;
