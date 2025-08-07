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
import { showError, showSuccess } from "../../utils/alerts"; // Asegúrate de importar showSuccess si quieres usarlo
import CircularProgress from "@mui/material/CircularProgress";

export default function ReporteTipoVentas() {
  const [fechaInicio, setFechaInicio] = useState(dayjs().format("YYYY-MM-DD"));
  const [fechaFin, setFechaFin] = useState(dayjs().format("YYYY-MM-DD"));
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(""); // "" significa todas
  const [tipoPago, setTipoPago] = useState("todos");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axiosClient
      .get("/admin/pos")
      .then(({ data }) => setSucursales(data))
      .catch((err) => console.error("❌ Error al cargar sucursales", err));
  }, []);

  const consultarVentas = async () => {
    setLoading(true);
    setPdfUrl(null);

    const token = localStorage.getItem("AUTH_TOKEN");

    try {
      const response = await axios.get(
        "https://mitiendaenlineamx.com.mx/api/reporte/ventas-por-pago",
        {
          params: {
            inicio: fechaInicio,
            fin: fechaFin,
            pos: sucursalSeleccionada === "" ? null : sucursalSeleccionada,
            tipo_pago: tipoPago,
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
      let mensaje = "Error al generar el reporte";
      if (error.response?.data && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          mensaje = json.error || mensaje;
        } catch (_) {
          // Si no es JSON, mantenemos el mensaje por defecto
        }
      }
      showError(mensaje);
      console.error("❌ Axios error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async () => {
    setLoading(true);
    const token = localStorage.getItem("AUTH_TOKEN");

    try {
      const response = await axios.get(
        "https://mitiendaenlineamx.com.mx/api/reporte/ventas/excel",
        {
          params: {
            inicio: fechaInicio,
            fin: fechaFin,
            pos: sucursalSeleccionada === "" ? null : sucursalSeleccionada,
            tipo_pago: tipoPago,
          },
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Descargar Excel
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ReporteVentasPorPago_${fechaInicio}_al_${fechaFin}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      let mensaje = "Error al generar el Excel";
      if (error.response?.data && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          mensaje = json.error || mensaje;
        } catch (_) {}
      }
      showError(mensaje);
      console.error("❌ Error al exportar Excel:", error);
    } finally {
      setLoading(false);
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
        📄 Reporte de Ventas por Tipo de Pago
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          mt: 3,
        }}
      >
        {/* PDF Viewer */}
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
          sx={{ width: { xs: "100%", md: 320 }, p: 3, borderRadius: 2 }}
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
                onChange={(e) =>
                  setSucursalSeleccionada(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                renderValue={(selected) => {
                  if (selected === "") return "Todas las sucursales";
                  const sucursal = sucursales.find(
                    sucursales.find((s) => s.id === selected)
                  );
                  return sucursal ? sucursal.name : "";
                }}
              >
                <MenuItem value="">Todas las sucursales</MenuItem>
                {sucursales.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="tipo-pago-label">Tipo de Pago</InputLabel>
              <Select
                labelId="tipo-pago-label"
                value={tipoPago}
                label="Tipo de Pago"
                onChange={(e) => setTipoPago(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="tc">Tarjeta de Crédito</MenuItem>
                <MenuItem value="td">Tarjeta de Débito</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
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
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>

            <Button
              variant="outlined"
              color="success"
              onClick={generarExcel}
              fullWidth
              disabled={loading}
            >
              Exportar a Excel
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
