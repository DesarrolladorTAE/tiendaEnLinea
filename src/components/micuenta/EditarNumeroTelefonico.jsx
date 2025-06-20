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

const EditarNumeroTelefonico = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/perfil/numero-telefonico")
      .then((res) => setPhoneNumber(res.data.phone_number))
      .catch(() => showError("No se pudo cargar el número telefónico"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post("/perfil/cambiar-numero", {
        phone_number: phoneNumber,
      });
      showSuccess("Número telefónico actualizado correctamente");
    } catch (err) {
      showError("Error al actualizar el número telefónico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 4, backgroundColor: "#1f2937", color: "#fff" }}>
      <CardContent>
        <Typography variant="h6" color="#fff" gutterBottom>
          📱 Cambiar Número Telefónico
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Número de teléfono"
            name="phone_number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar número"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditarNumeroTelefonico;
