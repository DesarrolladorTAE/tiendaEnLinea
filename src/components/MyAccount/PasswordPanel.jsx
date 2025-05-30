import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  Grid,
  Button,
  Avatar,
  Stack,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";

const PasswordPanel = ({ expanded, handleChange, user }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState(user?.phone || "");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);

  // Envía el código por SMS
  const handleSendResetCode = async () => {
    if (!resetPhone || resetPhone.length !== 10) {
      toast.error("Ingresa tu número de teléfono registrado (10 dígitos).");
      return;
    }
    setLoadingSend(true);
    try {
      await axios.post("/auth/reset-password/send-code", { phone: resetPhone });
      toast.success("Código enviado correctamente");
      setIsResetModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al enviar el código");
    } finally {
      setLoadingSend(false);
    }
  };

  // Cambia la contraseña usando el código y nueva contraseña
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await axios.post("/auth/reset-password", {
        phone: resetPhone,
        code: resetCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setIsResetModalOpen(false);
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada exitosamente.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error al cambiar contraseña"
      );
    }
  };

  return (
    <>
      <Accordion
        expanded={expanded === "panel2"}
        onChange={handleChange("panel2")}
        sx={{
          borderRadius: 3,
          mb: 1,
          background: "#f3f6fb",
          ".MuiAccordionSummary-root": { minHeight: 64 },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Avatar sx={{ bgcolor: "#bd6c21", mr: 2 }}>
            <LockIcon />
          </Avatar>
          <Typography fontWeight={600} fontSize={{ xs: 18, md: 20 }}>
            Cambiar contraseña
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, fontSize: { xs: 14, md: 15 } }}
              >
                Si olvidaste tu contraseña o quieres actualizarla, te enviaremos
                un código de verificación a tu teléfono registrado.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono registrado"
                value={resetPhone}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9]/g, "");
                  if (val.length > 10) val = val.slice(0, 10);
                  setResetPhone(val);
                }}
                inputProps={{
                  maxLength: 10,
                  style: {
                    fontSize: 15, // Tamaño del texto interno
                    // textAlign: "center",
                    height: 40, // Altura del input, igual que el botón
                  },
                }}
                sx={{
                  background: "#fff",
                  // borderRadius: 50,
                  "& .MuiOutlinedInput-root": {
                    // borderRadius: 50,
                    height: 40, // Altura igual que el botón
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: 15,
                    left: 24,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                fullWidth
                sx={{
                  // borderRadius: 50,
                  fontWeight: 700,
                  letterSpacing: 1,
                  boxShadow: "0 2px 8px 0 rgba(60,90,140,.14)",
                  fontSize: 10, // Tamaño de texto, igual que el input
                  height: 40, // Altura igual que el input
                  minHeight: 40, // Altura mínima por si acaso
                  py: 0,
                  transition: "all .2s",
                }}
                onClick={handleSendResetCode}
                disabled={
                  loadingSend || !resetPhone || resetPhone.length !== 10
                }
              >
                {loadingSend ? "Enviando código..." : "Enviar código"}
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* MODAL PARA CAMBIO DE CONTRASEÑA */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        phone={resetPhone}
        code={resetCode}
        setCode={setResetCode}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleResetPasswordSubmit}
        onClose={() => setIsResetModalOpen(false)}
      />
    </>
  );
};

export default PasswordPanel;
