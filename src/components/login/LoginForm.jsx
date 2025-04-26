import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig"; // Asegúrate de importar axios correctamente
import { useNavigate } from "react-router-dom"; // Navegación
import { useDispatch } from "react-redux"; // Para manejar el estado global
import { setUser } from "../../store/slices/userSlice"; // Para actualizar el usuario en el store
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal"; // Modal de recuperación de contraseña
import AnimatedModal from "../../components/AnimatedModal"; // Modal de bienvenida

const LoginForm = () => {
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); // Estado para el modal de reset
  const [resetPhone, setResetPhone] = useState(""); // Para guardar el teléfono de la recuperación
  const [resetCode, setResetCode] = useState(""); // Código de recuperación
  const [newPassword, setNewPassword] = useState(""); // Nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirmación de la nueva contraseña

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Manejo del login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("login", {
        phone: loginPhone,
        password: loginPassword,
      });

      const { token, user } = response.data;

      // Guarda token en localStorage
      localStorage.setItem("token", token);

      // Actualiza el estado global con el usuario y el token
      dispatch(setUser({ user, token }));

      // Muestra mensaje de bienvenida
      setShowWelcome(true);
      setTimeout(() => {
        setShowWelcome(false);
        if (user.role === "superadmin") {
          navigate("/admin/dashboard"); // Redirige al dashboard de superadmin
        } else {
          navigate("/home-fashion-three"); // Redirige a la página principal
        }
      }, 3000);
    } catch (error) {
      setLoginError(error.response?.data?.message || "Error en el inicio de sesión");
      toast.error(error.response?.data?.message || "⚠️ Error en el inicio de sesión");
    }
  };

  const onError = () => {
    toast.error("⚠️ Por favor, completa todos los campos correctamente.");
  };

  // Manejo de la recuperación de contraseña
  const handleSendResetCode = async () => {
    try {
      await axios.post("auth/reset-password/send-code", { phone: loginPhone });
      setResetPhone(loginPhone);
      setIsResetModalOpen(true); // Abre el modal de recuperación
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al enviar código");
    }
  };

  // Manejo de la sumisión de nueva contraseña
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    try {
      await axios.post("/auth/reset-password", {
        phone: resetPhone,
        code: resetCode, // Aquí es donde pasa el código para la recuperación
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setIsResetModalOpen(false);
      toast.success("Contraseña actualizada exitosamente.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleLogin, onError)}
      sx={{
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        px: 6,
        py: 8,
        zIndex: 2,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
      }}
    >
      <Typography variant="h4" fontWeight="bold" color="#444" gutterBottom sx={{ mb: 3 }}>
        Iniciar Sesión
      </Typography>

      <Stack spacing={2} sx={{ width: "100%", maxWidth: 280 }}>
        {/* Campo Teléfono estilizado */}
        <TextField
          label="Teléfono"
          variant="outlined"
          type="tel"
          size="small"
          fullWidth
          {...register("loginPhone", {
            required: "El teléfono es obligatorio",
            pattern: {
              value: /^[0-9]+$/,
              message: "Solo se permiten números",
            },
            minLength: {
              value: 10,
              message: "El teléfono debe tener 10 dígitos",
            },
            maxLength: {
              value: 10,
              message: "El teléfono debe tener 10 dígitos",
            },
          })}
          error={Boolean(errors.loginPhone)}
          helperText={errors.loginPhone ? errors.loginPhone.message : ""}
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
            if (e.target.value.length > 10) {
              e.target.value = e.target.value.slice(0, 10);
            }
          }}
          sx={{
            borderRadius: 50,
            "& .MuiOutlinedInput-root": {
              borderRadius: 50,
            },
          }}
        />

        {/* Campo Contraseña estilizado */}
        <TextField
          label="Contraseña"
          variant="outlined"
          type="password"
          size="small"
          fullWidth
          {...register("loginPassword", {
            required: "La contraseña es obligatoria",
            minLength: {
              value: 8,
              message: "La contraseña debe tener al menos 8 caracteres",
            },
          })}
          error={Boolean(errors.loginPassword)}
          helperText={errors.loginPassword ? errors.loginPassword.message : ""}
          sx={{
            borderRadius: 50,
            "& .MuiOutlinedInput-root": {
              borderRadius: 50,
            },
          }}
        />

        {loginError && (
          <Typography color="error" fontSize={14} textAlign="center">
            {loginError}
          </Typography>
        )}

        {/* Botón de inicio de sesión */}
        <Button
          type="submit"
          variant="contained"
          sx={{
            mt: 1,
            bgcolor: "#00bfff",
            color: "white",
            fontWeight: "bold",
            borderRadius: 9999,
            py: 1.2,
            px: 4,
            alignSelf: "center",
            textTransform: "uppercase",
            '&:hover': { bgcolor: "#009dff" },
          }}
        >
          Iniciar Sesión
        </Button>

        <Typography
          sx={{
            mt: 1,
            textAlign: "center",
            color: "#00bfa5",
            fontSize: 14,
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={(e) => {
            e.preventDefault();
            handleSendResetCode(); // Función de recuperación de contraseña
          }}
        >
          ¿Olvidaste tu contraseña?
        </Typography>
      </Stack>

      {/* Modal de bienvenida
      {showWelcome && (
        <Typography
          variant="h6"
          fontWeight="bold"
          color="#00bfa5"
          sx={{ textAlign: "center", mt: 3 }}
        >
          ¡Bienvenido de nuevo! 😄
        </Typography>
      )} */}

      {/* Modal de recuperación de contraseña */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        phone={loginPhone}
        code={resetCode} // Se pasa el código aquí
        setCode={setResetCode} // Pasamos la función para actualizar el código
        onSubmit={handleResetPasswordSubmit} // Llamamos la función de cambio de contraseña
      />

      {/* Modal Animado */}
      <AnimatedModal
        isOpen={showWelcome}
        onRequestClose={() => setShowWelcome(false)}
        message="¡Bienvenido de nuevo! 😄"
        tipo="welcome"
      />
    </Box>
  );
};

export default LoginForm;
