import React from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const LoginForm = ({
  loginData,
  setLoginData,
  onSubmit,
  showPassword,
  togglePassword,
  loading,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();     // 🚫 evita refresh
    e.stopPropagation();    // 🚫 evita bubbling raro
    if (loading) return;    // 🚫 evita doble submit
    onSubmit(e);            // 🔗 delega al handler del padre
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        className="auth-credential"
        label="Correo electrónico o número de teléfono"
        autoComplete="username"
        value={loginData.login}
        onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
        required
        fullWidth
        slotProps={{
          input: { startAdornment: <InputAdornment position="start"><PersonOutlineRoundedIcon /></InputAdornment> },
        }}
      />

      <TextField
        className="auth-credential"
        type={showPassword ? "text" : "password"}
        label="Contraseña"
        autoComplete="current-password"
        value={loginData.password}
        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        required
        fullWidth
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={togglePassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <div className="button-box">
        <button
          type="submit"
          className="btn btn-primary btn-lg w-100"
          disabled={loading}
          style={{ height: "45px", fontWeight: "bold", fontSize: "16px" }}
        >
          {loading ? "Cargando..." : "INICIAR SESIÓN"}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
