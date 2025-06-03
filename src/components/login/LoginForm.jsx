import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";
import AnimatedModal from "../../components/AnimatedModal";

const LoginForm = ({ onBack }) => {
  const [loginError, setLoginError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const handleLogin = async (data) => {
    try {
      const response = await axios.post("/login", {
        phone: data.loginPhone,
        password: data.loginPassword,
      });
      const { token, user } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      dispatch(setUser({ user, token }));

      setShowWelcome(true);
      setTimeout(() => {
        setShowWelcome(false);
        if (["admin", "superadmin"].includes(user.role)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/home-fashion-three", { replace: true });
        }
      }, 1200);
    } catch (error) {
      setLoginError(error.response?.data?.message || "Error en el inicio de sesión");
      toast.error(error.response?.data?.message || "⚠️ Error en el inicio de sesión");
    }
  };

  const onError = () => {
    toast.error("⚠️ Por favor, completa todos los campos correctamente.");
  };

  const handleSendResetCode = async () => {
    const phone = getValues("loginPhone");

    if (!phone) {
      toast.error("Por favor ingresa tu número de teléfono.");
      return;
    }
    try {
      await axios.post("/auth/reset-password/send-code", { phone });
      toast.success("Código enviado correctamente");
      setResetPhone(phone);
      setIsResetModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al enviar el código");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
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
      toast.success("Contraseña actualizada exitosamente.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit(handleLogin, onError)}
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "white",
          borderRadius: 4,
          boxShadow: 2,
          py: 5,
          px: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          gap: 2,
        }}
      >
        {/* Botón volver */}
        <IconButton
          onClick={onBack}
          sx={{
            position: "absolute",
            top: 12,
            left: 8,
            color: "#00bfa5",
            bgcolor: "transparent",
            "&:hover": { bgcolor: "#e6f7f4" },
          }}
          size="large"
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        {/* Logo */}
        {/* <Box
          component="img"
          src="/assets/img/logo1.png"
          alt="Logo Te lo recargo"
          sx={{
            width: 110,
            height: "auto",
            mb: 2,
            mt: -1,
          }}
        /> */}

        <Typography variant="h5" fontWeight="bold" color="#444" mb={1}>
          Iniciar Sesión
        </Typography>

        <Stack spacing={2} sx={{ width: "100%", maxWidth: 280 }}>
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
            helperText={errors.loginPhone?.message}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 10,
            }}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "");
              if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
              }
            }}
            sx={{
              borderRadius: 50,
              "& .MuiOutlinedInput-root": { borderRadius: 50 },
            }}
          />

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
            helperText={errors.loginPassword?.message}
            sx={{
              borderRadius: 50,
              "& .MuiOutlinedInput-root": { borderRadius: 50 },
            }}
          />

          {loginError && (
            <Typography color="error" fontSize={14} textAlign="center">
              {loginError}
            </Typography>
          )}

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
              fontSize: 16,
              "&:hover": { bgcolor: "#009dff" },
              boxShadow: "none",
            }}
            fullWidth
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
              handleSendResetCode();
            }}
          >
            ¿Olvidaste tu contraseña?
          </Typography>
        </Stack>

        <AnimatedModal
          isOpen={showWelcome}
          onRequestClose={() => setShowWelcome(false)}
          message="¡Bienvenido de nuevo! 😄"
          tipo="welcome"
        />
      </Box>

      {/* MODAL FUERA DEL FORM */}
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

export default LoginForm;
