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
import { showError } from "../../utils/alerts";
import Swal from "sweetalert2";

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
      if (
        error.response?.status === 422 &&
        error.response.data instanceof Blob
      ) {
        const text = await error.response.data.text(); // convierte Blob a texto
        try {
          const json = JSON.parse(text); // convierte texto a JSON


          console.log("📦 JSON recibido del backend:", json); // 👈 LOG para inspección

const productos = Array.isArray(json.productos)
  ? json.productos
  : Object.values(json.productos);

if (productos.length > 0) {

            console.log("⚠️ Productos sin purchase_cost:", json.productos); // 👈 LOG clave

            Swal.fire({
              icon: "error",
              title: "Productos sin costo de compra",
              html: `
          <p>No se puede calcular el reporte. Faltan costos de compra en los siguientes productos:</p>
          <ul style="text-align: left; max-height: 200px; overflow-y: auto;">
            ${productos.map((p) => `<li>${p}</li>`).join("")}

          </ul>
        `,
              showCancelButton: true,
              confirmButtonText: "Ir a Productos",
              cancelButtonText: "Cerrar",
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#aaa",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate("/admin/products");
              }
            });
          } else {
            showError(json.error || "Error al generar el reporte");
          }
        } catch (e) {
          showError("❌ Error inesperado al interpretar la respuesta.");
          console.error("❌ Error al parsear JSON:", e, text);
        }
      }
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
