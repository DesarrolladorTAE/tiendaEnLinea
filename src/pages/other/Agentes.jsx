import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Divider,
    Snackbar,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fade
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import Swal from "sweetalert2";
import axios from "../../axiosConfig";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";

const Agentes = () => {
    const [agentes, setAgentes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        apellidos: "",
        telefono: "",
        saldo_asignado: "",
        codigo: "",
    });
    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingAgente, setEditingAgente] = useState(null);

    const getAgentes = async () => {
        try {
            const { data } = await axios.get("/agents");
            console.log("AGENTES CARGADOS:", agentes);
            setAgentes(data);
        } catch (err) {
            console.error("Error al cargar agentes:", err);
            showAlert("Error al cargar agentes", "error");
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) getAgentes();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const generarCodigo = () => {
        const random = Math.floor(100000 + Math.random() * 90000000);
        setForm({ ...form, codigo: random.toString() });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post("/agents", form);
            setAgentes((prev) => [...prev, data]);
            setForm({ nombre: "", apellidos: "", telefono: "", saldo_asignado: "", codigo: "" });
            showAlert("Agente creado correctamente", "success");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Error al crear agente";
            showAlert(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (agente) => {
        setEditingAgente({ ...agente });
        setEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        setEditingAgente({ ...editingAgente, [e.target.name]: e.target.value });
    };

    const saveEditedAgente = async () => {
        try {
            const { data } = await axios.put(`/agents/${editingAgente.id}`, editingAgente);
            setAgentes((prev) => prev.map((a) => (a.id === data.id ? data : a)));
            showAlert("Agente actualizado correctamente");
            setEditModalOpen(false);
        } catch (error) {
            console.error(error);
            showAlert("Error al actualizar", "error");
        }
    };

    const deleteAgente = async (agente) => {
        const result = await Swal.fire({
            title: `¿Eliminar a ${agente.nombre}?`,
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/agents/${agente.id}`);
                setAgentes((prev) => prev.filter((a) => a.id !== agente.id));
                showAlert("Agente eliminado");
            } catch (err) {
                console.error(err);
                showAlert("Error al eliminar", "error");
            }
        }
    };

    const showAlert = (message, severity = "success") => {
        setAlert({ open: true, message, severity });
    };

    return (
        <Box>
            <SEO titleTemplate="Agentes" description="Gestión de agentes con saldo asignado" />
            <LayoutOne headerTop="visible">
                <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Agentes", path: "/agentes" }]} />

                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Crear nuevo agente
                    </Typography>
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField label="Nombre" name="nombre" fullWidth value={form.nombre} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Apellidos" name="apellidos" fullWidth value={form.apellidos} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Teléfono" name="telefono" fullWidth value={form.telefono} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Saldo asignado" name="saldo_asignado" type="number" fullWidth value={form.saldo_asignado} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Código" name="codigo" fullWidth value={form.codigo} onChange={handleChange} />
                                <Button size="small" onClick={generarCodigo}>🎲 Generar</Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : "Guardar agente"}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Typography variant="h6" gutterBottom>
                        Agentes registrados
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        {Array.isArray(agentes) && agentes.length > 0 ? (
                            agentes.map((agente) => (
                                <Fade in timeout={500} key={agente.id}>
                                    <Grid item xs={12}>
                                        <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="h6">👤 {agente.nombre} {agente.apellidos}</Typography>
                                                    <Typography>📱 Teléfono: {agente.telefono}</Typography>
                                                    <Typography>💸 Saldo asignado: ${Number(agente.saldo_asignado).toFixed(2)}</Typography>
                                                    <Typography>🔐 Código: <strong>{agente.codigo}</strong></Typography>
                                                </Box>
                                                <Box>
                                                    <Button color="primary" onClick={() => openEditModal(agente)}><Edit /></Button>
                                                    <Button color="error" onClick={() => deleteAgente(agente)}><Delete /></Button>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Fade>
                            ))
                        ) : (
                            <Typography variant="body2">No hay agentes registrados o respuesta inválida.</Typography>
                        )}
                    </Grid>
                </Box>
            </LayoutOne>

            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <DialogTitle>✏️ Editar Agente</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Nombre" name="nombre" value={editingAgente?.nombre || ""} onChange={handleEditChange} sx={{ mt: 1 }} />
                    <TextField fullWidth label="Apellidos" name="apellidos" value={editingAgente?.apellidos || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
                    <TextField fullWidth label="Teléfono" name="telefono" value={editingAgente?.telefono || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
                    <TextField fullWidth label="Saldo asignado" name="saldo_asignado" type="number" value={editingAgente?.saldo_asignado || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
                    <Grid container spacing={1} sx={{ mt: 2 }}>
                        <Grid item xs={8}>
                            <TextField
                                fullWidth
                                label="Código"
                                name="codigo"
                                value={editingAgente?.codigo || ""}
                                onChange={handleEditChange}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    const random = Math.floor(100000 + Math.random() * 90000000);
                                    setEditingAgente((prev) => ({
                                        ...prev,
                                        codigo: random.toString(),
                                    }));
                                }}
                            >
                                🎲 Generar
                            </Button>
                        </Grid>
                    </Grid>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                    <Button onClick={saveEditedAgente} variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={alert.open} autoHideDuration={4000} onClose={() => setAlert({ ...alert, open: false })}>
                <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity} sx={{ width: "100%" }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default withAuth(Agentes);
