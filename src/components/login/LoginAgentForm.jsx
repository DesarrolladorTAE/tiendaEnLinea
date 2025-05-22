import React, { useState } from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { useNavigate } from "react-router-dom";
import AnimatedModal from "../AnimatedModal";

const LoginAgentForm = ({ visible, setRightPanelActive, resetForm, onBack }) => {
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
    
            // Guardar el token una sola vez bajo la clave estándar
            localStorage.setItem("POS_TOKEN", token);
    
            // Guardar el usuario en Redux
            dispatch(setUser({ user, token }));
    
            // Mostrar mensaje de bienvenida y redirigir
            setShowWelcome(true);
            setTimeout(() => {
                setShowWelcome(false);
                navigate("/home-fashion-three", { replace: true });
            }, 2000);
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
                width: "50%",
                display: visible ? "flex" : "none",
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
            <Box
                component="img"
                src="/assets/img/logo1.png"
                alt="Logo Te lo Recargo"
                sx={{ width: 180, height: "auto", mb: 2, mt: -8 }}
            />

            <Typography variant="h4" fontWeight="bold" color="#444" gutterBottom sx={{ mb: 3 }}>
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
                    helperText={errors.passoword?.message}
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
                message="¡Bienvenido agente! 😄"
                tipo="welcome"
            />
        </Box>
    );
};

export default LoginAgentForm;
