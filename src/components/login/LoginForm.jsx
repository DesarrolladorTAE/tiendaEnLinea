import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
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

    // Set token y user INMEDIATAMENTE
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    dispatch(setUser({ user, token }));

    // Ya puedes mostrar splash/animación si quieres
    setShowWelcome(true);
    setTimeout(() => {
      setShowWelcome(false);
      if (["admin", "superadmin"].includes(user.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/home-fashion-three", { replace: true });
      }
    }, 1500); // más rápido el splash
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
      console.log("☎️ Enviando teléfono:", phone);
      await axios.post("/auth/reset-password/send-code", { phone });
      toast.success("Código enviado correctamente");
      setResetPhone(phone);
      setIsResetModalOpen(true);
    } catch (error) {
      console.error(error.response?.data || error.message);
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
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          px: 6,
          py: 0, // <-- padding vertical reducido
          zIndex: 2,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      >


        <Box
          component="img"
          src="/assets/img/logo1.png"
          alt="Logo Te lo recargo"
          sx={{
            width: 180,
            height: "auto",
            mb: 2,
            mt: -8,// <-- margen superior negativo para empujarlo hacia arriba
          }}
        />

        <Typography variant="h4" fontWeight="bold" color="#444" gutterBottom sx={{ mb: 3 }}>
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
              "&:hover": { bgcolor: "#009dff" },
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
              handleSendResetCode();
            }}
          >
            ¿Olvidaste tu contraseña?
          </Typography>
          <Typography>
          </Typography>
          <Typography>
          </Typography>

          <Typography
            sx={{
              alignSelf: "flex-start",
              mb: 2,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: "#00bfa5",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={onBack}
          >
            ⬅️ Regresar
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
      />
    </>
  );
};

export default LoginForm;
