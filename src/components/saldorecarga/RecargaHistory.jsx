import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  IconButton,
  TablePagination,
  Modal,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import { motion, AnimatePresence } from "framer-motion";

import VisorComprobanteModal from "./VisorComprobanteModal";
import ModalTimbrado from "./ModalTimbrado";
import ModalPDFPreview from "../modals/ModalPDFPreview";
import ModalXMLPreview from "../modals/ModalXMLPreview";

const ITEMS_PER_PAGE = 10;

const estados = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "rechazada", label: "Rechazada" },
  { value: "facturada", label: "Facturada" },
];

const meses = [
  { value: "", label: "Todos" },
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

const anios = (() => {
  const ahora = new Date().getFullYear();
  return [
    { value: "", label: "Todos" },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: ahora - i,
      label: ahora - i,
    })),
  ];
})();

function extraerNombreArchivoDesdeUrl(url, fallback = "archivo.pdf") {
  if (!url) return fallback;
  try {
    const partes = url.split("/");
    const nombre = partes[partes.length - 1];
    return nombre || fallback;
  } catch (e) {
    return fallback;
  }
}

function formatMoneyMXN(n) {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function statusMeta(status) {
  const s = (status || "").toLowerCase();
  if (s === "pendiente")
    return { label: "Pendiente", bg: "rgba(255,193,7,0.16)", bd: "rgba(255,193,7,0.35)", fg: "rgba(120,80,0,0.95)" };
  if (s === "confirmado")
    return { label: "Confirmado", bg: "rgba(46,204,113,0.16)", bd: "rgba(46,204,113,0.35)", fg: "rgba(0,90,40,0.95)" };
  if (s === "rechazada" || s === "rechazado")
    return { label: "Rechazada", bg: "rgba(244,67,54,0.14)", bd: "rgba(244,67,54,0.35)", fg: "rgba(140,0,0,0.95)" };
  if (s === "facturada")
    return { label: "Facturada", bg: "rgba(25,118,210,0.14)", bd: "rgba(25,118,210,0.30)", fg: "rgba(10,60,140,0.95)" };
  return { label: status || "—", bg: "rgba(2,6,23,0.06)", bd: "rgba(15,23,42,0.12)", fg: "rgba(11,18,32,0.85)" };
}

const RecargaHistory = ({ historyFiltrada, fetchHistory }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [pagina, setPagina] = useState(0);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: "",
    monto: "",
    mes: "",
    anio: "",
  });
  const [infoOpen, setInfoOpen] = useState(false);
  const [timbradoModalOpen, setTimbradoModalOpen] = useState(false);
  const [compraATimbrar, setCompraATimbrar] = useState(null);
  const [modalPDF, setModalPDF] = useState({ open: false, url: "", nombre: "" });
  const [modalXML, setModalXML] = useState({ open: false, url: "", nombre: "" });

  const filtrarCompras = () => {
    return historyFiltrada.filter((c) => {
      const pasaEstado = !filtros.estado || c.status === filtros.estado;
      const pasaMonto =
        !filtros.monto || parseFloat(c.monto) === parseFloat(filtros.monto);

      let pasaMes = true;
      let pasaAnio = true;

      if (filtros.mes !== "") {
        const fecha = new Date(c.created_at);
        pasaMes = fecha.getMonth() === Number(filtros.mes);
      }
      if (filtros.anio !== "") {
        const fecha = new Date(c.created_at);
        pasaAnio = fecha.getFullYear() === Number(filtros.anio);
      }

      return pasaEstado && pasaMonto && pasaMes && pasaAnio;
    });
  };

  const comprasFiltradas = useMemo(() => filtrarCompras(), [historyFiltrada, filtros]);
  const paginatedData = useMemo(() => {
    return comprasFiltradas.slice(
      pagina * ITEMS_PER_PAGE,
      pagina * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    );
  }, [comprasFiltradas, pagina]);

  const handleVerComprobante = (recarga) => {
    const url = recarga.comprobante_url;
    if (url && url.toLowerCase().endsWith(".pdf")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setComprobanteSeleccionado(recarga);
    setModalOpen(true);
  };

  const handleEmitirFactura = (recarga) => {
    setCompraATimbrar(recarga);
    setTimbradoModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setTimeout(() => setComprobanteSeleccionado(null), 200);
  };

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
    setPagina(0);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ estado: "", monto: "", mes: "", anio: "" });
    setPagina(0);
  };

  const renderFacturaActions = (r) => {
    const yaFacturada = r.folio_factura && r.timbrado_json;
    const fechaCompra = new Date(r.created_at);
    const now = new Date();

    const esMismoMes =
      now.getMonth() === fechaCompra.getMonth() &&
      now.getFullYear() === fechaCompra.getFullYear();

    const lastDayOfMonth = new Date(fechaCompra.getFullYear(), fechaCompra.getMonth() + 1, 0);
    const isLastDay = now.toDateString() === lastDayOfMonth.toDateString();
    const isBefore11PM = now.getHours() < 23;

    const dentroDeTiempo = esMismoMes && (!isLastDay || (isLastDay && isBefore11PM));
    const sePuedeTimbrar = r.status === "confirmado" && !yaFacturada && dentroDeTiempo;

    if (yaFacturada) {
      return (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 2,
              background: "linear-gradient(90deg, rgba(244,67,54,0.95), rgba(244,67,54,0.80))",
              boxShadow: "0 10px 18px rgba(2,6,23,0.10)",
              "&:hover": { filter: "brightness(1.03)" },
            }}
            onClick={() => {
              setModalPDF({
                open: true,
                url: r.pdf_url,
                nombre: extraerNombreArchivoDesdeUrl(r.pdf_url, "factura.pdf"),
              });
            }}
          >
            PDF
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<DescriptionRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 2,
              background: "linear-gradient(90deg, rgba(46,204,113,0.95), rgba(46,204,113,0.78))",
              boxShadow: "0 10px 18px rgba(2,6,23,0.10)",
              "&:hover": { filter: "brightness(1.03)" },
            }}
            onClick={() =>
              setModalXML({
                open: true,
                url: r.xml_url,
                nombre: extraerNombreArchivoDesdeUrl(r.xml_url, "factura.xml"),
              })
            }
          >
            XML
          </Button>
        </Stack>
      );
    }

    return (
      <Tooltip
        title={
          yaFacturada
            ? "Ya facturada"
            : !dentroDeTiempo
            ? "Fuera del periodo permitido"
            : r.status !== "confirmado"
            ? "Solo disponible para recargas confirmadas"
            : "Emitir factura"
        }
      >
        <span>
          <Button
            variant="contained"
            size="small"
            startIcon={<ReceiptLongIcon />}
            onClick={() => handleEmitirFactura(r)}
            disabled={!sePuedeTimbrar}
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 2,
              minWidth: 0,
              background: "linear-gradient(90deg, #00e5ff, #1976d2)",
              boxShadow: "0 10px 18px rgba(2,6,23,0.10)",
              "&:hover": { filter: "brightness(1.03)", transform: "translateY(-1px)" },
              "&.Mui-disabled": {
                background: "rgba(2,6,23,0.10)",
                color: "rgba(11,18,32,0.55)",
              },
            }}
          >
            Emitir
          </Button>
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ px: { xs: 2, md: 2.5 }, pt: 2.5, pb: 1 }}
        gap={1.5}
      >
        <Box>
          <Typography sx={{ fontWeight: 950, color: "#0b1220", fontSize: { xs: 18, md: 22 } }}>
            📜 Historial de compras de saldo
          </Typography>
          <Typography sx={{ color: "rgba(11,18,32,0.62)", mt: 0.3 }}>
            Filtra por estado, monto o fecha. En móvil se muestra como tarjetas.
          </Typography>
        </Box>

        <Tooltip title="Información para facturar">
          <IconButton
            onClick={() => setInfoOpen(true)}
            color="info"
            size="large"
            sx={{
              alignSelf: { xs: "flex-start", md: "center" },
              borderRadius: 2.2,
              background: "rgba(25,118,210,0.08)",
              border: "1px solid rgba(25,118,210,0.18)",
              "&:hover": { background: "rgba(25,118,210,0.12)" },
            }}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* FILTROS */}
      <Paper
        elevation={0}
        sx={{
          mx: { xs: 2, md: 2.5 },
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: "#fff",
          border: "1px solid rgba(15,23,42,0.10)",
          boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* acento suave */}
        <Box
          sx={{
            position: "absolute",
            inset: -180,
            pointerEvents: "none",
            opacity: 0.75,
            background:
              "radial-gradient(closest-side at 15% 25%, rgba(25,118,210,0.10), transparent 60%)," +
              "radial-gradient(closest-side at 85% 35%, rgba(156,39,176,0.08), transparent 60%)",
            filter: "blur(2px)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.4}>
            <FilterAltRoundedIcon sx={{ color: "rgba(11,18,32,0.70)" }} />
            <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>
              Filtros
            </Typography>

            <Chip
              label={`${comprasFiltradas.length} resultado(s)`}
              sx={{
                ml: "auto",
                fontWeight: 900,
                background: "rgba(2,6,23,0.06)",
                border: "1px solid rgba(15,23,42,0.10)",
              }}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Estado"
              name="estado"
              value={filtros.estado}
              onChange={handleFiltro}
              fullWidth
              size="small"
              sx={fieldSx}
            >
              {estados.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Monto"
              name="monto"
              type="number"
              value={filtros.monto}
              onChange={handleFiltro}
              fullWidth
              size="small"
              sx={fieldSx}
              InputProps={{
                startAdornment: <PaidRoundedIcon sx={{ mr: 1, color: "rgba(11,18,32,0.55)" }} />,
              }}
            />

            <TextField
              select
              label="Mes"
              name="mes"
              value={filtros.mes}
              onChange={handleFiltro}
              fullWidth
              size="small"
              sx={fieldSx}
              InputProps={{
                startAdornment: <CalendarMonthRoundedIcon sx={{ mr: 1, color: "rgba(11,18,32,0.55)" }} />,
              }}
            >
              {meses.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Año"
              name="anio"
              value={filtros.anio}
              onChange={handleFiltro}
              fullWidth
              size="small"
              sx={fieldSx}
            >
              {anios.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={handleLimpiarFiltros}
              startIcon={<RestartAltRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 950,
                borderRadius: 2.2,
                borderColor: "rgba(15,23,42,0.18)",
                color: "#0b1220",
                background: "rgba(2,6,23,0.02)",
                "&:hover": { background: "rgba(2,6,23,0.05)" },
                alignSelf: { xs: "stretch", md: "center" },
                height: { xs: 42, md: 40 },
                whiteSpace: "nowrap",
              }}
            >
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* CONTENIDO: MOBILE CARDS / DESKTOP TABLE */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: "#fff",
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
          }}
        >
          {isMobile ? (
            <Box sx={{ p: 2 }}>
              <AnimatePresence>
                {paginatedData.length ? (
                  <Stack spacing={1.6}>
                    {paginatedData.map((r) => {
                      const meta = statusMeta(r.status);
                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Box
                            sx={{
                              borderRadius: 3,
                              border: "1px solid rgba(15,23,42,0.10)",
                              background:
                                "linear-gradient(180deg, rgba(25,118,210,0.05), rgba(156,39,176,0.03))",
                              p: 2,
                              boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                              <Box>
                                <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>
                                  {formatMoneyMXN(r.monto)}
                                </Typography>
                                <Typography sx={{ color: "rgba(11,18,32,0.62)", fontSize: 13, mt: 0.3 }}>
                                  {new Date(r.created_at).toLocaleString()}
                                </Typography>
                              </Box>

                              <Chip
                                label={meta.label}
                                sx={{
                                  fontWeight: 950,
                                  borderRadius: 2,
                                  background: meta.bg,
                                  border: `1px solid ${meta.bd}`,
                                  color: meta.fg,
                                }}
                              />
                            </Stack>

                            <Divider sx={{ my: 1.3, borderColor: "rgba(15,23,42,0.10)" }} />

                            <Stack spacing={0.7}>
                              <Typography sx={{ color: "rgba(11,18,32,0.84)" }}>
                                <b>Referencia:</b> {r.referencia || "—"}
                              </Typography>
                              <Typography sx={{ color: "rgba(11,18,32,0.76)" }}>
                                <b>Descripción:</b> {r.descripcion || "—"}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} mt={1.6} flexWrap="wrap">
                              {r.comprobante_url ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleVerComprobante(r)}
                                  startIcon={<OpenInFullIcon />}
                                  sx={actionOutlineSx}
                                >
                                  Comprobante
                                </Button>
                              ) : (
                                <Chip
                                  label="Sin comprobante"
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    background: "rgba(2,6,23,0.06)",
                                    border: "1px solid rgba(15,23,42,0.10)",
                                  }}
                                />
                              )}

                              <Box sx={{ flex: 1, minWidth: 140 }}>
                                {renderFacturaActions(r)}
                              </Box>
                            </Stack>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ color: "rgba(11,18,32,0.70)", fontWeight: 800 }}>
                      No hay compras 😔
                    </Typography>
                  </Box>
                )}
              </AnimatePresence>
            </Box>
          ) : (
            <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={thSx}>Fecha</TableCell>
                    <TableCell sx={thSx}>Monto</TableCell>
                    <TableCell sx={thSx}>Referencia</TableCell>
                    <TableCell sx={thSx}>Descripción</TableCell>
                    <TableCell sx={thSx}>Estado</TableCell>
                    <TableCell sx={thSx}>Comprobante</TableCell>
                    <TableCell sx={thSx}>Factura</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length ? (
                    paginatedData.map((r) => {
                      const meta = statusMeta(r.status);
                      return (
                        <TableRow
                          key={r.id}
                          hover
                          sx={{
                            "&:hover td": {
                              background: "rgba(25,118,210,0.03)",
                            },
                            transition: "background .2s ease",
                          }}
                        >
                          <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                          <TableCell>{formatMoneyMXN(r.monto)}</TableCell>
                          <TableCell>{r.referencia}</TableCell>
                          <TableCell>{r.descripcion}</TableCell>
                          <TableCell>
                            <Chip
                              label={meta.label}
                              size="small"
                              sx={{
                                fontWeight: 950,
                                borderRadius: 2,
                                background: meta.bg,
                                border: `1px solid ${meta.bd}`,
                                color: meta.fg,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {r.comprobante_url ? (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleVerComprobante(r)}
                                startIcon={<OpenInFullIcon />}
                                sx={actionOutlineSx}
                              >
                                Ver
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{renderFacturaActions(r)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay compras 😔
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          <TablePagination
            component="div"
            count={comprasFiltradas.length}
            page={pagina}
            onPageChange={(e, newPage) => setPagina(newPage)}
            rowsPerPage={ITEMS_PER_PAGE}
            rowsPerPageOptions={[ITEMS_PER_PAGE]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      </Box>

      {/* Modal comprobante (solo imágenes, PDFs abren en nueva pestaña) */}
      <Modal open={modalOpen} onClose={handleCerrarModal}>
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#111827",
            p: 2,
            borderRadius: 3,
            outline: "none",
            boxShadow: 24,
            minWidth: { xs: 290, md: 440 },
            minHeight: { xs: 220, md: 350 },
            maxWidth: "92vw",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            zIndex: 1300,
          }}
        >
          <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={handleCerrarModal} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="h6" color="#fff" mb={1}>
            📎 Comprobante
          </Typography>

          <Box
            sx={{
              width: "100%",
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "#fff",
              borderRadius: 2,
              overflow: "auto",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <VisorComprobanteModal comprobante={comprobanteSeleccionado?.comprobante_url} />
          </Box>
        </Box>
      </Modal>

      {/* Modal timbrado */}
      <ModalTimbrado
        open={timbradoModalOpen}
        onClose={() => setTimbradoModalOpen(false)}
        compra={compraATimbrar}
        onFacturada={() => {
          setTimbradoModalOpen(false);
          fetchHistory();
        }}
      />

      {/* PDF / XML Preview */}
      <ModalPDFPreview
        open={modalPDF.open}
        pdfUrl={modalPDF.url}
        onClose={() => setModalPDF({ open: false, url: "", nombre: "" })}
        nombreArchivo={modalPDF.nombre || "factura.pdf"}
      />

      <ModalXMLPreview
        open={modalXML.open}
        xmlUrl={modalXML.url}
        onClose={() => setModalXML({ open: false, url: "", nombre: "" })}
        nombreArchivo={modalXML.nombre || "factura.xml"}
      />

      {/* Info facturación */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>
          <InfoOutlinedIcon color="info" /> &nbsp; Información para facturación
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Para poder facturar una compra debes cumplir con lo siguiente:
          </Typography>
          <ul style={{ paddingLeft: "1.25rem", marginTop: 8 }}>
            <li>
              Tener registrado un <strong>RFC</strong> y <strong>Régimen Fiscal</strong> en tu perfil.
            </li>
            <li>
              La compra debe tener el estado <strong>“confirmado”</strong>.
            </li>
            <li>
              Tu correo electrónico de TeloRecargo debe estar activo ya que por ese medio recibirás la factura.
            </li>
            <li>
              Puedes actualizar tu correo en: <strong>“Mi cuenta”</strong> &gt; <strong>“Información personal”</strong>.
            </li>
            <li>
              Sólo puedes facturar hasta antes de las <strong>11:00 PM del último día</strong> del mes en que se realizó la compra.
            </li>
          </ul>
          <Typography mt={2}>
            Si aún no tienes tus datos fiscales, puedes agregarlos en:{" "}
            <strong>“Mi cuenta”</strong> &gt; <strong>“Datos fiscales”</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} autoFocus sx={{ textTransform: "none", fontWeight: 900 }}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const BLUE_SOFT = "linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)";

const thSx = {
  background: BLUE_SOFT,
  color: "#fff",
  fontWeight: 900,
  letterSpacing: "0.3px",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
};
const fieldSx = {
  "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    background: "rgba(2,6,23,0.02)",
    "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(25,118,210,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(25,118,210,0.60)" },
  },
};

const actionOutlineSx = {
  textTransform: "none",
  fontWeight: 950,
  borderRadius: 2,
  borderColor: "rgba(15,23,42,0.18)",
  color: "#0b1220",
  background: "rgba(2,6,23,0.02)",
  "&:hover": { background: "rgba(2,6,23,0.05)" },
};

export default RecargaHistory;