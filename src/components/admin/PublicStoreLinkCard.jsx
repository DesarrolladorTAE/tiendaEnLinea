import React, { useMemo, useState } from "react";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

export default function PublicStoreLinkCard() {
  const [copied, setCopied] = useState(false);
  const storeUrl = useMemo(() => {
    const slug = localStorage.getItem("STORE_SLUG");
    return slug ? `https://mitiendaenlineamx.com.mx/tienda/${slug}` : "";
  }, []);

  if (!storeUrl) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return <Card elevation={0} sx={{ mb: 3, p: { xs: 2, sm: 2.25 }, borderRadius: 3, border: "1px solid rgba(249,178,51,.35)", background: "linear-gradient(120deg,#fffaf0,#fff 58%,#fff4ee)", boxShadow: "0 10px 28px rgba(78,42,11,.07)" }}>
    <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={2}>
      <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 2.4, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#f9b233,#e94e1b)", color: "white" }}><LanguageRoundedIcon /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={900}>Tu sitio público</Typography>
        <Typography variant="body2" color="text.secondary">Abre o comparte el enlace que verán tus clientes.</Typography>
        <Typography variant="body2" sx={{ mt: .6, color: "#9a4c0c", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{storeUrl}</Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
        <Button component="a" href={storeUrl} target="_blank" rel="noopener noreferrer" variant="outlined" startIcon={<OpenInNewRoundedIcon />} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}>Abrir sitio</Button>
        <Button onClick={copyLink} variant="contained" color={copied ? "success" : "primary"} startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}>{copied ? "Enlace copiado" : "Copiar enlace"}</Button>
      </Stack>
    </Stack>
  </Card>;
}
