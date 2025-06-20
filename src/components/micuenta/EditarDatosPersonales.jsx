import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";

const EditarDatosPersonales = () => {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/perfil/datos-personales")
      .then((res) => setForm(res.data))
      .catch(() => showError("No se pudieron cargar los datos personales"));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post("/perfil/datos-personales", form);
      showSuccess("Datos personales actualizados correctamente");
    } catch (err) {
      showError("Error al actualizar los datos personales");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 4, backgroundColor: "#1f2937", color: "#fff" }}>
      <CardContent>
        <Typography variant="h6" color="#fff" gutterBottom>
          ✏️ Editar Datos Personales
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Nombre de la tienda"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditarDatosPersonales;
