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
import CircularProgress from "@mui/material/CircularProgress";

export default function ReporteVentas() {
  const [fechaInicio, setFechaInicio] = useState(dayjs().format("YYYY-MM-DD"));
  const [fechaFin, setFechaFin] = useState(dayjs().format("YYYY-MM-DD"));

  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("todas"); // "todas" | number

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas"); // "todas" | number

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Helpers para normalizar respuesta de API (porque la gente ama cambiar formatos)
  const normalizeArray = (payload) => {
    const d = payload?.data ?? payload;
    // soporta: [..] | { categories: [..] } | { data: [..] }
    const arr =
      Array.isArray(d) ? d : Array.isArray(d?.categories) ? d.categories : Array.isArray(d?.data) ? d.data : [];
    return arr;
  };

  const sortByName = (arr) =>
    [...(arr || [])].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "es"));

  // Cargar sucursales (POS)
  useEffect(() => {
    axiosClient
      .get("/admin/pos")
      .then((res) => {
        const arr = normalizeArray(res);
        setSucursales(sortByName(arr));
      })
      .catch((err) => console.error("❌ Error al cargar sucursales", err));
  }, []);

  // Cargar categorías (FIX real)
  useEffect(() => {
    axiosClient
      .get("/admin/categories")
      .then((res) => {
        const arr = normalizeArray(res);
        setCategorias(sortByName(arr));
      })
      .catch((err) => console.error("❌ Error al cargar categorías", err));
  }, []);

  // Limpieza del ObjectURL del PDF para evitar fugas de memoria
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
      sucursalSeleccionada === "todas" || sucursalSeleccionada == null
        ? "todas"
        : Number(sucursalSeleccionada),
    categoria:
      categoriaSeleccionada === "todas" || categoriaSeleccionada == null
        ? "todas"
        : Number(categoriaSeleccionada),
  });

  const consultarVentas = async () => {
    if (!validarFechas()) return;

    setLoading(true);

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
        "https://mitiendaenlineamx.com.mx/api/reporte-utilidades/pdf",
        {
          params: buildParams(),
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      // Manejo especial del 422 con Blob JSON
      if (error.response?.status === 422 && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);

          const productos = Array.isArray(json.productos)
            ? json.productos
            : Object.values(json.productos || {});

          if (productos.length > 0) {
            await Swal.fire({
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
              if (result.isConfirmed) navigate("/admin/products");
            });
          } else {
            showError(json.error || "Error al generar el reporte");
          }
        } catch (e) {
          showError("❌ Error inesperado al interpretar la respuesta.");
          console.error("❌ Error al parsear JSON:", e, text);
        }
      } else {
        showError("Error al generar el reporte");
        console.error("❌ Axios error:", error);
      }
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
        Reporte de Utilidades
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
          sx={{ width: { xs: "100%", md: 320 }, p: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Filtros
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {/* Sucursal */}
            <FormControl fullWidth size="small">
              <InputLabel id="sucursal-label">Sucursal</InputLabel>
              <Select
                labelId="sucursal-label"
                value={sucursalSeleccionada}
                label="Sucursal"
                onChange={(e) => {
                  const v = e.target.value;
                  setSucursalSeleccionada(v === "todas" ? "todas" : Number(v));
                }}
                renderValue={(selected) => {
                  if (selected === "todas" || selected == null)
                    return "Todas las sucursales";
                  const idSel = Number(selected);
                  const suc = (sucursales || []).find((s) => Number(s.id) === idSel);
                  return suc
                    ? suc.name ?? suc.nombre ?? `Sucursal #${idSel}`
                    : `Sucursal #${idSel}`;
                }}
              >
                <MenuItem value="todas">Todas las sucursales</MenuItem>
                {(sucursales || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name ?? s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Categoría */}
            <FormControl fullWidth size="small">
              <InputLabel id="categoria-label">Categoría</InputLabel>
              <Select
                labelId="categoria-label"
                value={categoriaSeleccionada}
                label="Categoría"
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoriaSeleccionada(v === "todas" ? "todas" : Number(v));
                }}
                renderValue={(selected) => {
                  if (selected === "todas" || selected == null)
                    return "Todas las categorías";
                  const idSel = Number(selected);
                  const cat = (categorias || []).find((c) => Number(c.id) === idSel);
                  return cat ? cat.name : `Categoría #${idSel}`;
                }}
              >
                <MenuItem value="todas">Todas las categorías</MenuItem>
                {(categorias || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
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

            {/* Botón generar */}
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
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
