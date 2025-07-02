import React, { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";
import AnimatedModal from "../../components/AnimatedModal";
import CircularProgress from "@mui/material/CircularProgress";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const LoginForm = ({ onBack }) => {
  const [loginError, setLoginError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  // const [resetPhone, setResetPhone] = useState("");
  // const [resetCode, setResetCode] = useState("");
  // const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue, // ← ¡agregado!
    watch,
    setError, // ← nuevo
  } = useForm();
  const loginPhone = watch("loginPhone");
  const handleLogin = async (data) => {
    setLoading(true); // Activar el spinner

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
      const status = error.response?.status;
      const message =
        error.response?.data?.message || "Error en el inicio de sesión";

      if (status === 404 && error.response?.data?.error === "user_not_found") {
        setError("loginPhone", {
          type: "manual",
          message: message,
        });
      } else if (
        status === 401 &&
        error.response?.data?.error === "invalid_password"
      ) {
        setError("loginPassword", {
          type: "manual",
          message: message,
        });
      } else if (status === 422 && error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          setError(`login${field.charAt(0).toUpperCase() + field.slice(1)}`, {
            type: "manual",
            message: messages[0],
          });
        });
      } else {
        setLoginError(message);
        toast.error("⚠️ " + message);
      }
    } finally {
      setLoading(false); // Desactivar el spinner
    }
  };

  const onError = () => {
    toast.error("⚠️ Por favor, completa todos los campos correctamente.");
  };
  // const handleSendResetCode = () => {
  //   setIsResetModalOpen(true);
  // };


  // const handleResetPasswordSubmit = async (e) => {
  //   e.preventDefault();
  //   if (newPassword !== confirmPassword) {
  //     toast.error("Las contraseñas no coinciden");
  //     return;
  //   }
  //   try {
  //     await axios.post("/auth/reset-password", {
  //       phone: resetPhone,
  //       code: resetCode,
  //       password: newPassword,
  //       password_confirmation: confirmPassword,
  //     });
  //     setIsResetModalOpen(false);
  //     toast.success("Contraseña actualizada exitosamente.");
  //   } catch (error) {
  //     toast.error(
  //       error.response?.data?.message || "Error al cambiar contraseña"
  //     );
  //   }
  // };

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
            value={loginPhone || ""} // ← Controlado por React
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
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
              setValue("loginPhone", cleaned);
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData("Text");
              const onlyNumbers = pastedText.replace(/\D/g, "");
              const last10Digits = onlyNumbers.slice(-10);
              setValue("loginPhone", last10Digits);
            }}
            sx={{
              borderRadius: 50,
              "& .MuiOutlinedInput-root": { borderRadius: 50 },
            }}
          />

          <TextField
            label="Contraseña"
            variant="outlined"
            type={showPassword ? "text" : "password"}
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
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
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
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Iniciar Sesión"
            )}
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
            onClick={() => setIsResetModalOpen(true)} // ← simplificado
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
        onClose={() => setIsResetModalOpen(false)}
        onSendCode={async (phone) => {
          try {
            await axios.post("/auth/reset-password/send-code", { phone });
            toast.success("Código enviado correctamente");
            return true;
          } catch (error) {
            toast.error(error.response?.data?.error || "Error al enviar código");
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

export default LoginForm;
