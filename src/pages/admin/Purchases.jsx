// src/pages/admin/Purchases.jsx  (o VentasDelMes.jsx)
// ✅ Versión completa con:
// 1) Total = (status confirmado O status facturada) Y (con folio/pdf/xml)
// 2) Ventana de facturación = TODO el mes + 72h después del FIN de mes (para que Feb 2026 diga 03 de marzo)
// 3) Chip "Facturada" en azul (info)
// 4) Fix del error: isFacturada sí está definida

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  Checkbox,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ZoomOutMapRoundedIcon from "@mui/icons-material/ZoomOutMapRounded";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/* ================= helpers ================= */
const monthsMx = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthRange(isoYear, isoMonth0) {
  const start = new Date(isoYear, isoMonth0, 1, 0, 0, 0, 0);
  const end = new Date(isoYear, isoMonth0 + 1, 1, 0, 0, 0, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startStr: fmt(start), endStr: fmt(end) };
}

function money(n = 0) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function titleCase(s) {
  const t = String(s || "");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const blockAutoComplete = {
  autoComplete: "off",
  inputProps: {
    autoComplete: "new-password",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: "false",
  },
};

// ✅ SOLO confirmados/exitosa/success
function isConfirmado(statusRaw) {
  const s = String(statusRaw || "").trim().toLowerCase();
  return ["confirmado", "confirmada", "exitosa", "success"].includes(s);
}

// ✅ status facturada (para el TOTAL y chip)
function isStatusFacturada(statusRaw) {
  const s = String(statusRaw || "").trim().toLowerCase();
  return ["facturada", "facturado"].includes(s);
}

// ✅ (FIX) esta función faltaba en tu archivo cuando copiaste cambios
function isFacturada(v) {
  return Boolean(v?.folio_factura || v?.pdf_url || v?.xml_url);
}

// ✅ Para TOTAL: (confirmado O status facturada) Y (con folio/pdf/xml)
function isParaTotal(v) {
  const st = String(v?.status || "").trim().toLowerCase();

  // ✅ si está confirmada, cuenta SIEMPRE (aunque no tenga factura)
  if (isConfirmado(st)) return true;

  // ✅ si dice "facturada", entonces sí pedimos evidencia de factura (folio/pdf/xml)
  if (isStatusFacturada(st)) return isFacturada(v);

  return false;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatMxDateTime(d) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * ✅ Ventana de facturación:
 * - Disponible TODO el mes seleccionado
 * - + 72h después del FIN de mes (para que Feb 2026 diga 03 de marzo)
 */
function getFacturacionWindow(isoYear, isoMonth0, now = new Date()) {
  const startOfMonth = new Date(isoYear, isoMonth0, 1, 0, 0, 0, 0);
  const startNextMonth = new Date(isoYear, isoMonth0 + 1, 1, 0, 0, 0, 0);

  // fin de mes = 1ms antes del siguiente mes
  const endOfMonth = new Date(startNextMonth.getTime() - 1);

  // 72h después del fin del mes (no desde el inicio del siguiente)
  const closesAt = addHours(endOfMonth, 72);

  if (now < startOfMonth) {
    return {
      ok: false,
      phase: "ANTES",
      openAt: startOfMonth,
      closesAt,
      reason: "Aún no inicia el mes seleccionado.",
    };
  }

  if (now > closesAt) {
    return {
      ok: false,
      phase: "DESPUES",
      openAt: startOfMonth,
      closesAt,
      reason: "Ventana de facturación vencida (mes + 72 hrs después del fin de mes).",
    };
  }

  return {
    ok: true,
    phase: "VENTANA",
    openAt: startOfMonth,
    closesAt,
    reason: "",
  };
}

/**
 * Reglas para facturar (para seleccionar / timbrar):
 * - Debe estar dentro de ventana (mes + 72h)
 * - No facturar si ya trae folio/pdf/xml
 * - No facturar pendientes/canceladas/rechazadas/failed
 * - Solo confirmadas (NO "facturada" aquí, porque facturada ya no se timbra)
 */
function getElegibilidad(v, puedeFacturarMes, factWindow) {
  const status = String(v?.status || "").trim().toLowerCase();
  const yaFacturada = isFacturada(v);

  const bloqueados = [
    "pendiente",
    "cancelado",
    "cancelada",
    "rechazado",
    "rechazada",
    "failed",
    "fallido",
  ];
  const isBloqueado = bloqueados.includes(status);

  const esConfirmado = isConfirmado(status);

  if (!puedeFacturarMes) {
    return {
      ok: false,
      reason: `Facturación cerrada: ${factWindow?.reason || "fuera de ventana"}`,
    };
  }

  if (yaFacturada) return { ok: false, reason: "Ya está facturada" };
  if (isBloqueado) return { ok: false, reason: `No facturable (${status || "estado"})` };
  if (!esConfirmado) return { ok: false, reason: `Solo confirmadas (${status || "estado"})` };

  return { ok: true, reason: "" };
}

function statusChipProps(statusRaw) {
  const s = String(statusRaw || "").trim().toLowerCase();

  if (["confirmado", "confirmada", "exitosa", "success"].includes(s)) {
    return { color: "success", label: titleCase(s) || "Confirmado" };
  }

  // ✅ AZUL (info) para facturada
  if (["facturada", "facturado"].includes(s)) {
    return { color: "info", label: "Facturada" };
  }

  if (["rechazado", "rechazada", "failed", "fallido"].includes(s)) {
    return { color: "error", label: titleCase(s) || "Rechazado" };
  }
  if (["pendiente"].includes(s)) {
    return { color: "warning", label: "Pendiente" };
  }
  if (["cancelado", "cancelada"].includes(s)) {
    return { color: "default", label: titleCase(s) };
  }
  return { color: "default", label: statusRaw || "Desconocido" };
}

const MotionPaper = motion(Paper);

/* ================= componente ================= */
export default function VentasDelMes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [seleccion, setSeleccion] = useState([]);
  const [usoCfdi, setUsoCfdi] = useState("S01");

  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  const [modalOpen, setModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState(null);
  const [comprobanteScalePct, setComprobanteScalePct] = useState(100);

  const [facturando, setFacturando] = useState(false);

  const monthLabel = `${titleCase(monthsMx[month0])} de ${year}`;

  // ✅ ventana mes + 72h después del fin de mes
  const factWindow = useMemo(() => getFacturacionWindow(year, month0, new Date()), [year, month0]);
  const puedeFacturarMes = factWindow.ok;

  const loadVentas = async () => {
    setLoading(true);
    try {
      const { startStr, endStr } = monthRange(year, month0);
      const params = new URLSearchParams({
        fecha_inicio: startStr,
        fecha_fin: endStr,
      }).toString();

      const { data } = await axios.get(`/admin/compras?${params}`);
      const todas = Array.isArray(data) ? data : [];
      todas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setVentas(todas);
      setSeleccion([]);
      setPage(1);
    } catch {
      toast.error("❌ No se pudo cargar Ventas del Mes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month0]);

  // ✅ TOTAL: (confirmadas o status facturada) + (con folio/pdf/xml)
  const total = useMemo(() => {
    return ventas.reduce((acc, v) => {
      if (!isParaTotal(v)) return acc;
      return acc + Number(v.monto || 0);
    }, 0);
  }, [ventas]);

  // ✅ ventasConMeta: elegibilidad para seleccionar/timbrar (bloquea fuera de ventana)
  const ventasConMeta = useMemo(() => {
    return ventas.map((v) => {
      const elig = getElegibilidad(v, puedeFacturarMes, factWindow);
      return { ...v, _elig: elig };
    });
  }, [ventas, puedeFacturarMes, factWindow]);

  const elegiblesIds = useMemo(
    () => ventasConMeta.filter((v) => v._elig?.ok).map((v) => v.id),
    [ventasConMeta]
  );

  const seleccionElegible = useMemo(() => {
    const set = new Set(elegiblesIds);
    return seleccion.filter((id) => set.has(id));
  }, [seleccion, elegiblesIds]);

  const allChecked = elegiblesIds.length > 0 && seleccionElegible.length === elegiblesIds.length;
  const indeterminate = seleccionElegible.length > 0 && !allChecked;

  const pageCount = Math.max(1, Math.ceil(ventasConMeta.length / rowsPerPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return ventasConMeta.slice(start, start + rowsPerPage);
  }, [page, ventasConMeta]);

  const toggleSeleccion = (v) => {
    if (!puedeFacturarMes) {
      toast.info(`Facturación cerrada: ${factWindow.reason} (Cierra: ${formatMxDateTime(factWindow.closesAt)})`);
      return;
    }
    if (!v?._elig?.ok) {
      toast.info(`No se puede seleccionar: ${v?._elig?.reason || "No elegible"}`);
      return;
    }
    setSeleccion((prev) => (prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id]));
  };

  const seleccionarTodo = (checked) => {
    if (!puedeFacturarMes) {
      toast.info(`Facturación cerrada: ${factWindow.reason} (Cierra: ${formatMxDateTime(factWindow.closesAt)})`);
      return;
    }
    setSeleccion(checked ? [...elegiblesIds] : []);
  };

  const abrirComprobante = (url) => {
    if (!url) return toast.info("No hay comprobante para esta venta.");
    setComprobanteUrl(url);
    setComprobanteScalePct(100);
    setModalOpen(true);
  };

  const exportarExcel = () => {
    const datos = ventasConMeta.map((v) => ({
      Tienda: `${v.user?.name || ""} ${v.user?.apellidos || ""}`.trim() || "Sin nombre",
      Tipo: v.tipo,
      Monto: Number(v.monto || 0),
      Descripción: v.descripcion || "",
      Referencia: v.referencia || "",
      Fecha: new Date(v.created_at).toLocaleString(),
      FolioFactura: v.folio_factura || "",
      PDF: v.pdf_url || "",
      XML: v.xml_url || "",
      Estado: v.status || "",
      Elegible: v._elig?.ok ? "Sí" : "No",
      MotivoNoElegible: v._elig?.ok ? "" : v._elig?.reason || "",
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "VentasMes");
    const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    const archivo = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(archivo, `ventas_${monthsMx[month0]}_${year}.xlsx`);
  };

  const limpiar = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth0(t.getMonth());
  };

  const buildFacturaPreview = (modo) => {
    const ids = seleccionElegible;
    const selectedRows = ventasConMeta.filter((v) => ids.includes(v.id));
    const totalSel = selectedRows.reduce((acc, v) => acc + Number(v.monto || 0), 0);
    const invalidos = seleccion.filter((id) => !ids.includes(id));
    return { ids, selectedRows, totalSel, invalidos, modo };
  };

  const confirmarFacturacion = async (modo) => {
    if (facturando) return;

    if (!puedeFacturarMes) {
      await Swal.fire({
        icon: "warning",
        title: "Facturación cerrada",
        html: `
          <div style="text-align:left;">
            <div><b>Mes:</b> ${monthLabel}</div>
            <div style="margin-top:6px;">${factWindow.reason}</div>
            <div style="margin-top:6px;"><b>Ventana:</b> ${formatMxDateTime(factWindow.openAt)} → ${formatMxDateTime(factWindow.closesAt)}</div>
            <div style="margin-top:10px;">Después de esa ventana es <b>imposible</b> facturar.</div>
          </div>
        `,
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (seleccion.length === 0) {
      return toast.info("Selecciona al menos una venta elegible.");
    }

    const { ids, totalSel, invalidos } = buildFacturaPreview(modo);

    if (ids.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Nada facturable",
        text: "Tu selección no contiene ventas elegibles para facturar.",
        confirmButtonText: "Entendido",
      });
    }

    const html = `
      <div style="text-align:left;">
        <div style="margin-bottom:8px;"><b>Mes:</b> ${monthLabel}</div>
        <div style="margin-bottom:8px;"><b>Modo:</b> ${modo}</div>
        <div style="margin-bottom:8px;"><b>Uso CFDI:</b> ${usoCfdi}</div>
        <div style="margin-bottom:8px;"><b>Ventas a facturar:</b> ${ids.length}</div>
        <div style="margin-bottom:8px;"><b>Total seleccionado:</b> ${money(totalSel)}</div>
        <div style="margin-bottom:8px;"><b>Ventana activa hasta:</b> ${formatMxDateTime(factWindow.closesAt)}</div>
        ${
          invalidos.length
            ? `<div style="margin-top:10px; padding:10px; border-radius:10px; background:rgba(255,193,7,.12);">
                 <b>Se ignorarán (no elegibles):</b> ${invalidos.length}
               </div>`
            : ""
        }
        <div style="margin-top:10px; padding:10px; border-radius:10px; background:rgba(0,0,0,0.04);">
          <b>Reglas:</b> No se facturan pendientes/canceladas/rechazadas ni ya facturadas. Solo confirmadas.
        </div>
      </div>
    `;

    const ok = await Swal.fire({
      icon: "question",
      title: "Confirmar facturación",
      html,
      showCancelButton: true,
      confirmButtonText: "Sí, facturar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!ok.isConfirmed) return;
    return ids;
  };

  const timbrarPG = async () => {
    const ids = await confirmarFacturacion("Público General");
    if (!ids || ids.length === 0) return;

    setFacturando(true);
    try {
      const { data } = await axios.post("/admin/facturacion-saldo/publico-general", {
        transaccion_ids: ids,
        uso_cfdi: usoCfdi,
        formaPago: "03",
        metodoPago: "PUE",
      });

      await Swal.fire({
        icon: "success",
        title: "Timbrado exitoso ✅",
        text: `Folio: ${data?.folio || "N/D"} | Ventas: ${ids.length}`,
        confirmButtonText: "Listo",
      });

      await loadVentas();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error al timbrar (PG)",
        text: e?.response?.data?.message || "Ocurrió un error inesperado.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setFacturando(false);
    }
  };

  const timbrarPorTienda = async () => {
    const ids = await confirmarFacturacion("Por Tienda");
    if (!ids || ids.length === 0) return;

    setFacturando(true);
    try {
      const { data } = await axios.post("/admin/facturacion-saldo/por-usuario", {
        transaccion_ids: ids,
        uso_cfdi: usoCfdi === "S01" ? "G03" : usoCfdi,
        formaPago: "03",
        metodoPago: "PUE",
      });

      await Swal.fire({
        icon: "success",
        title: "Timbrado exitoso ✅",
        text: `Folio: ${data?.folio || "N/D"} | Ventas: ${ids.length}`,
        confirmButtonText: "Listo",
      });

      await loadVentas();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error al timbrar (por tienda)",
        text: e?.response?.data?.message || "Ocurrió un error inesperado.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setFacturando(false);
    }
  };

  /* ================= UI parts ================= */

  const Header = (
    <MotionPaper
      elevation={0}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.background.paper, 0.70)} 100%)`,
        backdropFilter: "blur(10px)",
        boxShadow: `0 18px 60px ${alpha("#000", 0.10)}`,
        overflow: "hidden",
        position: "relative",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: -2,
          background: `radial-gradient(900px 280px at 18% 0%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 60%)`,
          pointerEvents: "none",
        },
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={2}>
        <Stack spacing={0.4}>
          <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
            <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.3 }}>
              Ventas del Mes
            </Typography>

            <Chip
              icon={<EventRoundedIcon />}
              label={`Mes: ${monthLabel}`}
              color="secondary"
              sx={{ fontWeight: 900, borderRadius: 999 }}
            />

            <Chip
              icon={<PaidRoundedIcon />}
              label={`Total: ${money(total)}`}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.main,
              }}
            />

            <Chip
              icon={puedeFacturarMes ? <DoneAllRoundedIcon /> : <WarningAmberRoundedIcon />}
              label={
                puedeFacturarMes
                  ? `Facturación activa hasta: ${formatMxDateTime(factWindow.closesAt)}`
                  : `Facturación cerrada`
              }
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(puedeFacturarMes ? theme.palette.success.main : theme.palette.warning.main, 0.12),
                color: puedeFacturarMes ? theme.palette.success.main : theme.palette.warning.main,
              }}
            />
          </Stack>

          {!puedeFacturarMes ? (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.4 }}>
              {factWindow.reason} (Ventana: {formatMxDateTime(factWindow.openAt)} → {formatMxDateTime(factWindow.closesAt)})
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.8 }}>
            <Chip
              icon={<DoneAllRoundedIcon />}
              label={`Elegibles: ${elegiblesIds.length}`}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.info.main, 0.12),
                color: theme.palette.info.main,
              }}
            />
            <Chip
              icon={<ReceiptLongRoundedIcon />}
              label={`Seleccionadas: ${seleccionElegible.length}`}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            />
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Mes"
            value={month0}
            onChange={(e) => setMonth0(Number(e.target.value))}
            sx={{ minWidth: 170 }}
            {...blockAutoComplete}
          >
            {monthsMx.map((m, idx) => (
              <MenuItem key={m} value={idx}>
                {titleCase(m)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Año"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: 120 }}
            {...blockAutoComplete}
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Uso CFDI"
            value={usoCfdi}
            onChange={(e) => setUsoCfdi(e.target.value)}
            sx={{ width: 120 }}
            {...blockAutoComplete}
          >
            <MenuItem value="S01">S01</MenuItem>
            <MenuItem value="G03">G03</MenuItem>
          </TextField>

          <Tooltip title="Exportar a Excel">
            <span>
              <IconButton disabled={loading || facturando} onClick={exportarExcel}>
                <FileDownloadIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Restablecer a mes actual">
            <span>
              <IconButton disabled={loading || facturando} onClick={limpiar}>
                <RestartAltIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="contained"
            color="success"
            onClick={timbrarPG}
            disabled={facturando || loading || seleccionElegible.length === 0 || !puedeFacturarMes}
            startIcon={facturando ? <CircularProgress size={16} color="inherit" /> : <ReceiptLongRoundedIcon />}
            sx={{
              borderRadius: 3,
              fontWeight: 950,
              px: 2,
              background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
              boxShadow: `0 16px 46px ${alpha(theme.palette.success.main, 0.20)}`,
            }}
          >
            {facturando ? "Facturando…" : "Facturar PG"}
          </Button>

          <Button
            variant="contained"
            onClick={timbrarPorTienda}
            disabled={facturando || loading || seleccionElegible.length === 0 || !puedeFacturarMes}
            startIcon={facturando ? <CircularProgress size={16} color="inherit" /> : <LocalMallRoundedIcon />}
            sx={{
              borderRadius: 3,
              fontWeight: 950,
              px: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 16px 46px ${alpha(theme.palette.primary.main, 0.22)}`,
            }}
          >
            {facturando ? "Facturando…" : "Facturar Tienda"}
          </Button>
        </Stack>
      </Stack>
    </MotionPaper>
  );

  const DesktopTable = (
    <Paper
      sx={{
        mt: 2,
        borderRadius: 4,
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
        boxShadow: `0 18px 60px ${alpha("#000", 0.08)}`,
      }}
    >
      <Box sx={{ maxHeight: "62vh", overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 950,
                  color: "#fff",
                  bgcolor: theme.palette.primary.main,
                },
              }}
            >
              <TableCell sx={{ width: 54, bgcolor: theme.palette.primary.main, color: "#fff" }}>
                <Checkbox
                  color="secondary"
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={(e) => seleccionarTodo(e.target.checked)}
                  disabled={facturando || loading || elegiblesIds.length === 0 || !puedeFacturarMes}
                />
              </TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Tienda</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Tipo</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Fecha</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Monto</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Estado</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Archivos</TableCell>
              <TableCell sx={{ bgcolor: theme.palette.primary.main, color: "#fff" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton height={42} />
                  </TableCell>
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 4 }}>
                  <Typography textAlign="center" color="text.secondary">
                    Sin registros en este mes.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((v) => {
                const checked = seleccionElegible.includes(v.id);
                const nombreTienda = `${v.user?.name || ""} ${v.user?.apellidos || ""}`.trim() || "Sin nombre";

                const fecha = new Date(v.created_at);
                const fechaLabel = `${fecha.getDate()} de ${monthsMx[fecha.getMonth()]} de ${fecha.getFullYear()}`;

                const st = statusChipProps(v.status);

                return (
                  <TableRow
                    key={v.id}
                    hover
                    selected={checked}
                    sx={{
                      opacity: v._elig?.ok ? 1 : 0.65,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                  >
                    <TableCell>
                      <Tooltip title={v._elig?.ok ? "Seleccionar" : v._elig?.reason || "No elegible"}>
                        <span>
                          <Checkbox
                            color="secondary"
                            checked={checked}
                            onChange={() => toggleSeleccion(v)}
                            disabled={facturando || loading || !v._elig?.ok || !puedeFacturarMes}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 800 }}>
                      {nombreTienda}
                      {!v._elig?.ok ? (
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                          {v._elig?.reason}
                        </Typography>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      <Chip size="small" label={v.tipo || "—"} sx={{ fontWeight: 800 }} />
                    </TableCell>

                    <TableCell>{fechaLabel}</TableCell>

                    <TableCell sx={{ fontWeight: 900 }}>{money(v.monto)}</TableCell>

                    <TableCell>
                      <Chip size="small" color={st.color} label={st.label} sx={{ fontWeight: 900 }} />
                    </TableCell>

                    <TableCell>
                      {v.pdf_url && (
                        <Tooltip title="PDF">
                          <IconButton component="a" href={v.pdf_url} target="_blank" rel="noopener noreferrer" size="small">
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {v.xml_url && (
                        <Tooltip title="XML">
                          <IconButton component="a" href={v.xml_url} target="_blank" rel="noopener noreferrer" size="small">
                            <InsertDriveFileIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => abrirComprobante(v.comprobante)}
                        sx={{ borderRadius: 2.5, fontWeight: 900 }}
                      >
                        Comprobante
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>

      <Stack direction="row" justifyContent="center" sx={{ py: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.55)}` }}>
        <Pagination page={page} count={pageCount} onChange={(_, p) => setPage(p)} size="medium" color="primary" disabled={loading} />
      </Stack>
    </Paper>
  );

  const MobileCards = (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1.3}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Paper key={i} sx={{ p: 2, borderRadius: 4 }}>
              <Skeleton height={26} />
              <Skeleton height={18} />
              <Skeleton height={46} />
            </Paper>
          ))
        ) : pageRows.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography textAlign="center" color="text.secondary">
              Sin registros en este mes.
            </Typography>
          </Paper>
        ) : (
          pageRows.map((v) => {
            const checked = seleccionElegible.includes(v.id);
            const nombreTienda = `${v.user?.name || ""} ${v.user?.apellidos || ""}`.trim() || "Sin nombre";

            const fecha = new Date(v.created_at);
            const fechaLabel = `${fecha.getDate()} de ${monthsMx[fecha.getMonth()]} de ${fecha.getFullYear()}`;
            const st = statusChipProps(v.status);

            return (
              <MotionPaper
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
                  background: alpha(theme.palette.background.paper, 0.75),
                  backdropFilter: "blur(10px)",
                  boxShadow: `0 14px 44px ${alpha("#000", 0.08)}`,
                  opacity: v._elig?.ok ? 1 : 0.65,
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>
                      {nombreTienda}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fechaLabel}
                    </Typography>
                  </Box>

                  <Tooltip title={v._elig?.ok ? "Seleccionar" : v._elig?.reason || "No elegible"}>
                    <span>
                      <Checkbox checked={checked} onChange={() => toggleSeleccion(v)} disabled={facturando || loading || !v._elig?.ok || !puedeFacturarMes} />
                    </span>
                  </Tooltip>
                </Stack>

                {!v._elig?.ok ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <WarningAmberRoundedIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {v._elig?.reason}
                    </Typography>
                  </Stack>
                ) : null}

                <Divider sx={{ my: 1.2 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip size="small" label={v.tipo || "—"} sx={{ fontWeight: 900 }} />
                  <Typography sx={{ fontWeight: 950 }}>{money(v.monto)}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                  <Chip size="small" color={st.color} label={st.label} sx={{ fontWeight: 900 }} />
                  <Stack direction="row" spacing={0.6}>
                    {v.pdf_url && (
                      <IconButton component="a" href={v.pdf_url} target="_blank" rel="noopener noreferrer" size="small">
                        <PictureAsPdfIcon fontSize="small" />
                      </IconButton>
                    )}
                    {v.xml_url && (
                      <IconButton component="a" href={v.xml_url} target="_blank" rel="noopener noreferrer" size="small">
                        <InsertDriveFileIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => abrirComprobante(v.comprobante)}
                      startIcon={<VisibilityIcon />}
                      sx={{ borderRadius: 2.5, fontWeight: 900 }}
                    >
                      Ver
                    </Button>
                  </Stack>
                </Stack>
              </MotionPaper>
            );
          })
        )}
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
        <Pagination page={page} count={pageCount} onChange={(_, p) => setPage(p)} size="medium" color="primary" disabled={loading} />
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ mt: 2 }}>
      {Header}
      {isMobile ? MobileCards : DesktopTable}

      {/* Modal Comprobante */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        keepMounted
        disableRestoreFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
        >
          <Typography sx={{ fontWeight: 950 }}>Comprobante</Typography>
          <IconButton onClick={() => setModalOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {!comprobanteUrl ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">No hay comprobante.</Typography>
            </Box>
          ) : comprobanteUrl.toLowerCase().endsWith(".pdf") ? (
            <Box component="iframe" src={comprobanteUrl} width="100%" height={isMobile ? "100%" : 700} style={{ border: "none" }} title="Comprobante PDF" />
          ) : (
            <Box sx={{ width: "100%", height: isMobile ? "calc(100vh - 120px)" : 720 }}>
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={6}
                centerOnInit
                limitToBounds
                wheel={{ step: 0.18 }}
                pinch={{ step: 5 }}
                doubleClick={{ mode: "zoomIn", step: 0.8 }}
                onTransformed={({ state }) => {
                  const s = state?.scale ?? 1;
                  setComprobanteScalePct(Math.round(s * 100));
                }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <Box sx={{ width: "100%", height: "100%" }}>
                    <Box sx={{ height: "calc(100% - 52px)" }}>
                      <TransformComponent
                        wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }}
                        contentStyle={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: alpha("#000", 0.03),
                        }}
                      >
                        <img
                          src={comprobanteUrl}
                          alt="Comprobante"
                          draggable={false}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            userSelect: "none",
                            pointerEvents: "none",
                          }}
                        />
                      </TransformComponent>
                    </Box>

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        height: 52,
                        px: 1,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        background: alpha(theme.palette.background.paper, 0.72),
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ZoomOutMapRoundedIcon fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          {comprobanteScalePct}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          (arrastra para moverte)
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title="Alejar">
                          <IconButton size="small" onClick={zoomOut}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reset">
                          <IconButton
                            size="small"
                            onClick={() => {
                              resetTransform();
                              setComprobanteScalePct(100);
                            }}
                          >
                            <RestartAltIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Acercar">
                          <IconButton size="small" onClick={zoomIn}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </TransformWrapper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            position: isMobile ? "fixed" : "static",
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(10px)",
          }}
        >
          <Button onClick={() => setModalOpen(false)} sx={{ fontWeight: 900 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}