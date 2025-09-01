import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Stack, Typography
} from "@mui/material";
import axiosClient from "../../../config/axiosClient";

const PRESETS = [
  { id: "38x25", label: "38 × 25 mm (rollo chico)", w: 38, h: 25 },
  { id: "50x30", label: "50 × 30 mm", w: 50, h: 30 },
  { id: "60x40", label: "60 × 40 mm", w: 60, h: 40 },
  { id: "70x35", label: "70 × 35 mm", w: 70, h: 35 },
  { id: "100x50", label: "100 × 50 mm (envíos)", w: 100, h: 50 },
  { id: "custom", label: "Personalizada…", w: null, h: null },
];

const LabelModalPDF = ({ open, onClose, product }) => {
  const [presetId, setPresetId] = useState("38x25");
  const [ancho, setAncho] = useState(38);
  const [alto, setAlto] = useState(25);
  const [previewUrl, setPreviewUrl] = useState("");

  const apiBase = useMemo(() => (axiosClient?.defaults?.baseURL || "").replace(/\/+$/, ""), []);
  const labelsPrefix = "/labels";

  const isCustom = presetId === "custom";

  const effectiveW = useMemo(() => {
    if (!isCustom) return PRESETS.find(p => p.id === presetId)?.w ?? ancho;
    return ancho;
  }, [presetId, ancho, isCustom]);

  const effectiveH = useMemo(() => {
    if (!isCustom) return PRESETS.find(p => p.id === presetId)?.h ?? alto;
    return alto;
  }, [presetId, alto, isCustom]);

  useEffect(() => {
    if (!isCustom) {
      const p = PRESETS.find(x => x.id === presetId);
      if (p?.w) setAncho(p.w);
      if (p?.h) setAlto(p.h);
    }
  }, [presetId, isCustom]);

  const buildQS = () => {
    const params = new URLSearchParams({
      product_id: product?.id ?? "",
      label_mm_w: String(Number(effectiveW) || 0),
      label_mm_h: String(Number(effectiveH) || 0),
    });
    return params.toString();
  };

  // 🟢 Toolbar del visor ACTIVADO en el iframe
  useEffect(() => {
    if (!product) return;
    const qs = buildQS();
    setPreviewUrl(`${apiBase}${labelsPrefix}/pdf?preview=1&${qs}#toolbar=1&zoom=page-fit`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, ancho, alto, product, apiBase]);

  const openInNewTab = () => {
    if (!product) return;
    const qs = buildQS();
    window.open(`${apiBase}${labelsPrefix}/pdf?preview=1&${qs}#toolbar=1`, "_blank");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>Imprimir etiqueta (PDF)</Typography>
        <Typography variant="caption" color="text.secondary">{product?.name ?? "Producto"}</Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1.5, pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} mb={1.5}>
          <TextField
            select size="small" label="Tamaño" value={presetId}
            onChange={(e) => setPresetId(e.target.value)} fullWidth
          >
            {PRESETS.map(p => <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>)}
          </TextField>

          <TextField
            size="small" type="number" label="Ancho (mm)" value={ancho}
            onChange={(e) => setAncho(Number(e.target.value))}
            inputProps={{ min: 10, step: 1 }} disabled={!isCustom} sx={{ width: 120 }}
          />
          <TextField
            size="small" type="number" label="Alto (mm)" value={alto}
            onChange={(e) => setAlto(Number(e.target.value))}
            inputProps={{ min: 10, step: 1 }} disabled={!isCustom} sx={{ width: 120 }}
          />
        </Stack>

        {/* Visor PDF con toolbar nativo visible */}
        <Box sx={{
          border: "1px solid", borderColor: "divider", borderRadius: 1.5,
          height: "55vh", overflow: "hidden", bgcolor: "#1e1f20"
        }}>
          {previewUrl ? (
            <iframe
              key={previewUrl}
              src={previewUrl}
              title="Vista previa PDF"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          ) : (
            <Box sx={{ p: 2, height: "100%", display: "grid", placeItems: "center", bgcolor: "#f7f7f8" }}>
              <Typography color="text.secondary" variant="body2">Generando vista previa…</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.25 }}>
        <Button onClick={onClose} size="small" sx={{ textTransform: "none" }}>Cerrar</Button>
        <Button onClick={openInNewTab} size="small" variant="contained" sx={{ textTransform: "none", borderRadius: 1.5 }}>
          Abrir en pestaña
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelModalPDF;
