import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const ModalPDF = ({ open, onClose, pdfUrl, fileName = "factura.pdf" }) => {
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
        <Typography variant="h6" mb={2}>
          📄 Vista previa de la factura PDF
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            border: "1px solid #ccc",
            borderRadius: 1,
          }}
        >
          <iframe
            src={pdfUrl}
            title="Vista previa PDF"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </Box>

        <Box
          mt={2}
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          justifyContent="space-between"
          gap={2}
        >
          <Button variant="outlined" onClick={onClose} fullWidth={isMobile}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDownload}
            fullWidth={isMobile}
          >
            Descargar PDF
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalPDF;
