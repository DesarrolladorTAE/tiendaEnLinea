import React, { useEffect, useState } from "react";
import { Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import OverlayPanel from "../../components/login/OverlayPanel";
import LoginForm from "../../components/login/LoginForm";
import LoginAgentForm from "../../components/login/LoginAgentForm";
import RegisterForm from "../../components/login/RegisterForm";
import LoginSelector from "../../components/login/LoginSelector";

const LoginOverlayResponsiveMUI = () => {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [loginType, setLoginType] = useState(null);
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
          onBack={() => setLoginType(null)}
        />
      );
    }

    if (loginType === "agente") {
      return (
        <LoginAgentForm
          visible={!rightPanelActive}
          setRightPanelActive={setRightPanelActive}
          resetForm={resetForm}
          onBack={() => setLoginType(null)}
        />
      );
    }

    return <LoginSelector onSelect={(type) => setLoginType(type)} />;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo animado */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          animation: "hero-gradient-animation 10s linear infinite alternate",
          backgroundColor: "black",
          backgroundImage: `
            radial-gradient(circle at var(--x-0) var(--y-0), var(--c-0) var(--s-start-0), transparent var(--s-end-0)),
            radial-gradient(circle at var(--x-1) var(--y-1), var(--c-1) var(--s-start-1), transparent var(--s-end-1)),
            radial-gradient(circle at var(--x-2) var(--y-2), var(--c-2) var(--s-start-2), transparent var(--s-end-2)),
            radial-gradient(circle at var(--x-3) var(--y-3), var(--c-3) var(--s-start-3), transparent var(--s-end-3)),
            radial-gradient(circle at var(--x-4) var(--y-4), var(--c-4) var(--s-start-4), transparent var(--s-end-4)),
            radial-gradient(circle at var(--x-5) var(--y-5), var(--c-5) var(--s-start-5), transparent var(--s-end-5)),
            radial-gradient(circle at var(--x-6) var(--y-6), var(--c-6) var(--s-start-6), transparent var(--s-end-6)),
            radial-gradient(circle at var(--x-7) var(--y-7), var(--c-7) var(--s-start-7), transparent var(--s-end-7)),
            radial-gradient(circle at var(--x-8) var(--y-8), var(--c-8) var(--s-start-8), transparent var(--s-end-8)),
            radial-gradient(circle at var(--x-9) var(--y-9), var(--c-9) var(--s-start-9), transparent var(--s-end-9))
          `,
          backgroundBlendMode: "normal",
          "--c-0": "hsla(217.59, 100%, 30%, 1)",
          "--x-0": "93%", "--y-0": "63%",
          "--c-1": "black", "--x-1": "33%", "--y-1": "-7%",
          "--c-2": "black", "--x-2": "84%", "--y-2": "7%",
          "--c-3": "black", "--x-3": "14%", "--y-3": "5%",
          "--c-4": "black", "--x-4": "7%", "--y-4": "96%",
          "--c-5": "black", "--x-5": "93%", "--y-5": "90%",
          "--c-6": "hsla(212.36, 72%, 58%, 1)", "--x-6": "102%", "--y-6": "16%",
          "--c-7": "hsla(289.90, 86%, 47%, 1)", "--x-7": "94%", "--y-7": "59%",
          "--c-8": "hsla(217.68, 100%, 39%, 1)", "--x-8": "48%", "--y-8": "63%",
          "--c-9": "hsla(217.59, 100%, 30%, 1)", "--x-9": "96%", "--y-9": "78%",
          zIndex: -1,
        }}
      />

      {/* Contenido */}
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
          zIndex: 1,
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

      <style>{`
        @keyframes hero-gradient-animation {
          0% { --x-0: 93%; --y-0: 63%; --x-1: 33%; --y-1: -7%; --x-2: 84%; --y-2: 7%; --x-3: 14%; --y-3: 5%; --x-4: 7%; --y-4: 96%; --x-5: 93%; --y-5: 90%; --x-7: 94%; --y-7: 59%; --x-8: 48%; --y-8: 63%; --x-9: 96%; --y-9: 78%; }
          50% { --x-0: 2%; --y-0: 59%; --x-1: 42%; --y-1: 10%; --x-2: 75%; --y-2: 29%; --x-3: 5%; --y-3: 16%; --x-4: 36%; --y-4: 91%; --x-5: 70%; --y-5: 91%; --x-7: 57%; --y-7: 76%; --x-8: 11%; --y-8: 53%; --x-9: 70%; --y-9: 70%; }
          100% { --x-1: 76%; --y-1: -3%; --x-2: 97%; --y-2: 18%; --x-3: 42%; --y-3: 18%; --x-4: 66%; --y-4: 95%; --x-5: 46%; --y-5: 92%; --x-7: 22%; --y-7: 52%; --x-9: 97%; --y-9: 51%; }
        }
      `}</style>
    </Box>
  );
};

export default LoginOverlayResponsiveMUI;
