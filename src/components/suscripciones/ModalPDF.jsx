import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import axios from "axios"; // 👈 axios plano

// Endpoint de tu sistema TAE
const TAE_PDF_URL = "https://taeconta.com/api/public/api/factura/PDFactualizado";

const ModalPDF = ({
  open,
  onClose,
  pdfUrl, // aquí le vas a pasar el ID del CFDI (NO el folio, a menos que coincidan)
  titulo = "📄 Vista previa de la factura PDF",
  fileName = "factura.pdf",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !pdfUrl) return;

    let objectUrl = null;

    (async () => {
      setLoading(true);
      try {
        console.log("[ModalPDF] Cargando PDF desde TAE. ID:", pdfUrl);

        const formData = new FormData();
        formData.append("id", pdfUrl); // 👈 tu controlador espera "id"

        const res = await axios.post(TAE_PDF_URL, formData, {
          responseType: "blob",
        });

        objectUrl = window.URL.createObjectURL(res.data);
        setPreviewUrl(objectUrl);
      } catch (err) {
        console.error("Error cargando PDF desde TAE:", err);
        setPreviewUrl("");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
      setPreviewUrl("");
    };
  }, [open, pdfUrl]);

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      const formData = new FormData();
      formData.append("id", pdfUrl); // 👈 igual aquí

      const res = await axios.post(TAE_PDF_URL, formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF desde TAE:", err);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: isMobile ? "95%" : "70%",
          height: isMobile ? "85%" : "70%",
          mx: "auto",
          my: "5%",
          bgcolor: "background.paper",
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" mb={2} noWrap>
          {titulo}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            border: "1px solid #ccc",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading && <span>Cargando PDF...</span>}

          {!loading && previewUrl && (
            <iframe
              src={previewUrl}
              title="Vista previa PDF"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          )}

          {!loading && !previewUrl && (
            <span style={{ color: "#888", fontSize: 14 }}>
              No se pudo cargar el PDF.
            </span>
          )}
        </Box>

        <Stack
          mt={2}
          direction={isMobile ? "column" : "row"}
          spacing={2}
          justifyContent="space-between"
        >
          <Button variant="outlined" onClick={onClose} fullWidth={isMobile}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDownload}
            fullWidth={isMobile}
            disabled={!pdfUrl || loading}
            startIcon={<FileDownloadIcon />}
          >
            Descargar PDF
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ModalPDF;
