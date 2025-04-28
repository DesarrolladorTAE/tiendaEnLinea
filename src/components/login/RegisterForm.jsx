import React, { useState } from "react";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig"; // Importa axios correctamente

const RegisterForm = () => {
  const [isVerificationStep, setIsVerificationStep] = useState(false); // Paso de verificación
  const [verificationCode, setVerificationCode] = useState(""); // Código de verificación
  const [currentPhone, setCurrentPhone] = useState(""); // Teléfono del usuario
  const [verificationError, setVerificationError] = useState(""); // Error en verificación
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    if (!isVerificationStep) {
      // Enviar código de verificación
      try {
        await axios.post("/auth/send-code", { phone: data.phone });
        setCurrentPhone(data.phone);
        setIsVerificationStep(true); // Cambia al paso de verificación
        toast.success("✅ Código de verificación enviado");
      } catch (error) {
        toast.error("⚠️ Error al enviar el código");
      }
    } else {
      // Paso de registro después de la verificación
      try {
        // Verificar el código
        await axios.post("/auth/verify-code", {
          phone: currentPhone,
          code: verificationCode,
        });

        // Si el código es correcto, registrar al usuario
        await axios.post("/register", {
          name: data.nombre,
          lastName: data.apellidos,
          email: data.email,
          phone: data.phone,
          password: data.password,
          password_confirmation: data.password_confirmation,
        });

        toast.success("✅ Registro exitoso.");
        // Redirigir a la página de login o la principal
      } catch (error) {
        setVerificationError(error.response?.data?.message || "Código inválido");
        toast.error(error.response?.data?.message || "⚠️ Error en la verificación del código");
      }
    }
  };

  const handleResendCode = async () => {
    // Vuelve a enviar el código
    try {
      await axios.post("/auth/send-code", { phone: currentPhone });
      toast.success("✅ Código reenviado");
    } catch (error) {
      toast.error("⚠️ Error al reenviar el código");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        px: 4,
        py: 6,
        backgroundColor: "white",
      }}
    >
      <Typography variant="h4" fontWeight="bold" color="#333" gutterBottom>
        {isVerificationStep ? "Verificación de Código" : "Crea tu Cuenta"}
      </Typography>

      {/* Si estamos en el paso de verificación */}
      {isVerificationStep ? (
        <>
          <Typography sx={{ mb: 2 }}>
            Por favor, ingresa el código enviado a {currentPhone}
          </Typography>
          <TextField
            label="Código de Verificación"
            fullWidth
            size="small"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            error={Boolean(verificationError)}
            helperText={verificationError}
            sx={{
              borderRadius: 50,
              "& .MuiOutlinedInput-root": {
                borderRadius: 50,
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 5,
                py: 1.5,
                bgcolor: "#be4bdb",
                color: "white",
                fontWeight: "bold",
                borderRadius: "25px",
                textTransform: "uppercase",
                boxShadow: 3,
                "&:hover": {
                  bgcolor: "#9e35b4",
                },
              }}
            >
              Verificar Código
            </Button>
          </Box>
          <Typography
            sx={{ mt: 2, textAlign: "center", color: "#00bfa5", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            onClick={handleResendCode}
          >
            ¿No recibiste el código? ¡Reenviar!
          </Typography>
        </>
      ) : (
        <>
          {/* Formulario de registro */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                size="small"
                {...register("nombre", { required: "El nombre es obligatorio" })}
                error={Boolean(errors.nombre)}
                helperText={errors.nombre?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellidos"
                fullWidth
                size="small"
                {...register("apellidos", { required: "Los apellidos son obligatorios" })}
                error={Boolean(errors.apellidos)}
                helperText={errors.apellidos?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo electrónico"
                fullWidth
                size="small"
                {...register("email", {
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Correo inválido",
                  },
                })}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                size="small"
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                {...register("phone", {
                  required: "El teléfono es obligatorio",
                  pattern: { value: /^[0-9]{10}$/, message: "Debe contener 10 dígitos" },
                })}
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
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
                  validate: (value) => value === watch("password") || "Las contraseñas no coinciden",
                })}
                error={Boolean(errors.password_confirmation)}
                helperText={errors.password_confirmation?.message}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 5,
                py: 1.5,
                bgcolor: "#be4bdb",
                color: "white",
                fontWeight: "bold",
                borderRadius: "25px",
                textTransform: "uppercase",
                boxShadow: 3,
                "&:hover": {
                  bgcolor: "#9e35b4",
                },
              }}
            >
              Registrarme
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default RegisterForm;

