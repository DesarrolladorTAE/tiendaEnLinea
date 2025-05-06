import React from "react";
import {
  Box, Button, Grid, TextField, Typography
} from "@mui/material";

const RegisterForm = ({
  isVerificationStep,
  currentPhone,
  verificationCode,
  setVerificationCode,
  verificationError,
  onVerify,
  onResend,
  onRegisterSubmit,
  register,
  handleSubmit,
  errors,
  watch
}) => {
  const password = watch("password");

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(isVerificationStep ? onVerify : onRegisterSubmit)}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        px: 2
      }}
    >
      <Typography variant="h5" textAlign="center" fontWeight="bold">
        {isVerificationStep ? "Verifica tu teléfono" : "Crea tu cuenta"}
      </Typography>

      {isVerificationStep ? (
        <>
          <Typography>
            Ingresá el código enviado a <strong>{currentPhone}</strong>
          </Typography>
          <TextField
            label="Código de verificación"
            fullWidth
            size="small"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            error={Boolean(verificationError)}
            helperText={verificationError}
          />
          <Button onClick={onResend} color="secondary" sx={{ textTransform: "none" }}>
            ¿No recibiste el código? Reenviar
          </Button>
        </>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre"
              fullWidth
              size="small"
              {...register("name", { required: "Nombre obligatorio" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Apellidos"
              fullWidth
              size="small"
              {...register("apellidos", { required: "Apellidos obligatorios" })}
              error={!!errors.apellidos}
              helperText={errors.apellidos?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Correo"
              fullWidth
              size="small"
              {...register("email", {
                required: "Correo obligatorio",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Correo inválido",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Teléfono"
              fullWidth
              size="small"
              {...register("phone", {
                required: "Teléfono obligatorio",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Debe tener 10 dígitos",
                },
              })}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contraseña"
              fullWidth
              size="small"
              type="password"
              {...register("password", {
                required: "Contraseña requerida",
                minLength: { value: 8, message: "Mínimo 8 caracteres" },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirmar contraseña"
              fullWidth
              size="small"
              type="password"
              {...register("password_confirmation", {
                required: "Confirma tu contraseña",
                validate: (value) =>
                  value === password || "Las contraseñas no coinciden",
              })}
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation?.message}
            />
          </Grid>
        </Grid>
      )}

      <Button
        type="submit"
        variant="contained"
        sx={{
          bgcolor: "#be4bdb",
          py: 1.5,
          borderRadius: 4,
          mt: 3,
          fontWeight: "bold",
          "&:hover": { bgcolor: "#9e35b4" },
        }}
      >
        {isVerificationStep ? "Verificar Código" : "Registrarme"}
      </Button>
    </Box>
  );
};

export default RegisterForm;
