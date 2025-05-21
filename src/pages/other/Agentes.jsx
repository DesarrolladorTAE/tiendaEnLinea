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

// ... (importaciones idénticas a las que ya tienes)

const Agentes = () => {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    apellidos: "",
    phone: "",
    saldo: "",
    codigo: "",
  });
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAgente, setEditingAgente] = useState(null);

  const getAgentes = async () => {
    try {
      const { data } = await axios.get("/agents");
      setAgentes(data);
    } catch (err) {
      showAlert("Error al cargar agentes", "error");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) getAgentes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generarCodigo = () => {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    setForm({ ...form, codigo: random.toString() });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        apellidos: form.apellidos,
        phone: form.phone,
        saldo: parseFloat(form.saldo),
        codigo: form.codigo,
      };
      const { data } = await axios.post("/agents", payload);
      setAgentes((prev) => Array.isArray(prev) ? [...prev, data] : [data]);
      setForm({ name: "", apellidos: "", phone: "", saldo: "", codigo: "" });
      showAlert("Agente creado correctamente");
    } catch (err) {
      const msg = err.response?.data?.message || "Error al crear agente";
      showAlert(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (agente) => {
    setEditingAgente({
      id: agente.id,
      name: agente.name,
      apellidos: agente.apellidos,
      phone: agente.phone,
      saldo: agente.saldo,
      codigo: "",
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditingAgente({ ...editingAgente, [e.target.name]: e.target.value });
  };

  const saveEditedAgente = async () => {
    try {
      const payload = {
        name: editingAgente.name,
        apellidos: editingAgente.apellidos,
        phone: editingAgente.phone,
        saldo: parseFloat(editingAgente.saldo),
      };
      if (editingAgente.codigo) payload.codigo = editingAgente.codigo;

      const { data } = await axios.put(`/agents/${editingAgente.id}`, payload);
      setAgentes((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      showAlert("Agente actualizado correctamente");
      setEditModalOpen(false);
    } catch (error) {
      showAlert("Error al actualizar", "error");
    }
  };

  const deleteAgente = async (agente) => {
    const result = await Swal.fire({
      title: `¿Eliminar a ${agente.name}?`,
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
          <Typography variant="h5" gutterBottom>Crear nuevo agente</Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Nombre" name="name" fullWidth value={form.name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Apellidos" name="apellidos" fullWidth value={form.apellidos} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Teléfono" name="phone" fullWidth value={form.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Saldo" name="saldo" type="number" fullWidth value={form.saldo} onChange={handleChange} />
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

          <Typography variant="h6" gutterBottom>Agentes registrados</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {Array.isArray(agentes) && agentes.length > 0 ? (
              agentes.map((agente) => (
                <Fade in timeout={500} key={agente.id}>
                  <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">👤 {agente.name} {agente.apellidos}</Typography>
                          <Typography>📱 Teléfono: {agente.phone}</Typography>
                          <Typography>🔐 Código: <strong>{agente.password}</strong></Typography>
                          <Typography>💸 Saldo: ${Number(agente.saldo).toFixed(2)}</Typography>
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
              <Typography variant="body2">No hay agentes registrados.</Typography>
            )}
          </Grid>
        </Box>
      </LayoutOne>

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>✏️ Editar Agente</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" name="name" value={editingAgente?.name || ""} onChange={handleEditChange} sx={{ mt: 1 }} />
          <TextField fullWidth label="Apellidos" name="apellidos" value={editingAgente?.apellidos || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
          <TextField fullWidth label="Teléfono" name="phone" value={editingAgente?.phone || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
          <TextField fullWidth label="Saldo" name="saldo" type="number" value={editingAgente?.saldo || ""} onChange={handleEditChange} sx={{ mt: 2 }} />
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={8}>
              <TextField fullWidth label="Código (opcional)" name="codigo" value={editingAgente?.codigo || ""} onChange={handleEditChange} />
            </Grid>
            <Grid item xs={4}>
              <Button fullWidth variant="outlined" onClick={() => {
                const random = Math.floor(10000000 + Math.random() * 90000000);
                setEditingAgente((prev) => ({ ...prev, codigo: random.toString() }));
              }}>🎲 Generar</Button>
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
