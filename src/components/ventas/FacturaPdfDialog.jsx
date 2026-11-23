// src/components/ventas/FacturaPdfDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";

export default function FacturaPdfDialog({
  open,
  onClose,
  pdfUrl,
  folio,
  fileName,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();

      const a = document.createElement("a");
      const url = window.URL.createObjectURL(blob);

      a.href = url;
      a.download = fileName || `factura_${folio || "documento"}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PictureAsPdfRoundedIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            PDF de factura {folio ? `#${folio}` : ""}
          </Typography>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {pdfUrl ? (
          <Box sx={{ width: "100%", height: { xs: "70vh", md: "78vh" } }}>
            <iframe
              src={pdfUrl}
              title="Vista previa PDF factura"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              No hay PDF disponible para esta factura.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: 1,
        }}
      >
        <Button onClick={onClose} variant="outlined" fullWidth={fullScreen}>
          Cerrar
        </Button>

        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={<DownloadRoundedIcon />}
          disabled={!pdfUrl}
          fullWidth={fullScreen}
        >
          Descargar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}