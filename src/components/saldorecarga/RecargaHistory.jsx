import React, { useState } from "react";
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
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

// Arreglo de meses y años para el filtro
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

const RecargaHistory = ({ historyFiltrada, fetchHistory }) => {
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
  const [modalPDF, setModalPDF] = useState({ open: false, url: "" });
  const [modalXML, setModalXML] = useState({ open: false, url: "" });

  // Filtro por estado, monto, mes y año
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

  const comprasFiltradas = filtrarCompras();
  const paginatedData = comprasFiltradas.slice(
    pagina * ITEMS_PER_PAGE,
    pagina * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

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

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2, mt: 2 }}
        gap={2}
      >
        <Typography variant="h5" fontWeight={700}>
          📜 Historial de Compras de Saldo
        </Typography>
        <Tooltip title="Información para facturar">
          <IconButton
            onClick={() => setInfoOpen(true)}
            color="info"
            size="large"
            sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label="Estado"
            name="estado"
            value={filtros.estado}
            onChange={handleFiltro}
            fullWidth
            size="small"
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
          />
          <TextField
            select
            label="Mes"
            name="mes"
            value={filtros.mes}
            onChange={handleFiltro}
            fullWidth
            size="small"
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
          >
            {anios.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                {op.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleLimpiarFiltros}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Monto
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Referencia
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Descripción
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Estado
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Comprobante
                </TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>
                  Factura
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length ? (
                paginatedData.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>${parseFloat(r.monto).toFixed(2)}</TableCell>
                    <TableCell>{r.referencia}</TableCell>
                    <TableCell>{r.descripcion}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            r.status === "pendiente"
                              ? "warning.main"
                              : r.status === "facturada"
                              ? "success.main"
                              : r.status === "confirmado"
                              ? "success.main"
                              : r.status === "rechazado"
                              ? "error.main"
                              : "text.primary",
                        }}
                      >
                        {r.status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {r.comprobante_url ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleVerComprobante(r)}
                          startIcon={<OpenInFullIcon />}
                        >
                          Ver
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const yaFacturada = r.folio_factura && r.timbrado_json;
                        const fechaCompra = new Date(r.created_at);
                        const now = new Date();

                        const esMismoMes =
                          now.getMonth() === fechaCompra.getMonth() &&
                          now.getFullYear() === fechaCompra.getFullYear();

                        const lastDayOfMonth = new Date(
                          fechaCompra.getFullYear(),
                          fechaCompra.getMonth() + 1,
                          0
                        );
                        const isLastDay =
                          now.toDateString() === lastDayOfMonth.toDateString();
                        const isBefore11PM = now.getHours() < 23;
                        const dentroDeTiempo =
                          esMismoMes &&
                          (!isLastDay || (isLastDay && isBefore11PM));

                        const sePuedeTimbrar =
                          r.status === "confirmado" &&
                          !yaFacturada &&
                          dentroDeTiempo;

                        if (yaFacturada) {
                          return (
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                size="small"
                                sx={{ backgroundColor: "error.main" }}
                                onClick={() => {
                                  setModalPDF({
                                    open: true,
                                    url: r.pdf_url,
                                    nombre: extraerNombreArchivoDesdeUrl(
                                      r.pdf_url,
                                      "factura.pdf"
                                    ),
                                  });
                                }}
                              >
                                PDF
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                sx={{ backgroundColor: "success.main" }}
                                onClick={() =>
                                  setModalXML({
                                    open: true,
                                    url: r.xml_url,
                                    nombre: extraerNombreArchivoDesdeUrl(
                                      r.xml_url,
                                      "factura.xml"
                                    ),
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
                                sx={{ minWidth: 0 }}
                              >
                                Emitir
                              </Button>
                            </span>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))
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
        <TablePagination
          component="div"
          count={comprasFiltradas.length}
          page={pagina}
          onPageChange={(e, newPage) => setPagina(newPage)}
          rowsPerPage={ITEMS_PER_PAGE}
          rowsPerPageOptions={[ITEMS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </Paper>

      {/* Modal para ver comprobantes (sólo imágenes, PDFs abren aparte) */}
      <Modal open={modalOpen} onClose={handleCerrarModal}>
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#222",
            p: 2,
            borderRadius: 3,
            outline: "none",
            boxShadow: 24,
            minWidth: { xs: 290, md: 440 },
            minHeight: { xs: 220, md: 350 },
            maxWidth: "90vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              mb: 1,
            }}
          >
            <IconButton onClick={handleCerrarModal} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="h6" color="#fff" mb={2}>
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
              mb: 2,
              overflow: "auto",
            }}
          >
            <VisorComprobanteModal
              comprobante={comprobanteSeleccionado?.comprobante_url}
            />
          </Box>
        </Box>
      </Modal>

      {/* Modal para timbrado */}
      <ModalTimbrado
        open={timbradoModalOpen}
        onClose={() => setTimbradoModalOpen(false)}
        compra={compraATimbrar}
        onFacturada={() => {
          setTimbradoModalOpen(false);
          fetchHistory();
        }}
      />
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

      {/* Dialog de información para facturación */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
        <DialogTitle>
          <InfoOutlinedIcon color="info" /> &nbsp; Información para facturación
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Para poder facturar una compra debes cumplir con lo siguiente:
          </Typography>
          <ul style={{ paddingLeft: "1.25rem", marginTop: 8 }}>
            <li>
              Tener registrado un <strong>RFC</strong> y{" "}
              <strong>Régimen Fiscal</strong> en tu perfil.
            </li>
            <li>
              La compra debe tener el estado <strong>“confirmado”</strong>.
            </li>

            <li>
              Tu correo electrónico de TeloRecargo debe estar activo ya que por
              eso medio recibirás la factura. Puedes actualizar tu correo en la
              sección:
            </li>
            <li>
              <strong>“Mi cuenta”</strong> &gt;{" "}
              <strong>“Información personal”</strong>.
            </li>
            <li>
              Sólo puedes facturar hasta antes de las{" "}
              <strong>11:00 PM del último día</strong> del mes en que se realizó
              la compra.
            </li>
          </ul>
          <Typography mt={2}>
            Si aún no tienes tus datos fiscales, puedes agregarlos en la
            sección:
            <li>
              {" "}
              <strong>“Mi cuenta”</strong> &gt;{" "}
              <strong>“Datos fiscales”</strong>.
            </li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} autoFocus>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecargaHistory;
