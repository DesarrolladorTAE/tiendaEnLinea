import React, { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { useNavigate } from "react-router-dom";
import AnimatedModal from "../AnimatedModal";

const LoginAgentForm = ({ onBack }) => {
  const [loginError, setLoginError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleLogin = async (data) => {
    try {
      const response = await axios.post("/pos/login", {
        phone: data.phone,
        password: data.password,
      });

      const { token, user } = response.data;
      localStorage.setItem("POS_TOKEN", token);

      dispatch(setUser({ user, token }));

      setShowWelcome(true);
      setTimeout(() => {
        setShowWelcome(false);
        navigate("/home-fashion-three", { replace: true });
      }, 1200);
    } catch (error) {
      setLoginError(error.response?.data?.message || "Error al iniciar sesión");
      toast.error(error.response?.data?.message || "⚠️ Error al iniciar sesión");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleLogin)}
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
        alt="Logo Te lo Recargo"
        sx={{ width: 110, height: "auto", mb: 2, mt: -1 }}
      /> */}

      <Typography variant="h5" fontWeight="bold" color="#444" mb={1}>
        Agente - Acceso
      </Typography>

      <Stack spacing={2} sx={{ width: "100%", maxWidth: 280 }}>
        <TextField
          label="Teléfono"
          variant="outlined"
          type="tel"
          size="small"
          fullWidth
          {...register("phone", {
            required: "El teléfono es obligatorio",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Debe tener 10 dígitos",
            },
          })}
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message}
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
          label="Código de Acceso"
          variant="outlined"
          type="text"
          size="small"
          fullWidth
          {...register("password", {
            required: "El código es obligatorio",
            minLength: { value: 4, message: "Mínimo 4 caracteres" },
            maxLength: { value: 8, message: "Máximo 8 caracteres" },
          })}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
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
      </Stack>

      <AnimatedModal
        isOpen={showWelcome}
        onRequestClose={() => setShowWelcome(false)}
        message="¡Bienvenido agente! 😄"
        tipo="welcome"
      />
    </Box>
  );
};

export default LoginAgentForm;
