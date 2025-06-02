import React, { useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Button, IconButton, TablePagination, Modal,
  TextField, MenuItem, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisorComprobanteModal from "./VisorComprobanteModal";
import ModalTimbrado from "./ModalTimbrado";

const ITEMS_PER_PAGE = 10;

const estados = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazada", label: "Rechazada" },
];

const RecargaHistory = ({ historyFiltrada }) => {
  const [pagina, setPagina] = useState(0);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: "",
    monto: "",
  });
  const [infoOpen, setInfoOpen] = useState(false);

  // Timbrado modal
  const [timbradoModalOpen, setTimbradoModalOpen] = useState(false);
  const [compraATimbrar, setCompraATimbrar] = useState(null);
  const [timbrando, setTimbrando] = useState(false);
  const [timbradoOk, setTimbradoOk] = useState(false);
  const [timbradoError, setTimbradoError] = useState("");

  // Filtro solo por estado y monto
  const filtrarCompras = () => {
    return historyFiltrada.filter((c) => {
      const pasaEstado = !filtros.estado || c.status === filtros.estado;
      const pasaMonto = !filtros.monto || parseFloat(c.monto) === parseFloat(filtros.monto);
      return pasaEstado && pasaMonto;
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

  const handleCerrarModal = () => {
    setModalOpen(false);
    setTimeout(() => setComprobanteSeleccionado(null), 200);
  };

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
    setPagina(0);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: "",
      monto: "",
    });
    setPagina(0);
  };

  // ---- Lógica timbrado ----
  const handleEmitirFactura = (recarga) => {
    setCompraATimbrar(recarga);
    setTimbrando(false);
    setTimbradoOk(false);
    setTimbradoError("");
    setTimbradoModalOpen(true);
  };

  const handleTimbrar = async (compra) => {
    setTimbrando(true);
    setTimbradoError("");
    try {
      // Aquí va tu llamada real al timbrado:
      // await apiTimbrar(compra);
      await new Promise((res) => setTimeout(res, 1600)); // Simulación
      setTimbradoOk(true);
    } catch (e) {
      setTimbradoError("Error al facturar. Intenta de nuevo.");
    }
    setTimbrando(false);
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
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Fecha</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Monto</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Referencia</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Descripción</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Estado</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Comprobante</TableCell>
                <TableCell sx={{ backgroundColor: "#6C63FF", color: "#fff" }}>Factura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length ? paginatedData.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
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
                            : r.status === "aprobado"
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
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReceiptLongIcon />}
                      onClick={() => handleEmitirFactura(r)}
                      disabled={r.status !== "confirmado"}
                      sx={{ minWidth: 0 }}
                    >
                      Emitir
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
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
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
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
          <Box sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#fff",
            borderRadius: 2,
            mb: 2,
            overflow: "auto"
          }}>
            <VisorComprobanteModal comprobante={comprobanteSeleccionado?.comprobante_url} />
          </Box>
        </Box>
      </Modal>

      {/* Modal para timbrado */}
      <ModalTimbrado
        open={timbradoModalOpen}
        onClose={() => setTimbradoModalOpen(false)}
        compra={compraATimbrar}
        onTimbrar={handleTimbrar}
        timbrando={timbrando}
        timbradoOk={timbradoOk}
        error={timbradoError}
      />

      {/* Dialog de información para facturación */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
        <DialogTitle>
          <InfoOutlinedIcon color="info" /> &nbsp;
          Información para facturación
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Para facturar una compra, debes tener registrados tu <strong>RFC</strong> y <strong>Razón Social</strong>.
          </Typography>
          <Typography gutterBottom>
            Si aún no tienes estos datos, puedes hacerlo desde la sección <strong>“Mi cuenta”</strong> en el apartado <strong>“Datos fiscales”</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} autoFocus>Entendido</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecargaHistory;
