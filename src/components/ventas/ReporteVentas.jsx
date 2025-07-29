import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import axiosClient from "../../config/axiosClient";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function ReporteVentas() {
  const [fechaInicio, setFechaInicio] = useState(dayjs().format("YYYY-MM-DD"));
  const [fechaFin, setFechaFin] = useState(dayjs().format("YYYY-MM-DD"));
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    axiosClient
      .get("/admin/pos")
      .then(({ data }) => setSucursales(data))
      .catch((err) => console.error("❌ Error al cargar sucursales", err));
  }, []);

  const consultarVentas = async () => {
    if (!fechaInicio || !fechaFin || !sucursalSeleccionada) return;

    const token = localStorage.getItem("AUTH_TOKEN");
    console.log("📤 Enviando filtros:", {
      inicio: fechaInicio,
      fin: fechaFin,
      pos: sucursalSeleccionada,
    });
    console.log("🔐 Token enviado manualmente:", token);

    try {
      const response = await axios.get(
        "https://mitiendaenlineamx.com.mx/api/reporte-utilidades/pdf",
        {
          params: {
            inicio: fechaInicio,
            fin: fechaFin,
            pos: sucursalSeleccionada,
          },
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Button
        variant="outlined"
        onClick={() => navigate("/admin/reportes")}
        sx={{ mb: 2 }}
      >
        ← Regresar a Reportes
      </Button>

      <Typography variant="h5" gutterBottom>
        📄 Reporte de Utilidades
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Vista del PDF */}
        <Box
          sx={{
            flex: 1,
            minHeight: 500,
            border: "1px solid #ccc",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#fafafa",
          }}
        >
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Reporte PDF"
              width="100%"
              height="100%"
              style={{ border: "none", minHeight: 500 }}
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Genera el reporte con los filtros para visualizarlo aquí.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Filtros */}
        <Paper
          elevation={3}
          sx={{
            width: { xs: "100%", md: 320 },
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Filtros
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="sucursal-label">Sucursal</InputLabel>
              <Select
                labelId="sucursal-label"
                value={sucursalSeleccionada}
                label="Sucursal"
                onChange={(e) => setSucursalSeleccionada(e.target.value)}
              >
                {sucursales.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Fecha Inicio"
              size="small"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              type="date"
              label="Fecha Fin"
              size="small"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Button
              variant="contained"
              color="primary"
              onClick={consultarVentas}
              fullWidth
            >
              Generar Reporte
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
