import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Slider,
  Chip,
  Tooltip,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import { showError, showSuccess } from "../../utils/alerts";

const FIELD_CATALOG = [
  { value: "id", label: "ID", help: "Identificador interno del producto." },
  { value: "sku", label: "SKU", help: "Código único de inventario definido por la tienda." },
  { value: "name", label: "Nombre", help: "Nombre público del producto." },
  { value: "base_price", label: "Base price", help: "Precio base antes de impuestos y descuentos." },
  { value: "iva", label: "IVA", help: "Porcentaje de IVA aplicado al producto." },
  { value: "price", label: "Precio", help: "Precio final de venta con impuestos/ajustes." },
  { value: "discount", label: "Descuento", help: "Descuento en porcentaje (0 si no hay)." },
  { value: "new", label: "Nuevo (0/1)", help: "Marca de novedad: 1 si es nuevo, 0 si no." },
  { value: "rating", label: "Rating", help: "Calificación promedio del producto." },
  { value: "saleCount", label: "Ventas", help: "Acumulado de ventas registradas." },
  { value: "stock", label: "Stock", help: "Existencias disponibles (puede ser decimal)." },
  { value: "shortDescription", label: "Desc. corta", help: "Resumen breve para listados." },
  { value: "fullDescription", label: "Desc. completa", help: "Descripción detallada." },
  { value: "clave_producto_sat", label: "Clave prod. SAT", help: "Clave del catálogo SAT para el producto." },
  { value: "clave_unidad_sat", label: "Clave unidad SAT", help: "Clave SAT correspondiente a la unidad." },
  { value: "categories", label: "Categorías", help: "Categorías (separadas por coma)." },
  { value: "images", label: "Imágenes", help: "Inserta imágenes embebidas en el Excel." },
];

const DEFAULT_FIELDS = FIELD_CATALOG.map(f => f.value); // por defecto: todos

export default function ReporteProductosExcelAuth() {
  const navigate = useNavigate();
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS);
  const [imagesCount, setImagesCount] = useState(5); // 1..10
  const [downloading, setDownloading] = useState(false);

  const includesImages = useMemo(
    () => selectedFields.includes("images"),
    [selectedFields]
  );

  const toggleAll = () => {
    if (selectedFields.length === FIELD_CATALOG.length) {
      setSelectedFields([]); // limpiar todo
    } else {
      setSelectedFields(DEFAULT_FIELDS); // seleccionar todo
    }
  };

  const handleChangeFields = (e) => {
    const val = e.target.value;
    setSelectedFields(typeof val === "string" ? val.split(",") : val);
  };

  const getFilenameFromCD = (cdHeader) => {
    if (!cdHeader) return null;
    const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cdHeader);
    if (star?.[1]) {
      try { return decodeURIComponent(star[1]); } catch { /* ignore */ }
    }
    const normal = /filename="?([^"]+)"?/i.exec(cdHeader);
    return normal?.[1] || null;
  };

  const descargarExcel = async () => {
    if (selectedFields.length === 0) {
      showError("Selecciona al menos un campo para exportar.");
      return;
    }

    setDownloading(true);
    try {
      const params = {
        fields: selectedFields.join(","),
        _t: Date.now(),
      };
      if (includesImages) {
        params.images = imagesCount; // 1..10
      }

      const resp = await axiosClient.get("/reportes/productos-excel", {
        responseType: "blob",
        headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        params,
        timeout: 120000,
      });

      const contentType = resp.headers?.["content-type"] || "";
      const isXlsx = contentType
        .toLowerCase()
        .includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      if (!isXlsx) {
        const text = await resp.data.text?.().catch(() => null);
        if (text) {
          try {
            const json = JSON.parse(text);
            showError(json?.message || json?.error || "No se pudo generar el Excel.");
            return;
          } catch {
            showError(text.slice(0, 300) || "Respuesta no válida al generar el Excel.");
            return;
          }
        }
        showError("El servidor no devolvió un .xlsx válido.");
        return;
      }

      const filename = getFilenameFromCD(resp.headers?.["content-disposition"]) || "productos.xlsx";
      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);

      showSuccess("Excel generado correctamente.");
    } catch (e) {
      try {
        const text = await e?.response?.data?.text?.();
        if (text) {
          try {
            const json = JSON.parse(text);
            showError(json?.message || json?.error || "Error al generar/descargar el Excel.");
          } catch {
            showError(text.slice(0, 300));
          }
        } else {
          showError("Error al generar/descargar el Excel.");
        }
      } catch {
        showError("Error al generar/descargar el Excel.");
      }
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Button variant="outlined" onClick={() => navigate("/admin/reportes")} sx={{ mb: 2 }}>
        ← Regresar a Reportes
      </Button>

      <Typography variant="h5" gutterBottom>
        <Inventory2OutlinedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        📦 Inventario
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Panel de configuración y descarga */}
        <Paper elevation={3} sx={{ width: { xs: "100%", md: 380 }, p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Configuración de exportación
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="fields-label">Campos a exportar</InputLabel>
              <Select
                labelId="fields-label"
                multiple
                value={selectedFields}
                onChange={handleChangeFields}
                label="Campos a exportar"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((v) => {
                      const cfg = FIELD_CATALOG.find((f) => f.value === v);
                      return <Chip key={v} label={cfg?.label || v} size="small" />;
                    })}
                  </Box>
                )}
              >
                {FIELD_CATALOG.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    <Checkbox checked={selectedFields.indexOf(f.value) > -1} />
                    <ListItemText primary={f.label} secondary={f.help} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1}>
              <Button variant="text" onClick={toggleAll}>
                {selectedFields.length === FIELD_CATALOG.length ? "Limpiar" : "Seleccionar todo"}
              </Button>
            </Stack>

            {includesImages && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Cantidad de imágenes</Typography>
                  <Tooltip title="Cantidad de columnas image_1…image_N a embeber en el Excel (tamaño original).">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
                <Slider
                  value={imagesCount}
                  onChange={(_, v) => setImagesCount(v)}
                  min={1}
                  max={10}
                  step={1}
                  valueLabelDisplay="on"
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={descargarExcel}
              fullWidth
              disabled={downloading}
              startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadOutlinedIcon />}
            >
              {downloading ? "Generando Excel…" : "Descargar Excel"}
            </Button>
          </Stack>
        </Paper>

        {/* Explicación de campos */}
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 2, border: "1px solid #eee" }}>
          <Typography variant="subtitle1" gutterBottom>
            ¿Qué significa cada campo?
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.2}>
            {FIELD_CATALOG.filter(f => f.value !== "images").map((f) => (
              <Stack key={f.value} direction="row" spacing={1} alignItems="flex-start">
                <Chip label={f.label} size="small" />
                <Typography variant="body2" color="text.secondary">{f.help}</Typography>
              </Stack>
            ))}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Chip label="Imágenes (image_1..image_N)" size="small" />
              <Typography variant="body2" color="text.secondary">
                Si seleccionas <b>Imágenes</b>, el archivo incluye columnas <i>image_1…image_N</i> con las
                fotos embebidas en su tamaño original (no URLs). Puedes controlar cuántas columnas se crean
                (1 a 10). Si algún producto no tiene suficientes imágenes, las celdas quedan vacías.
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ mt: 3, p: 2, bgcolor: "#fafafa", border: "1px dashed #e0e0e0", borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              La exportación siempre toma <b>solo los productos existentes.</b>. El archivo se descarga en
              formato <b>.xlsx</b> con la cabecera en la <b>línea 2</b> (la línea 1 contiene una nota informativa).
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
