import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import axiosSuperadmin from "../../../config/axiosSuperadmin"; // AJUSTA la ruta si tu proyecto la tiene diferente

export default function ModalPDF({
  open,
  onClose,
  pdfUrl,
  fileName = "factura.pdf",
  titulo = "Vista previa PDF",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState("");

  // Descarga el PDF con Authorization y genera un blob URL para el iframe
  useEffect(() => {
    let alive = true;

    const cleanup = () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl("");
    };

    if (!open || !pdfUrl) {
      cleanup();
      setError("");
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError("");
      cleanup();

      try {
        const res = await axiosSuperadmin.get(pdfUrl, {
          responseType: "blob",
        });

        if (!alive) return;

        const url = URL.createObjectURL(res.data);
        setBlobUrl(url);
      } catch (err) {
        if (!alive) return;
        console.error("Error al cargar PDF:", err);
        setError("No se pudo cargar el PDF. Revisa que la suscripción tenga folio_factura y permisos.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      alive = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pdfUrl]);

  const handleDownload = async () => {
    try {
      setError("");
      setLoading(true);

      // Si ya tenemos blobUrl, descargamos directo sin volver a pedirlo
      if (blobUrl) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // Fallback: volver a pedirlo
      const res = await axiosSuperadmin.get(pdfUrl, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      setError("No se pudo descargar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Abrir en pestaña: con Bearer token NO funciona directo en navegador (no hay headers).
  // Solución: abrir el blobUrl si ya está cargado.
  const openInNew = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // Si no hay blob aún, no abrimos el endpoint porque fallará sin headers.
    setError("Primero carga el PDF para poder abrirlo en pestaña.");
  };

  const handleClose = () => {
    // Limpieza
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl("");
    setError("");
    setLoading(false);
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          width: isMobile ? "96%" : "78%",
          height: isMobile ? "88%" : "82%",
          mx: "auto",
          my: isMobile ? "2%" : "4%",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <PictureAsPdfIcon color="error" fontSize="small" />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {titulo}
          </Typography>

          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={openInNew} disabled={!blobUrl || loading}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDownload} disabled={!pdfUrl || loading}>
              <FileDownloadIcon fontSize="small" />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Mensaje de error / loader */}
        {(loading || error) && (
          <Box sx={{ px: 2, py: 1 }}>
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando PDF…</Typography>
              </Stack>
            )}
            {error && <Alert severity="error" sx={{ mt: loading ? 1 : 0 }}>{error}</Alert>}
          </Box>
        )}

        {/* Lienzo PDF */}
        <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default" }}>
          {blobUrl ? (
            <iframe
              src={blobUrl}
              title="Vista previa PDF"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {loading
                  ? "Cargando…"
                  : "No hay PDF para mostrar (o no tienes permisos / no existe folio_factura)."}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button variant="outlined" onClick={handleClose} fullWidth={isMobile}>
            Cerrar
          </Button>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: "100%" }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={openInNew}
              startIcon={<OpenInNewIcon />}
              fullWidth={isMobile}
              disabled={!blobUrl || loading}
            >
              Abrir en pestaña
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDownload}
              startIcon={<FileDownloadIcon />}
              fullWidth={isMobile}
              disabled={!pdfUrl || loading}
            >
              Descargar PDF
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
