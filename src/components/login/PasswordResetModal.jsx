import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axiosClient from "../../config/axiosClient";

const steps = ["Número", "Código", "Nueva contraseña", "Éxito"];

const PasswordResetModal = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [telefono, setTelefono] = useState("");
  const [code, setCode] = useState("");
  const [passwords, setPasswords] = useState({ nueva: "", confirmacion: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleEnviarTelefono = async () => {
    setLoading(true);
    setErrors({});
    try {
      await axiosClient.post("/verificacion/recuperar", { phone: telefono });
      setStep(1);
    } catch (err) {
      setErrors({
        telefono: err.response?.data?.error || "Error al enviar código",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async () => {
    setLoading(true);
    setErrors({});
    try {
      await axiosClient.post("/verificacion/verificar", {
        phone: telefono,
        code,
      });
      setStep(2);
    } catch (err) {
      setErrors({
        code: err.response?.data?.error || "Código incorrecto o expirado",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPassword = async () => {
    setLoading(true);
    setErrors({});
    if (passwords.nueva !== passwords.confirmacion) {
      setErrors({ confirmacion: "Las contraseñas no coinciden" });
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/auth/cambiar-password", {
        phone: telefono,
        password: passwords.nueva,
        password_confirmation: passwords.confirmacion,
      });

      setStep(3);
    } catch (err) {
      setErrors({
        nueva: err.response?.data?.error || "No se pudo cambiar la contraseña",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setTelefono("");
    setCode("");
    setPasswords({ nueva: "", confirmacion: "" });
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          width: 400,
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          mx: "auto",
          my: "20vh",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Recuperar contraseña
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((step + 1) / steps.length) * 100}
          sx={{ mb: 2 }}
        />
        <Typography variant="subtitle2" gutterBottom color="textSecondary">
          Paso {step + 1} de {steps.length}: {steps[step]}
        </Typography>

        {step === 0 && (
          <>
            <TextField
              label="Teléfono"
              variant="outlined"
              type="tel"
              size="small"
              fullWidth
              value={telefono}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                setTelefono(cleaned);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("Text");
                const onlyNumbers = pastedText.replace(/\D/g, "");
                const last10Digits = onlyNumbers.slice(-10);
                setTelefono(last10Digits);
              }}
              error={!!errors.telefono}
              helperText={errors.telefono}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 10,
              }}
              
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleEnviarTelefono}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Enviar código
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <TextField
              label="Código recibido"
              fullWidth
              margin="normal"
              value={code}
              onChange={(e) => {
                const soloNumeros = e.target.value.replace(/\D/g, ""); // elimina letras
                const maxSeis = soloNumeros.slice(0, 6); // solo 6 dígitos
                setCode(maxSeis);
              }}
              error={!!errors.code}
              helperText={errors.code}
              inputProps={{
                maxLength: 6,
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleVerificarCodigo}
              disabled={loading}
            >
              Verificar código
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Nueva contraseña"
              type={showPass ? "text" : "password"}
              fullWidth
              margin="normal"
              value={passwords.nueva}
              onChange={(e) =>
                setPasswords({ ...passwords, nueva: e.target.value })
              }
              error={!!errors.nueva}
              helperText={errors.nueva}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirmar contraseña"
              type={showPass ? "text" : "password"}
              fullWidth
              margin="normal"
              value={passwords.confirmacion}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmacion: e.target.value })
              }
              error={!!errors.confirmacion}
              helperText={errors.confirmacion}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleGuardarPassword}
              disabled={loading}
            >
              Guardar contraseña
            </Button>
          </>
        )}

        {step === 3 && (
          <Box textAlign="center">
            <Typography variant="h6" color="success.main" gutterBottom>
              ✅ Contraseña actualizada correctamente
            </Typography>
            <Button variant="outlined" onClick={handleClose}>
              Volver a iniciar sesión
            </Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default PasswordResetModal;
