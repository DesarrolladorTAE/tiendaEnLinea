import React, { useState } from "react";
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

const EditarContrasena = () => {
  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (form.password !== form.password_confirmation) {
      showError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/perfil/cambiar-contrasena", form);
      showSuccess("Contraseña actualizada correctamente");
      setForm({ password: "", password_confirmation: "" });
    } catch (err) {
      showError("Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 4, backgroundColor: "#1f2937", color: "#fff" }}>
      <CardContent>
        <Typography variant="h6" color="#fff" gutterBottom>
          🔐 Cambiar Contraseña
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Nueva contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Confirmar contraseña"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditarContrasena;
