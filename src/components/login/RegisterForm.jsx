import React from "react";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

const RegisterForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm();

    const onSubmit = (data) => {
        toast.success("✅ Registro exitoso. Puedes continuar.");
        console.log(data);
    };

    const onError = () => {
        toast.error("⚠️ Revisa los campos del formulario.");
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit, onError)}
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
                Crea tu Cuenta
            </Typography>

            {/* Contenedor del formulario */}
            <Box sx={{ width: "100%", maxWidth: 500, mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            size="small"
                            {...register("nombre", { required: "El nombre es obligatorio" })}
                            error={Boolean(errors.nombre)}
                            helperText={errors.nombre?.message}
                            sx={{
                                borderRadius: 50, // Más ovalado
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50, // Asegurarse que el input también tenga el borde redondeado
                                },
                            }}
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
                            sx={{
                                borderRadius: 50,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50,
                                },
                            }}
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
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Correo inválido",
                                },
                            })}
                            error={Boolean(errors.email)}
                            helperText={errors.email?.message}
                            sx={{
                                borderRadius: 50,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50,
                                },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Teléfono"
                            fullWidth
                            size="small"
                            inputProps={{
                                maxLength: 10, // máximo 10 caracteres
                                inputMode: "numeric", // teclado numérico en móviles
                                pattern: "[0-9]*", // solo números
                            }}
                            onInput={(e) => {
                                // Elimina todo lo que no sea dígito
                                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            }}
                            {...register("telefono", {
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
                            error={Boolean(errors.telefono)}
                            helperText={errors.telefono?.message}
                            sx={{
                                borderRadius: 50,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50,
                                },
                            }}
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
                                minLength: {
                                    value: 8,
                                    message: "Mínimo 8 caracteres",
                                },
                            })}
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                            sx={{
                                borderRadius: 50,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50,
                                },
                            }}
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
                                    value === watch("password") || "Las contraseñas no coinciden",
                            })}
                            error={Boolean(errors.password_confirmation)}
                            helperText={errors.password_confirmation?.message}
                            sx={{
                                borderRadius: 50,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 50,
                                },
                            }}
                        />
                    </Grid>
                </Grid>

                {/* Botón centrado fuera del grid */}
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
            </Box>
        </Box>
    );
};

export default RegisterForm;
