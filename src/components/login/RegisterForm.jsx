import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import TermsModal from "../modals/TermsModal";
import CircularProgress from "@mui/material/CircularProgress";

const roundedInputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "50px",
  },
};

const RegisterForm = ({ setRightPanelActive, onSuccess }) => {
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError, // <-- nuevo
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true); // Activar spinner

    try {
      if (!isVerificationStep) {
        await axios.post("/auth/send-code", { phone: data.phone });
        setCurrentPhone(data.phone);
        setIsVerificationStep(true);
        toast.success("✅ Código enviado");
      } else {
        await axios.post("/auth/verify-code", {
          phone: currentPhone,
          code: verificationCode,
        });

        await axios.post("/register", {
          ...data,
          code: verificationCode,
        });

        toast.success("✅ Registro exitoso");
        setRegistrationComplete(true);
        reset();
        onSuccess?.();
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};
      const msg = data.message || data.error || "⚠️ Error en el registro";

      if (status === 422 && data.errors) {
        // Errores por campo
        Object.entries(data.errors).forEach(([field, messages]) => {
          setError(field, {
            type: "manual",
            message: messages[0],
          });
        });
      } else if (status === 400 || status === 401 || status === 409) {
        // Código de verificación incorrecto u otros errores lógicos
        setVerificationError(msg);
      } else {
        toast.error(msg);
      }
      toast.error(msg);
    } finally {
      setLoading(false); // Desactivar spinner
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post("/auth/resend-code", { phone: currentPhone });
      toast.success("✅ Código reenviado");
    } catch {
      toast.error("⚠️ Error al reenviar código");
    }
  };

  if (registrationComplete) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 2, sm: 4 },
          py: { xs: 5, sm: 6 },
          bgcolor: "white",
          borderRadius: 4,
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="#333">
          🎉 Registro exitoso
        </Typography>
        <Typography mt={2}>
          Ya puedes iniciar sesión con tu número y contraseña.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setRightPanelActive?.(false)}
          sx={{
            mt: 4,
            px: 5,
            py: 1.5,
            bgcolor: "#be4bdb",
            borderRadius: 9999,
            color: "#fff",
            fontWeight: "bold",
            textTransform: "uppercase",
            fontSize: 16,
            boxShadow: "none",
            "&:hover": { bgcolor: "#9e35b4" },
          }}
          fullWidth
        >
          Iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        width: "100%",
        maxWidth: 600, // ✅ Más espacio para doble columna
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",

        alignItems: "center",
        px: { xs: 2, sm: 6 },
        py: { xs: 5, sm: 6 },
        bgcolor: "white",
        borderRadius: 4,
        boxShadow: 2,
      }}
    >
      {/* <Box
        component="img"
        src="/assets/img/logo2.png"
        alt="Logo Te lo recargo"
        sx={{ width: 110, height: "auto", mb: 2, mt: -1 }}
      /> */}

      <Typography variant="h5" fontWeight="bold" color="#333" gutterBottom>
        {isVerificationStep ? "Verificación de Código" : "Crea tu Cuenta"}
      </Typography>

      {isVerificationStep ? (
        <>
          <Typography sx={{ mb: 2 }}>
            Ingresa el código enviado a <b>{currentPhone}</b>
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <TextField
              label="Código"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              error={Boolean(verificationError)}
              helperText={verificationError}
              inputProps={{ maxLength: 6, inputMode: "numeric" }}
              sx={{
                width: 180,
                textAlign: "center",
                ...roundedInputStyle,
                "& input": {
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  fontWeight: "bold",
                },
              }}
              size="small"
            />
          </Box>

          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{
              mt: 4,
              px: 5,
              py: 1.5,
              bgcolor: "#be4bdb",
              color: "white",
              borderRadius: 9999,
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: 16,
              boxShadow: "none",
              "&:hover": { bgcolor: "#9e35b4" },
            }}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Verificar Código"
            )}
          </Button>

          <Typography
            mt={2}
            onClick={handleResendCode}
            sx={{
              color: "#00bfa5",
              cursor: "pointer",
              textAlign: "center",
              fontWeight: 500,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            ¿No recibiste el código? ¡Reenviar!
          </Typography>
        </>
      ) : (
        <>
          <Grid
            container
            spacing={2}
            sx={{
              width: "100%",
              justifyContent: "center", // ✅ Centra las columnas
              px: { xs: 0, sm: 2 }, // ✅ Opcional: agrega espacio lateral en escritorio
            }}
          >
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                size="small"
                {...register("name", { required: "El nombre es obligatorio" })}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellidos"
                fullWidth
                size="small"
                {...register("apellidos", {
                  required: "Los apellidos son obligatorios",
                })}
                error={Boolean(errors.apellidos)}
                helperText={errors.apellidos?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo electrónico"
                fullWidth
                size="small"
                {...register("email", {
                  required: "El correo es obligatorio",
                  pattern: { value: /^\S+@\S+$/, message: "Correo inválido" },
                })}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                size="small"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                {...register("phone", {
                  required: "El teléfono es obligatorio",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Debe tener 10 dígitos",
                  },
                })}
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                size="small"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                })}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmar Contraseña"
                type="password"
                fullWidth
                size="small"
                {...register("password_confirmation", {
                  required: "Confirma tu contraseña",
                  validate: (value) =>
                    value === password || "Las contraseñas no coinciden",
                })}
                error={Boolean(errors.password_confirmation)}
                helperText={errors.password_confirmation?.message}
                sx={roundedInputStyle}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => {
                      if (acceptedTerms) {
                        // ✅ Permitir desmarcar directamente
                        setAcceptedTerms(false);
                      } else {
                        // 🚫 No marcar aún: abre modal
                        setTermsOpen(true);
                      }
                    }}
                  />
                }
                label={
                  <span>
                    Acepto los{" "}
                    <span
                      onClick={() => setTermsOpen(true)}
                      style={{
                        color: "#00bfa5",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      términos y condiciones
                    </span>
                  </span>
                }
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            disabled={!acceptedTerms || loading}
            variant="contained"
            sx={{
              mt: 2,
              px: 3,
              py: 1.5,
              bgcolor: acceptedTerms ? "#be4bdb" : "grey.400",
              color: "#fff",
              borderRadius: 9999,
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: 16,
              boxShadow: "none",
              alignSelf: "center",
              "&:hover": {
                bgcolor: acceptedTerms ? "#9e35b4" : "grey.500",
              },
            }}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Registrarme"
            )}
          </Button>

          <TermsModal
            open={termsOpen}
            onClose={() => setTermsOpen(false)}
            onAccept={() => {
              setAcceptedTerms(true); // ✅ marcar el checkbox al aceptar
              setTermsOpen(false); // ✅ cerrar modal
            }}
          />
        </>
      )}
    </Box>
  );
};

export default RegisterForm;
