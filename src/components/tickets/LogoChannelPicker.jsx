import React, { useEffect, useState } from "react";
import { Box, ButtonBase, Chip, CircularProgress, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { DOCUMENT_CHANNELS, documentSettingsService, logoUrl, readConfig } from "../../services/admin/salesDocumentSettings";

export default function LogoChannelPicker({ selection, config, logo, pending, disabled, onSelect }) {
  const [other, setOther] = useState(null);
  const otherChannel = selection.channel === "pdf" ? "payload" : "pdf";
  const otherKey = JSON.stringify([selection.type, otherChannel, selection.branchId]);
  const channels = selection.type === "ticket" ? DOCUMENT_CHANNELS : DOCUMENT_CHANNELS.filter(item => item.value === "pdf");
  useEffect(() => {
    if (selection.type !== "ticket") return;
    let active = true;
    setOther({ key: otherKey });
    documentSettingsService.get({ ...selection, channel: otherChannel }).then(({ data }) => {
      if (active) setOther({ key: otherKey, config: readConfig(data, selection.type) });
    }).catch(() => { if (active) setOther({ key: otherKey, error: true }); });
    return () => { active = false; };
  }, [selection, otherChannel, otherKey]);

  return <Box role="group" aria-label="Salida y estado del logo" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: `repeat(${channels.length},minmax(0,1fr))` }, gap: 1.25, my: 2 }}>
    {channels.map(item => {
      const selected = selection.channel === item.value;
      const state = selected ? { config, logo } : other?.key === otherKey ? other : {};
      const url = selected ? logo : state.config ? logoUrl(state.config) : "";
      const status = state.error ? "Sin consultar" : !state.config ? "Consultando…" : !url ? "Sin logo" : !state.config.show_logo ? "Oculto" : "Con logo";
      const label = item.value === "pdf" ? "Logo PDF / WhatsApp" : "Logo de impresión";
      return <ButtonBase key={item.value} type="button" disabled={disabled} aria-pressed={selected} onClick={() => !selected && onSelect(item.value)} sx={{ display: "flex", gap: 1.25, justifyContent: "flex-start", textAlign: "left", p: 1.5, minWidth: 0, border: "1px solid", borderColor: selected ? "#ffc107" : "divider", borderRadius: 2.5, boxShadow: selected ? "inset 0 0 0 1px #ffc107" : "none", "&.Mui-focusVisible": { outline: "3px solid #ffc107", outlineOffset: 2 } }}>
        <Box sx={{ width: 48, height: 48, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: "#fff", border: "1px solid #dedede", borderRadius: 1.5, overflow: "hidden" }}>
          {url ? <Box component="img" src={url} alt={`Imagen de ${label}`} sx={{ width: "100%", height: "100%", p: .5, objectFit: "contain", opacity: status === "Oculto" ? .4 : 1 }} /> : !state.config && !state.error ? <CircularProgress size={18} aria-label={`Consultando ${label}`} /> : <ImageOutlinedIcon sx={{ color: "#8b8f96" }} />}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, overflowWrap: "anywhere" }}>{label}</Typography>
          <Chip size="small" label={status} variant="outlined" sx={{ mt: .5, height: 23, fontSize: 11, maxWidth: "100%", color: status === "Con logo" ? "success.main" : "text.secondary" }} />
          {selected && pending && <Typography variant="caption" sx={{ display: "block", mt: .5, color: "text.secondary" }}>Cambio sin guardar</Typography>}
          {state.error && <Typography variant="caption" sx={{ display: "block", mt: .5 }}>Abre esta salida para reintentar.</Typography>}
        </Box>
      </ButtonBase>;
    })}
  </Box>;
}
