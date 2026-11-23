import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import {
  CloseRounded,
  DownloadRounded,
  OpenInNewRounded,
  PictureAsPdfRounded,
} from "@mui/icons-material";
import axiosClient from "../../config/axiosClient";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  softBg: "#F6F7FB",
};

const pick = (...values) =>
  values.find((v) => v !== undefined && v !== null && v !== "");

const getInvoiceId = (entry) =>
  pick(entry?.restock_invoice_id, entry?.invoice_id, entry?.restock_invoice?.id);

export default function RestockPdfViewerModal({ open, onClose, entry }) {
  const invoiceId = getInvoiceId(entry);
  const [blobUrl, setBlobUrl] = useState("");

  const pdfEndpoint = useMemo(() => {
    if (!invoiceId) return "";
    return `/restocks/invoices/${invoiceId}/pdf`;
  }, [invoiceId]);

  useEffect(() => {
    let currentUrl = "";

    const loadPdf = async () => {
      if (!open || !pdfEndpoint) return;

      try {
        const { data } = await axiosClient.get(pdfEndpoint, {
          responseType: "blob",
        });

        currentUrl = URL.createObjectURL(
          new Blob([data], { type: "application/pdf" }),
        );

        setBlobUrl(currentUrl);
      } catch (error) {
        console.error("Error cargando PDF:", error);
        setBlobUrl("");
      }
    };

    loadPdf();

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [open, pdfEndpoint]);

  const handleDownload = async () => {
    if (!invoiceId) return;

    const { data } = await axiosClient.get(
      `/restocks/invoices/${invoiceId}/pdf/download`,
      { responseType: "blob" },
    );

    const url = URL.createObjectURL(
      new Blob([data], { type: "application/pdf" }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `entrada-reabastecimiento-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              display: "grid",
              placeItems: "center",
            }}
          >
            <PictureAsPdfRounded />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
              PDF de entrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista previa del documento generado por Laravel.
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: COLORS.softBg, p: 0 }}>
        {blobUrl ? (
          <Box
            component="iframe"
            src={blobUrl}
            title="PDF entrada de reabastecimiento"
            sx={{
              width: "100%",
              height: { xs: "72vh", md: "78vh" },
              border: 0,
              bgcolor: "#fff",
            }}
          />
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 900 }}>
              {invoiceId ? "Cargando PDF..." : "No se encontró el ID de la entrada."}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={handleOpenNewTab}
          disabled={!blobUrl}
          variant="outlined"
          startIcon={<OpenInNewRounded />}
          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
        >
          Abrir
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handleDownload}
          disabled={!invoiceId}
          variant="contained"
          startIcon={<DownloadRounded />}
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            textTransform: "none",
            bgcolor: COLORS.black,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
          }}
        >
          Descargar PDF
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}