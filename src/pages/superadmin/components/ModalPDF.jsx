
import React from "react";
import {
  Modal, Box, Typography, IconButton, Button, Stack,
  useMediaQuery, useTheme, Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export default function ModalPDF({ open, onClose, pdfUrl, fileName = "factura.pdf", titulo = "Vista previa PDF" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDownload = async () => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
    }
  };

  const openInNew = () => window.open(pdfUrl, "_blank", "noopener,noreferrer");

  return (
    <Modal open={open} onClose={onClose}>
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
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {titulo}
          </Typography>

          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={openInNew}><OpenInNewIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={handleDownload}><FileDownloadIcon fontSize="small" /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </Stack>

        {/* Lienzo PDF */}
        <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default" }}>
          <iframe
            src={pdfUrl}
            title="Vista previa PDF"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </Box>

        {/* Footer */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button variant="outlined" onClick={onClose} fullWidth={isMobile}>Cerrar</Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
            <Button variant="contained" color="primary" onClick={openInNew} startIcon={<OpenInNewIcon />} fullWidth={isMobile}>
              Abrir en pestaña
            </Button>
            <Button variant="contained" color="error" onClick={handleDownload} startIcon={<FileDownloadIcon />} fullWidth={isMobile}>
              Descargar PDF
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
