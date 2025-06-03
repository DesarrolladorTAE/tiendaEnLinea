import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
  Button,
  Fade,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/login/LoginForm";
import LoginAgentForm from "../../components/login/LoginAgentForm";
import LoginSelector from "../../components/login/LoginSelector";
import RegisterForm from "../../components/login/RegisterForm";

const LoginOverlayResponsiveMUI = () => {
  const [loginType, setLoginType] = useState(null);
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const token =
      localStorage.getItem("TOKEN") || localStorage.getItem("POS_TOKEN");
    if (token) {
      navigate("/home-fashion-three", { replace: true });
    }
  }, [navigate]);

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
    if (loginType === "usuario") {
      return <LoginForm onBack={() => setLoginType(null)} />;
    }
    if (loginType === "agente") {
      return <LoginAgentForm onBack={() => setLoginType(null)} />;
    }
    return <LoginSelector onSelect={setLoginType} />;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: "linear-gradient(to bottom right, #0077B6, #0077B6)",
        backgroundColor: "#0077B6",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Fade in timeout={500}>
        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: isMobile ? 400 : 700,
            mx: "auto",
            p: isMobile ? 3 : 6,
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            bgcolor: "#f4f6f9", // ✅ fondo gris claro que contrasta con azul
            color: "#333",
            transform: "translateY(20px)",
            animation: "riseIn 0.6s ease-out forwards",
          }}
        >
          {/* Logo en la parte superior */}
          <Box
            component="img"
            src="/assets/img/logo1.png"
            alt="Logo TeLoRecargo"
            sx={{ width: 180, height: "auto", mb: 1 }}
          />

          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Bienvenido a TeLoRecargo
          </Typography>
          <Typography
            color="text.secondary"
            fontSize={15}
            mb={2}
            textAlign="center"
          >
            {mode === "register"
              ? "Regístrate para comenzar a usar tu cuenta"
              : "Inicia sesión para acceder a tu cuenta"}
          </Typography>

          {renderContent()}

          <Box
            sx={{
              mt: 3,
              width: "100%",
              textAlign: "center",
              bgcolor: "#00b5e5", // ✅ Fondo suave opcional
              borderRadius: 2,
              py: 2,
              px: 2,
            }}
          >
            <Typography
              fontSize={14}
              fontWeight={650}
              color="text.primary"
              sx={{ display: "inline" }}
            >
              {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            </Typography>

            <Button
              variant="text"
              size="small"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              sx={{
                fontSize: 14,
                fontWeight: "bold",
                textTransform: "none",
                textDecoration: "underline",
                color: "#ffffff",
                "&:hover": {
                  textDecoration: "underline",
                  color: "#023E8A",
                },
              }}
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </Button>
          </Box>
        </Paper>
      </Fade>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default LoginOverlayResponsiveMUI;
