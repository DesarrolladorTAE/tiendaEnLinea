import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Button,
  FormControl,
  TextField,
  Checkbox,
  Slider,
  Chip,
  Tooltip,
  Alert,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
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
  { value: "purchase_cost", label: "Costo de compra", help: "Costo unitario al que se adquirió el producto, antes de calcular su precio de venta." },
  { value: "base_price", label: "Precio base", help: "Precio base antes de impuestos y descuentos." },
  { value: "iva", label: "IVA", help: "Porcentaje de IVA aplicado al producto." },
  { value: "price", label: "Precio", help: "Precio final de venta con impuestos/ajustes." },
  { value: "discount", label: "Descuento", help: "Descuento en porcentaje (0 si no hay)." },
  { value: "new", label: "Nuevo (0/1)", help: "Marca de novedad: 1 si es nuevo, 0 si no." },
  { value: "rating", label: "Rating", help: "Calificación promedio del producto." },
  { value: "saleCount", label: "Ventas", help: "Acumulado de ventas registradas." },
  { value: "stock", label: "Stock", help: "Existencias disponibles (puede ser decimal)." },
  { value: "visible", label: "Visible", help: "Indica si el producto se muestra en la tienda en línea. Es independiente de sus existencias." },
  { value: "shortDescription", label: "Desc. corta", help: "Resumen breve para listados." },
  { value: "fullDescription", label: "Desc. completa", help: "Descripción detallada." },
  { value: "clave_producto_sat", label: "Clave prod. SAT", help: "Clave del catálogo SAT para el producto." },
  { value: "clave_unidad_sat", label: "Clave unidad SAT", help: "Clave SAT correspondiente a la unidad." },
  { value: "categories", label: "Categorías", help: "Categorías (separadas por coma)." },
  { value: "images", label: "Imágenes", help: "Inserta imágenes embebidas en el Excel." },
];

const DEFAULT_FIELDS = FIELD_CATALOG.map(f => f.value); // por defecto: todos
const modeCardSx = (selected) => ({
  m: 0, p: 1, gap: 0.5, alignItems: "flex-start", borderRadius: 2.5,
  border: "1px solid", borderColor: selected ? "#2563eb" : "#e2e8f0",
  bgcolor: selected ? "#eff6ff" : "#fff",
  boxShadow: selected ? "0 0 0 1px #2563eb" : "none",
  "&:hover": { borderColor: "#2563eb" },
  "& .MuiRadio-root": { p: 0.5, color: "#94a3b8", "&.Mui-checked": { color: "#2563eb" } },
  "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
  "& .MuiTypography-body2": { fontSize: 12, lineHeight: 1.4 },
  "&:has(.Mui-focusVisible)": { outline: "3px solid #93c5fd", outlineOffset: 3 },
});

export default function ReporteProductosExcelAuth() {
  const navigate = useNavigate();
  const [fieldSelections, setFieldSelections] = useState({ display: DEFAULT_FIELDS, import: DEFAULT_FIELDS.filter((field) => field !== "id" && field !== "images") });
  const [fieldSearch, setFieldSearch] = useState("");
  const [imagesCount, setImagesCount] = useState(5); // 1..10
  const [downloading, setDownloading] = useState(false);
  const [exportMode, setExportMode] = useState("display");
  const downloadPending = useRef(false);
  const selectedFields = fieldSelections[exportMode];
  const availableFields = FIELD_CATALOG.filter((field) => exportMode !== "import" || (field.value !== "id" && field.value !== "images"));
  const setSelectedFields = (update) => setFieldSelections((previous) => ({ ...previous, [exportMode]: typeof update === "function" ? update(previous[exportMode]) : update }));
  const fieldLabel = (field) => exportMode === "import" ? field.value : field.label;

  const includesImages = useMemo(
    () => selectedFields.includes("images"),
    [selectedFields]
  );

  const toggleAll = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([]); // limpiar todo
    } else {
      setSelectedFields(availableFields.map((field) => field.value)); // seleccionar todo
    }
  };

  const toggleField = (value) => setSelectedFields((previous) =>
    availableFields.map((field) => field.value).filter((key) => key === value ? !previous.includes(key) : previous.includes(key))
  );
  const normalizeSearch = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matchingFields = availableFields.filter((field) => normalizeSearch(field.label + " " + field.value).includes(normalizeSearch(fieldSearch.trim())));

  const exportFilename = (mode) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const description = mode === "import" ? "Productos_Importar" : "Inventario_Consulta";
    return description + "_" + date.year + "-" + date.month + "-" + date.day + "_" + date.hour + "-" + date.minute + "-" + date.second + ".xlsx";
  };

  const descargarExcel = async () => {
    if (downloadPending.current) return;
    if (selectedFields.length === 0) {
      showError("Selecciona al menos un campo para exportar.");
      return;
    }

    downloadPending.current = true;
    setDownloading(true);
    try {
      const params = {
        fields: selectedFields.join(","),
        mode: exportMode,
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

      const filename = exportFilename(exportMode);
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
      downloadPending.current = false;
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1.5, sm: 2 }, bgcolor: "#f8fafc", color: "#0f172a", borderRadius: 3,
      height: { xs: "auto", md: "calc(100dvh - 32px)" }, boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: 0, overflow: { xs: "visible", md: "hidden" },
      "& > .MuiButton-root, & > .MuiStack-root, & > .MuiTypography-root": { flexShrink: 0 },
      "& *": { scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" },
      "& .MuiTypography-root, & .MuiFormLabel-root": { color: "#0f172a" },
      "& .MuiTypography-colorTextSecondary": { color: "#64748b" },
      "& .MuiButton-root": { textTransform: "none", fontWeight: 700, borderRadius: 2.5 },
      "& .MuiInputBase-root": { bgcolor: "#fff", color: "#0f172a", borderRadius: 3 },
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
      "& .MuiChip-root": { bgcolor: "#eff6ff", color: "#1d4ed8", borderRadius: 1.5, fontWeight: 600 },
    }}>
      <Button variant="text" onClick={() => navigate("/admin/reportes")} sx={{ mb: 0.5, color: "#475569", px: 0, alignSelf: "flex-start", fontSize: 12 }}>
        ← Regresar a Reportes
      </Button>

      <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
        <Box sx={{ display: "flex", p: 1, bgcolor: "#dbeafe", color: "#2563eb", borderRadius: 2.5 }}><Inventory2OutlinedIcon sx={{ fontSize: 26 }} /></Box>
        <Box><Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700 }}>Reportes</Typography>
          <Typography component="h1" variant="h4" fontWeight={800} sx={{ fontSize: { xs: 26, sm: 32 }, letterSpacing: -0.6 }}>Inventario</Typography>
          <Typography variant="body2" color="text.secondary">Exportación de productos</Typography>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 12 }}>Prepara tu Excel para consultar tu inventario o actualizar tu catálogo.</Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
          alignItems: "stretch",
          gap: 2,
          mt: 2,
          flex: { md: 1 }, minHeight: 0, overflow: { xs: "visible", md: "hidden" },
        }}
      >
        {/* Panel de configuración y descarga */}
        <Paper elevation={0} sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: { md: "hidden" }, bgcolor: "#fff", boxSizing: "border-box", p: 2, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 32px #0f172a06" }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Configuración de exportación
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5} sx={{ minHeight: 0, overflowY: { xs: "visible", md: "auto" }, overscrollBehavior: { md: "contain" }, pr: { md: 0.75 }, pb: 0.5 }}>
            <FormControl disabled={downloading}>
              <FormLabel id="export-mode-label" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>¿Para qué utilizarás este Excel?</FormLabel>
              <RadioGroup sx={{ gap: 1 }} aria-labelledby="export-mode-label" name="export-mode" value={exportMode} onChange={(event) => setExportMode(event.target.value)}>
                <FormControlLabel value="display" control={<Radio />} sx={modeCardSx(exportMode === "display")} label={<Box>
                  <Typography variant="body2" fontWeight={600}>Consultar información</Typography>
                  <Typography variant="body2" color="text.secondary">Descarga los productos con nombres de columnas fáciles de entender. Ideal para consultar precios, costos y existencias.</Typography>
                </Box>} />
                <FormControlLabel value="import" control={<Radio />} sx={modeCardSx(exportMode === "import")} label={<Box>
                  <Typography variant="body2" fontWeight={600}>Importar o actualizar productos</Typography>
                  <Typography variant="body2" color="text.secondary">Descarga los productos con nombres técnicos de columnas, preparados para su posterior importación al sistema.</Typography>
                </Box>} />
              </RadioGroup>
            </FormControl>
            <Alert severity="info" sx={{ bgcolor: "#f0f7ff", color: "#1e40af", borderRadius: 3, border: "1px solid #dbeafe", fontSize: 13 }}>
              {exportMode === "display"
                ? "Encabezados descriptivos en la fila 2 y productos desde la fila 3. Incluye una fila informativa; ID e imágenes se exportan si los seleccionas. Visible se muestra como Sí/No."
                : "Encabezados técnicos en la fila 1 y productos desde la fila 2, sin fila informativa. El backend omite ID e imágenes aunque estén seleccionados. Visible se exporta como 1/0."}
            </Alert>
            <Divider />
            <Box>
              <Typography id="export-fields-title" variant="subtitle2" fontWeight={700} mb={1}>Campos a exportar</Typography>
              <TextField fullWidth size="small" label="Buscar campo" placeholder="Nombre, costo, visible…" value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} type="search" sx={{ mb: 1 }} />
              <Box role="group" aria-labelledby="export-fields-title" sx={{ maxHeight: { xs: 220, md: 190 }, overflowY: "auto", overscrollBehavior: "contain", p: 0.5, border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#f8fafc" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 0.5 }}>
                  {matchingFields.map((field) => <Tooltip key={field.value} title={`${field.label}: ${field.help}`} placement="top" enterDelay={500}>
                    <FormControlLabel data-export-field={field.value} disabled={downloading} control={<Checkbox size="small" value={field.value} checked={selectedFields.includes(field.value)} onChange={() => toggleField(field.value)} sx={{ p: 0.75 }} />} label={fieldLabel(field)}
                      sx={{ m: 0, p: 0.25, minHeight: 38, borderRadius: 1.5, border: "1px solid", borderColor: selectedFields.includes(field.value) ? "#bfdbfe" : "transparent", bgcolor: selectedFields.includes(field.value) ? "#eff6ff" : "#fff", "& .MuiFormControlLabel-label": { fontSize: 12, lineHeight: 1.3 }, "&:hover": { borderColor: "#93c5fd" } }} />
                  </Tooltip>)}
                </Box>
                {!matchingFields.length && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No hay campos que coincidan con tu búsqueda.</Typography>}
              </Box>
              <Typography variant="caption" color="text.secondary">La búsqueda solo filtra la lista; conserva tus campos seleccionados.</Typography>
              {exportMode === "import" && <Typography variant="caption" sx={{ display: "block", color: "#1d4ed8", mt: 0.5 }}>Solo se muestran campos compatibles con importación y sus nombres técnicos. La selección de consulta se conserva por separado.</Typography>}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">{selectedFields.length} de {availableFields.length} campos seleccionados</Typography>
              <Button variant="text" onClick={toggleAll}>
                {selectedFields.length === availableFields.length ? "Limpiar" : "Seleccionar todo"}
              </Button>
            </Stack>

            {includesImages && exportMode === "display" && (
              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
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
              sx={{ minHeight: 46, flexShrink: 0, fontSize: 12, position: { md: "sticky" }, bottom: 0, zIndex: 1, bgcolor: "#2563eb", boxShadow: "0 4px 12px #2563eb26", "&:hover": { bgcolor: "#1d4ed8", boxShadow: "0 6px 16px #2563eb33" } }}
              disabled={downloading}
              startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadOutlinedIcon />}
            >
              {downloading ? "Generando Excel…" : exportMode === "display" ? "DESCARGAR REPORTE EXCEL" : "DESCARGAR EXCEL PARA IMPORTAR"}
            </Button>
          </Stack>
        </Paper>

        {/* Explicación de campos */}
        <Paper elevation={0} sx={{ minWidth: 0, minHeight: 0, overflowY: { xs: "visible", md: "auto" }, overscrollBehavior: { md: "contain" }, bgcolor: "#fff", p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            ¿Qué significa cada campo?
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.2}>
            {availableFields.filter(f => f.value !== "images").map((f) => (
              <Stack key={f.value} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Chip label={fieldLabel(f)} size="small" />
                <Typography variant="body2" color="text.secondary">{f.help}{f.value === "visible" ? exportMode === "import" ? " En este archivo: 1/0." : " En este archivo: Sí/No." : f.value === "id" && exportMode === "import" ? " Se omite automáticamente en el modo importación." : ""}</Typography>
              </Stack>
            ))}
            <Divider sx={{ my: 1 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start" sx={{ p: 2, borderRadius: 3, bgcolor: "#eff6ff" }}>
              <Chip label="Imágenes (image_1..image_N)" size="small" />
              <Typography variant="body2" color="text.secondary">
                {exportMode === "import" ? "Las imágenes no se incluyen en el Excel para importar, aunque estén seleccionadas." : <>Si seleccionas <b>Imágenes</b>, el archivo incluye columnas <i>image_1…image_N</i> con las
                fotos embebidas en su tamaño original (no URLs). Puedes controlar cuántas columnas se crean
                (1 a 10). Si algún producto no tiene suficientes imágenes, las celdas quedan vacías.</>}
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ mt: 3, p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">
              La exportación toma <b>solo los productos existentes</b> y genera un archivo <b>.xlsx</b>. {exportMode === "import"
                ? "Encabezados en fila 1 y productos desde fila 2, sin fila informativa, ID ni imágenes."
                : "Fila 1 informativa, encabezados en fila 2 y productos desde fila 3."} El costo de compra está disponible en ambas modalidades. Si no hay productos, el archivo conserva los encabezados correspondientes.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
