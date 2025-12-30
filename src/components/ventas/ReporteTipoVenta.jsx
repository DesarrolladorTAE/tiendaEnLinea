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
import { showError, showSuccess } from "../../utils/alerts";
import CircularProgress from "@mui/material/CircularProgress";

export default function ReporteTipoVentas() {
  const [fechaInicio, setFechaInicio] = useState(dayjs().format("YYYY-MM-DD"));
  const [fechaFin, setFechaFin] = useState(dayjs().format("YYYY-MM-DD"));

  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(""); // "" | number

  const [tipoPago, setTipoPago] = useState("todos");

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas"); // "todas" | number

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Cargar sucursales
  useEffect(() => {
    axiosClient
      .get("/admin/pos")
      .then(({ data }) => setSucursales(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Error al cargar sucursales", err));
  }, []);

  // Cargar categorías
  useEffect(() => {
    axiosClient
      .get("/admin/categories")
      .then(({ data }) => setCategorias(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Error al cargar categorías", err));
  }, []);

  // Limpieza del ObjectURL del PDF (evita fugas de memoria)
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const validarFechas = () => {
    if (!fechaInicio || !fechaFin) {
      showError("Selecciona una fecha de inicio y una fecha de fin.");
      return false;
    }
    if (dayjs(fechaInicio).isAfter(dayjs(fechaFin))) {
      showError("La fecha de inicio no puede ser mayor que la fecha de fin.");
      return false;
    }
    return true;
  };

  const buildParams = () => ({
    inicio: fechaInicio,
    fin: fechaFin,
    pos:
      sucursalSeleccionada === "" || sucursalSeleccionada == null
        ? null
        : Number(sucursalSeleccionada),
    tipo_pago: tipoPago,
    categoria:
      categoriaSeleccionada === "todas" || categoriaSeleccionada == null
        ? "todas"
        : Number(categoriaSeleccionada),
  });

  const consultarVentas = async () => {
    if (!validarFechas()) return;

    setLoading(true);

    // Limpia PDF anterior
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) {
      showError("Sesión no válida. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "https://mitiendaenlineamx.com.mx/api/reporte/ventas-por-pago",
        {
          params: buildParams(),
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      showSuccess?.("Reporte generado.");
    } catch (error) {
      let mensaje = "Error al generar el reporte";
      if (error.response?.data && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          mensaje = json.error || mensaje;
        } catch (_) {}
      }
      showError(mensaje);
      console.error("❌ Axios error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async () => {
    if (!validarFechas()) return;

    setLoading(true);

    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) {
      showError("Sesión no válida. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "https://mitiendaenlineamx.com.mx/api/reporte/ventas/excel",
        {
          params: buildParams(),
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
      window.URL.revokeObjectURL(url);

      showSuccess?.("Excel exportado.");
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
        Reporte de Ventas por Tipo de Pago
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
            {/* Sucursal */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="sucursal-label" shrink>
                Sucursal
              </InputLabel>
              <Select
                labelId="sucursal-label"
                label="Sucursal"
                value={sucursalSeleccionada} // "" | number
                displayEmpty
                onChange={(e) => {
                  const v = e.target.value;
                  setSucursalSeleccionada(v === "" ? "" : Number(v));
                }}
                renderValue={(selected) => {
                  if (selected === "" || selected == null)
                    return "Todas las sucursales";
                  const selId = Number(selected);
                  const suc = (sucursales || []).find(
                    (x) => Number(x.id) === selId
                  );
                  return suc
                    ? suc.name ?? suc.nombre ?? `Sucursal #${selId}`
                    : `Sucursal #${selId}`;
                }}
              >
                <MenuItem value="">
                  <em>Todas las sucursales</em>
                </MenuItem>
                {(sucursales || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name ?? s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Categoría */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="categoria-label" shrink>
                Categoría
              </InputLabel>
              <Select
                labelId="categoria-label"
                label="Categoría"
                value={categoriaSeleccionada} // "todas" | number
                displayEmpty
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoriaSeleccionada(v === "todas" ? "todas" : Number(v));
                }}
                renderValue={(selected) => {
                  if (selected === "todas" || selected == null)
                    return "Todas las categorías";
                  const selId = Number(selected);
                  const cat = (categorias || []).find(
                    (c) => Number(c.id) === selId
                  );
                  return cat ? cat.name : `Categoría #${selId}`;
                }}
              >
                <MenuItem value="todas">
                  <em>Todas las categorías</em>
                </MenuItem>
                {(categorias || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tipo de pago */}
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

            {/* Fechas */}
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

            {/* Botones */}
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
