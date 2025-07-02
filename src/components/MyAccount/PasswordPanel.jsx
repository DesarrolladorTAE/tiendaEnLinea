import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Button,
  Avatar,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";

const PasswordPanel = ({ expanded, handleChange, user }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
            <Grid item xs={12}>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, fontSize: { xs: 14, md: 15 } }}
              >
                Si olvidaste tu contraseña o quieres actualizarla, haz clic en
                el botón para comenzar el proceso.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  sx={{
                    fontWeight: 600,
                    px: 4,
                    py: 1,
                    fontSize: 14,
                    borderRadius: 3,
                    textTransform: "uppercase",
                  }}
                  onClick={() => setIsResetModalOpen(true)}
                >
                  Empezar ahora
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        initialPhone={user?.phone || ""}
        onSendCode={async (phone) => {
          try {
            await axios.post("/auth/reset-password/send-code", { phone });
            toast.success("Código enviado correctamente");
            return true;
          } catch (error) {
            toast.error(error.response?.data?.error || "Error al enviar el código");
            return false;
          }
        }}
        onResetPassword={async ({ phone, code, newPassword }) => {
          try {
            await axios.post("/auth/reset-password", {
              phone,
              code,
              password: newPassword,
              password_confirmation: newPassword,
            });
            toast.success("Contraseña actualizada exitosamente.");
            return true;
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Error al cambiar contraseña"
            );
            return false;
          }
        }}
      />
    </>
  );
};

export default PasswordPanel;
