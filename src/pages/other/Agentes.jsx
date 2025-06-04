import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import axios from "../../axiosConfig";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componentes divididos
import AgenteForm from "../../components/agentes/AgenteForm";
import AgenteList from "../../components/agentes/AgenteList";
import AgenteModal from "../../components/agentes/AgenteModal";

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
  const [editingAgente, setEditingAgente] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) fetchAgentes();
  }, []);

  const fetchAgentes = async () => {
    try {
      const { data } = await axios.get("/agents");
      setAgentes(data);
    } catch {
      toast.error("Error al cargar agentes");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const generarCodigo = () => {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    setForm({ ...form, codigo: random.toString() });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = { ...form, saldo: parseFloat(form.saldo) };
      const { data } = await axios.post("/agents", payload);
      setAgentes((prev) => [...prev, data]);
      setForm({ name: "", apellidos: "", phone: "", saldo: "", codigo: "" });
      toast.success("Agente creado correctamente");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al crear agente");
    } finally {
      setLoading(false);
    }
  };

const openEditModal = (agente) => {
  const { saldo, ...rest } = agente;
  setEditingAgente({
    ...rest,
    saldo: "", // ahora el campo aparece vacío
    codigo: "",
  });
  setEditModalOpen(true);
};


  const handleEditChange = (e) => {
    setEditingAgente((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveEditedAgente = async () => {
    try {
      const payload = {
        name: editingAgente.name,
        apellidos: editingAgente.apellidos,
        phone: editingAgente.phone,
        saldo: parseFloat(editingAgente.saldo),
        ...(editingAgente.codigo && { codigo: editingAgente.codigo }),
      };
      const { data } = await axios.put(`/agents/${editingAgente.id}`, payload);
      setAgentes((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      setEditModalOpen(false);
      toast.success("Agente actualizado correctamente");
    } catch {
      toast.error("Error al actualizar");
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
        toast.success("Agente eliminado");
      } catch {
        toast.error("Error al eliminar");
      }
    }
  };

  return (
    <Box>
      <SEO
        titleTemplate="Agentes"
        description="Gestión de agentes con saldo asignado"
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Inicio", path: "/" },
            { label: "Agentes", path: "/agentes" },
          ]}
        />
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1080, mx: "auto" }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              textAlign="center"
              gutterBottom
            >
              🧾 Gestión de Agentes
            </Typography>

            <Box display="flex" justifyContent="center" mt={2} mb={4}>
              <Box sx={{ width: "100%", maxWidth: 600 }}>
                <AgenteForm
                  form={form}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  generarCodigo={generarCodigo}
                  loading={loading}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>
              📂 Lista de agentes
            </Typography>

            <AgenteList
              agentes={agentes}
              onEdit={openEditModal}
              onDelete={deleteAgente}
            />
          </Paper>
        </Box>
      </LayoutOne>

      <AgenteModal
        open={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        editingAgente={editingAgente}
        handleEditChange={handleEditChange}
        saveEditedAgente={saveEditedAgente}
      />

      <ToastContainer />
    </Box>
  );
};

export default withAuth(Agentes);
