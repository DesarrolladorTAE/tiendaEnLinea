import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
} from "@mui/material";
import { useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../utils/alerts";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";
import dayjs from "dayjs";

const ModalAgregarSuscripcion = ({ open, onClose, tienda }) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm();

    const [tipo, setTipo] = useState("plan");
    const [mesesPagados, setMesesPagados] = useState(1);
    const mesesObtenidos = mesesPagados === 1 ? 1 : mesesPagados === 5 ? 6 : 12;

    const planSeleccionado = planes.find(
        (p) => p.plan_id === parseInt(watch("plan_id"))
    );

    const montoCalculado =
        tipo === "plan" && planSeleccionado
            ? planSeleccionado.precio_mensual * mesesPagados
            : null;

    const ahora = dayjs();

    const fechaInicio = tienda?.plan_expiration && dayjs(tienda.plan_expiration).isAfter(ahora)
        ? dayjs(tienda.plan_expiration)
        : ahora;

    const fechaFin = fechaInicio.add(mesesObtenidos, "month");

    // Formatos con hora completa
    const fechaInicioFormateada = fechaInicio.format("YYYY-MM-DD HH:mm:ss");
    const fechaFinFormateada = fechaFin.format("YYYY-MM-DD HH:mm:ss");

    const onSubmit = async () => {
        try {
            const payload = {
                store_id: tienda.id,
                status: "active",
            };

            if (tipo === "plan") {
                payload.plan_id = watch("plan_id");
                payload.monto = montoCalculado;
                payload.starts_at = fechaInicioFormateada;
                payload.ends_at = fechaFinFormateada;
                payload.meses_pagados = mesesPagados;
                payload.meses_obtenidos = mesesObtenidos;
            } else {
                payload.complemento_id = watch("complemento_id");
                payload.cantidad = watch("cantidad") || 1;
                payload.notas = watch("notas") || null;
                payload.starts_at = watch("starts_at");
                payload.ends_at = watch("ends_at");
                payload.monto = watch("monto");
            }

            await axiosSuperadmin.post("/admin/tiendas/suscripcion", payload);
            showSuccess("Suscripción agregada correctamente.");
            reset();
            setMesesPagados(1);
            onClose();
        } catch (error) {
            console.error("Error al agregar suscripción:", error);
            showError("No se pudo agregar la suscripción.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Agregar Suscripción - {tienda.name}
                <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <ToggleButtonGroup
                    value={tipo}
                    exclusive
                    onChange={(e, newTipo) => {
                        setTipo(newTipo);
                        reset(); // limpia campos
                        setMesesPagados(1);
                    }}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    <ToggleButton value="plan">Plan</ToggleButton>
                    <ToggleButton value="complemento">Complemento</ToggleButton>
                </ToggleButtonGroup>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {tipo === "plan" ? (
                        <>
                            <TextField
                                label="Selecciona un plan"
                                select
                                fullWidth
                                margin="normal"
                                {...register("plan_id", { required: "Selecciona un plan" })}
                                error={!!errors.plan_id}
                                helperText={errors.plan_id?.message}
                            >
                                {planes
                                    .filter((p) => p.plan_id !== 0) // omitir DEMO
                                    .map((p, i) => (
                                        <MenuItem key={p.plan_id} value={p.plan_id}>
                                            {`${i + 1}. ${p.nombre}`}
                                        </MenuItem>
                                    ))}
                            </TextField>

                            <TextField
                                label="Meses"
                                select
                                fullWidth
                                margin="normal"
                                value={mesesPagados}
                                onChange={(e) => setMesesPagados(parseInt(e.target.value))}
                            >
                                <MenuItem value={1}>1 mes</MenuItem>
                                <MenuItem value={5}>5 meses</MenuItem>
                                <MenuItem value={10}>10 meses</MenuItem>
                            </TextField>

                            <TextField
                                label="Monto calculado"
                                fullWidth
                                margin="normal"
                                value={montoCalculado || ""}
                                disabled
                            />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Fecha de inicio"
                                        fullWidth
                                        margin="normal"
                                        value={fechaInicio.format("YYYY-MM-DD")}
                                        disabled
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Fecha de fin"
                                        fullWidth
                                        margin="normal"
                                        value={fechaFin.format("YYYY-MM-DD")}
                                        disabled
                                    />

                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <>
                            <TextField
                                label="Complemento"
                                select
                                fullWidth
                                margin="normal"
                                {...register("complemento_id", { required: "Selecciona un complemento" })}
                                error={!!errors.complemento_id}
                                helperText={errors.complemento_id?.message}
                            >
                                {complementos.map((c) => (
                                    <MenuItem key={c.complemento_id} value={c.complemento_id}>
                                        {c.nombre}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Cantidad"
                                fullWidth
                                type="number"
                                margin="normal"
                                {...register("cantidad")}
                            />
                            <TextField
                                label="Notas"
                                fullWidth
                                margin="normal"
                                {...register("notas")}
                            />
                            <TextField
                                label="Monto"
                                fullWidth
                                type="number"
                                margin="normal"
                                {...register("monto", { required: "Ingresa un monto" })}
                                error={!!errors.monto}
                                helperText={errors.monto?.message}
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Fecha de inicio"
                                        fullWidth
                                        type="date"
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("starts_at", { required: "Requerido" })}
                                        error={!!errors.starts_at}
                                        helperText={errors.starts_at?.message}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Fecha de fin"
                                        fullWidth
                                        type="date"
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("ends_at")}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}

                    <DialogActions sx={{ mt: 2 }}>
                        <Button onClick={onClose}>Cancelar</Button>
                        <Button variant="contained" color="primary" type="submit">
                            Guardar
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModalAgregarSuscripcion;
