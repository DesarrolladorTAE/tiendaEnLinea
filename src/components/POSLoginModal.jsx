import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from "@mui/material";
import axios from "../config/axiosClient";

const POSLoginModal = ({ open, onLoginSuccess }) => {
  const [code, setCode] = useState("");           // ← POS code (ej. POS013001)
  const [accessCode, setAccessCode] = useState(""); // ← PIN de 6 dígitos
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post("/pos/login", {
        code,
        access_code: accessCode
      });

      const token = response.data.token;

      if (token) {
        localStorage.setItem("POS_TOKEN", token);  // 🔐 Guardamos el token POS
        onLoginSuccess();
      } else {
        setError("No se recibió un token");
      }
    } catch (err) {
      setError("Código o PIN incorrecto");
    }
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Acceso a Punto de Venta</DialogTitle>
      <DialogContent>
        <TextField
          label="Código POS"
          fullWidth
          margin="dense"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="Código de acceso (PIN)"
          type="password"
          fullWidth
          margin="dense"
          inputProps={{ maxLength: 6 }}
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
        />
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogin} variant="contained">
          Ingresar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default POSLoginModal;
