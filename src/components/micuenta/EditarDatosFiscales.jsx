import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  MenuItem,
} from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";

const regimenesFiscales = [
  { codigo: "601", nombre: "601 - General de Ley Personas Morales" },
  { codigo: "603", nombre: "603 - Personas Morales con Fines no Lucrativos" },
  {
    codigo: "605",
    nombre: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  },
  { codigo: "606", nombre: "606 - Arrendamiento" },
  { codigo: "608", nombre: "608 - Demás ingresos" },
  {
    codigo: "610",
    nombre:
      "610 - Residentes en el Extranjero sin Establecimiento Permanente en México",
  },
  {
    codigo: "611",
    nombre: "611 - Ingresos por Dividendos (socios y accionistas)",
  },
  {
    codigo: "612",
    nombre:
      "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  },
  { codigo: "614", nombre: "614 - Ingresos por intereses" },
  {
    codigo: "615",
    nombre: "615 - Régimen de los ingresos por obtención de premios",
  },
  { codigo: "616", nombre: "616 - Sin obligaciones fiscales" },
  {
    codigo: "620",
    nombre:
      "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  },
  { codigo: "621", nombre: "621 - Incorporación Fiscal" },
  {
    codigo: "622",
    nombre: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  },
  { codigo: "623", nombre: "623 - Opcional para Grupos de Sociedades" },
  { codigo: "624", nombre: "624 - Coordinados" },
  {
    codigo: "625",
    nombre:
      "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  },
  { codigo: "626", nombre: "626 - Régimen Simplificado de Confianza" },
];

const EditarDatosFiscales = () => {
  const [form, setForm] = useState({
    rfc: "",
    domicilio_fac: "",
    codigo_regimen: "",
    razon_social: "",
    correo_tae: "",
    contra_tae: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/perfil/datos-fiscales")
      .then((res) => {
        const data = res.data;

        const isEmpty = Object.values(data).every(
          (val) => val === null || val === ""
        );

        if (isEmpty) {
          showError(
            "No se han encontrado datos fiscales aún. Regístralos en caso de requerir factura para tus suscripciones."
          );
        }

        setForm({
          rfc: data.rfc ?? "",
          domicilio_fac: data.domicilio_fac ?? "",
          codigo_regimen: data.codigo_regimen ?? "",
          razon_social: data.razon_social ?? "",
          correo_tae: data.correo_tae ?? "",
          contra_tae: data.contra_tae ?? "",
        });
      })
      .catch(() => showError("No se pudieron cargar los datos fiscales"));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post("/perfil/datos-fiscales", form);
      showSuccess("Datos fiscales actualizados correctamente");
    } catch (err) {
      showError("Error al actualizar los datos fiscales");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 4, backgroundColor: "#1f2937", color: "#fff" }}>
      <CardContent>
        <Typography variant="h6" color="#fff" gutterBottom>
          🧾 Editar Datos Fiscales
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="RFC"
            name="rfc"
            value={form.rfc}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Domicilio Fiscal (C.P.)"
            name="domicilio_fac"
            value={form.domicilio_fac}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            select
            label="Régimen Fiscal "
            name="codigo_regimen"
            value={form.codigo_regimen}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
            SelectProps={{
              style: { color: "#fff" },
            }}
          >
            {regimenesFiscales.map((regimen) => (
              <MenuItem key={regimen.codigo} value={regimen.codigo}>
                {regimen.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Razón Social (Nombre asociado a su RFC)"
            name="razon_social"
            value={form.razon_social}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Correo TAEConta (Opcional)"
            name="correo_tae"
            value={form.correo_tae}
            onChange={handleChange}
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Contraseña TAEContA (Opcional)"
            name="contra_tae"
            value={form.contra_tae}
            onChange={handleChange}
            type="text"
            InputLabelProps={{ style: { color: "#ccc" } }}
            InputProps={{ style: { color: "#fff" } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar datos fiscales"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditarDatosFiscales;
