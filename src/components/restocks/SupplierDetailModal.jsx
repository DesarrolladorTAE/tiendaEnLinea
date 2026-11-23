import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axiosClient from "../../config/axiosClient";
import { supplierToForm } from "./supplierForm.mjs";

export default function SupplierDetailModal({ supplierId, branchId, sections, onClose, onEdit }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSupplier(null);
    setError("");
    const load = async () => {
      try {
        const { data } = await axiosClient.get(`/suppliers/${encodeURIComponent(supplierId)}`, {
          params: { branch_id: branchId }, signal: controller.signal,
        });
        const record = data?.supplier ?? data?.data?.supplier ?? data?.data ?? data;
        if (!record || typeof record !== "object" || Array.isArray(record) || String(record.id) !== String(supplierId)) {
          throw new Error("La respuesta no contiene los datos del proveedor solicitado.");
        }
        if (!controller.signal.aborted) setSupplier(record);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || "No se pudo consultar el proveedor.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [supplierId, branchId, attempt]);

  const normalized = supplier ? supplierToForm(supplier) : null;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}
      aria-labelledby="supplier-detail-title"
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, maxHeight: fullScreen ? "100dvh" : "90dvh" } }}>
      <DialogTitle id="supplier-detail-title" sx={{ p: { xs: 2, sm: 3 }, flexShrink: 0, background: "linear-gradient(120deg, #ede9fe, #ccfbf1)" }}>
        <Typography component="span" sx={{ fontWeight: 800, fontSize: 22 }}>Datos del proveedor</Typography>
        <Typography variant="body2">{supplier?.name || `Proveedor #${supplierId}`}</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, minHeight: 0, overflowX: "hidden" }}>
        {loading && <Stack role="status" alignItems="center" spacing={2} sx={{ py: 4 }}><CircularProgress sx={{ color: "#6d28d9" }} /><Typography>Cargando datos del proveedor...</Typography></Stack>}
        {error && <Alert severity="error" action={<Button onClick={() => setAttempt((value) => value + 1)} color="inherit">Reintentar</Button>}>{error}</Alert>}
        {supplier && <Stack spacing={2}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={normalized.is_active ? "Activo" : "Inactivo"} color={normalized.is_active ? "success" : "default"} variant="outlined" />
            {normalized.origen_sicar && <Chip label="Importado desde SICAR" color="success" variant="outlined" />}
          </Stack>
          {sections.map(({ title, fields }) => <Paper key={title} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800, color: "#6d28d9", mb: 2 }}>{title}</Typography>
            <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
              {fields.map(([key, label]) => <Box key={key} sx={{ minWidth: 0, gridColumn: key === "notes" || key === "address" ? "1 / -1" : undefined }}>
                <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
                <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                  {supplier[key] === null || supplier[key] === undefined || supplier[key] === "" ? "Sin registrar" : key === "limite_credito" ? `MX$ ${supplier[key]}` : String(supplier[key])}
                </Typography>
              </Box>)}
            </Box>
          </Paper>)}
        </Stack>}
      </DialogContent>
      <DialogActions sx={{ p: 2, flexShrink: 0, flexWrap: "wrap", gap: 1, pb: "max(16px, env(safe-area-inset-bottom))" }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cerrar detalle</Button>
        <Button variant="contained" disabled={!supplier || loading} onClick={() => onEdit(supplier)} sx={{ bgcolor: "#6d28d9", textTransform: "none", borderRadius: 2 }}>Editar proveedor</Button>
      </DialogActions>
    </Dialog>
  );
}
