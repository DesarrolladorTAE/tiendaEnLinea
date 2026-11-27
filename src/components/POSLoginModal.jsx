import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Box, IconButton, InputAdornment, TextField } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CompanyCertificate from "./login/CompanyCertificate";
import LoginBanner, { useLoginBanner } from "./login/LoginBanner";
import axios from "../config/axiosClient";
import { posServicesEnabled } from "../utils/posServices";
import "../pages/other/LoginRegister.motion.css";

export default function POSLoginModal({ onLoginSuccess, fromAdmin, sessionError }) {
  const [code, setCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sessionError ?? "");
  const banner = useLoginBanner();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (busy || !code.trim() || !accessCode) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post("/pos/login", { code: code.trim(), access_code: accessCode }, { __skipAuthRedirect: true });
      if (!data.token) {
        setError("No se recibió el acceso al punto de venta. Intenta de nuevo.");
        return;
      }
      localStorage.setItem("POS_TOKEN", data.token);
      onLoginSuccess(data.pos);
    } catch (err) {
      const status = err.response?.status;
      if (posServicesEnabled && status === 403 && err.response?.data?.message === "Esta terminal POS está desactivada.") {
        setError(err.response.data.message);
        return;
      }
      setError([401, 403, 422].includes(status)
        ? "Revisa el código POS y el PIN."
        : "No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-neo is-login" aria-labelledby="pos-login-title">
      <div className="fx fx-blob b1" aria-hidden="true" />
      <div className="fx fx-blob b2" aria-hidden="true" />
      <div className="container">
        <Box className={`auth-panel grid-login img-left${banner.current ? "" : " no-media"}`} sx={{ minHeight: "0 !important" }}>
          <LoginBanner {...banner} />
          <div className="col-form">
            <Link to={fromAdmin ? "/admin/pos" : "/login-register"} className="auth-home-link">
              <ArrowBackRoundedIcon aria-hidden="true" />
              {fromAdmin ? "Puntos de venta" : "Acceso de administración"}
            </Link>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 2, mb: 3 }}>
              <Box component="img" src="/assets/logoc.png" alt="Mi Tienda en Línea MX" className="auth-logo"
                sx={{ width: { xs: "min(75%, 200px)", sm: "min(60%, 230px)" }, height: "auto" }} />
              <CompanyCertificate />
            </Box>
            <h1 id="pos-login-title" className="auth-heading">Acceso a punto de venta</h1>
            <p className="auth-sub">Ingresa el código y el PIN de tu terminal.</p>
            <form onSubmit={handleLogin}>
              <TextField
                className="auth-credential"
                label="Código POS"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="username"
                required
                disabled={busy}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PointOfSaleOutlinedIcon /></InputAdornment> } }}
              />
              <TextField
                className="auth-credential"
                label="PIN de acceso"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                type={showPin ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={busy}
                fullWidth
                slotProps={{
                  htmlInput: { maxLength: 6, inputMode: "numeric" },
                  input: {
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="button" aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"} onClick={() => setShowPin(!showPin)} edge="end">
                          {showPin ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {error && <Alert severity="error">{error}</Alert>}
              <button type="submit" className="btn btn-primary fw-bold" disabled={busy}>
                {busy ? "Ingresando…" : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </Box>
      </div>
    </section>
  );
}
