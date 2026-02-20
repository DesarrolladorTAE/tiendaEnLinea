// src/components/inventory/InventoryReportsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
};

function buildQueryString(filters) {
  const p = new URLSearchParams();

  if (filters?.scope) p.set("scope", filters.scope);
  if (filters?.warehouse_id) p.set("warehouse_id", String(filters.warehouse_id));
  if (filters?.branch_id) p.set("branch_id", String(filters.branch_id));

  if (filters?.q) p.set("q", filters.q);
  if (filters?.type && filters.type !== "all") p.set("type", filters.type);
  if (filters?.only_in_stock) p.set("only_in_stock", filters.only_in_stock ? "1" : "0");

  if (filters?.created_from) p.set("created_from", filters.created_from);
  if (filters?.created_to) p.set("created_to", filters.created_to);

  // OJO: tu front maneja category_id (string). OK.
  if (filters?.category_id) p.set("category_id", String(filters.category_id));

  // incluir hijos (padres->subcategorías)
  if (filters?.include_children !== undefined) {
    p.set("include_children", filters.include_children ? "1" : "0");
  }

  if (filters?.sort) p.set("sort", filters.sort);
  if (filters?.dir) p.set("dir", filters.dir);

  return p.toString();
}

export default function InventoryReportsModal({ open, onClose, title, filters }) {
  const [loadingExcel, setLoadingExcel] = useState(false);

  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [pdfError, setPdfError] = useState("");

  const [pdfKey, setPdfKey] = useState(0);

  const qs = useMemo(() => buildQueryString(filters), [filters]);

  // ✅ Carga PDF protegido usando axios (manda Authorization) => blob => iframe
  const loadPdf = async () => {
    setPdfError("");
    setLoadingPdf(true);

    // limpia blob anterior
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl("");
    }

    try {
      const res = await axiosClient.get(`/inventory/export/pdf`, {
        params: Object.fromEntries(new URLSearchParams(qs)),
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error(err);
      setPdfError("No se pudo cargar el PDF (revisa permisos / sesión).");
      alertFromAxiosError(err, "No se pudo cargar el PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  // cuando abre o refresca
  useEffect(() => {
    if (!open) return;

    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pdfKey, qs]);

  // cleanup al cerrar
  useEffect(() => {
    if (open) return;
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl("");
    setPdfError("");
    setLoadingPdf(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownloadExcel = async () => {
    setLoadingExcel(true);
    try {
      const res = await axiosClient.get(`/inventory/export/excel`, {
        params: Object.fromEntries(new URLSearchParams(qs)),
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventario_${filters?.scope || "global"}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo generar el Excel");
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!pdfBlobUrl) return;
    window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{
          fontWeight: 950,
          bgcolor: alpha(COLORS.black, 0.02),
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack spacing={0.3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PictureAsPdfRoundedIcon />
            <Typography sx={{ fontWeight: 950 }}>
              {title || "Reportes de inventario"}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Vista previa PDF + exportación Excel con los filtros actuales.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refrescar PDF">
            <IconButton
              onClick={() => setPdfKey((k) => k + 1)}
              sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.10)}` }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Abrir en pestaña">
            <span>
              <IconButton
                onClick={handleOpenInNewTab}
                disabled={!pdfBlobUrl}
                sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.10)}` }}
              >
                <OpenInNewRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Cerrar">
            <IconButton
              onClick={onClose}
              sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.10)}` }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "#fff" }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip
              size="small"
              label={`Scope: ${filters?.scope || "global"}`}
              sx={{
                fontWeight: 900,
                bgcolor: alpha(COLORS.accent, 0.22),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              }}
            />
            {filters?.warehouse_id ? (
              <Chip size="small" label={`Warehouse #${filters.warehouse_id}`} variant="outlined" />
            ) : null}
            {filters?.category_id ? (
              <Chip size="small" label={`Categoría #${filters.category_id}`} variant="outlined" />
            ) : null}
            {filters?.created_from || filters?.created_to ? (
              <Chip
                size="small"
                label={`Creación: ${filters?.created_from || "…"} → ${filters?.created_to || "…"}`}
                variant="outlined"
              />
            ) : null}
            {filters?.only_in_stock ? (
              <Chip size="small" label="Solo con stock" variant="outlined" />
            ) : null}
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ height: "72vh", bgcolor: alpha("#000", 0.02) }}>
          {loadingPdf ? (
            <Stack height="100%" alignItems="center" justifyContent="center" spacing={1.2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Cargando PDF…
              </Typography>
            </Stack>
          ) : pdfError ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {pdfError}
              </Alert>
            </Box>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              title="Inventario PDF"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay PDF para mostrar.
              </Alert>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: alpha(COLORS.black, 0.02),
        }}
      >
        <Button
          onClick={handleDownloadExcel}
          disabled={loadingExcel}
          startIcon={loadingExcel ? <CircularProgress size={16} /> : <GridOnRoundedIcon />}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 950,
            bgcolor: COLORS.black,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
          }}
        >
          Descargar Excel
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}