import React from "react";
import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useNavigate } from "react-router-dom";

const items = [
  { path: "/admin/micuenta", title: "Mi cuenta", description: "Datos personales, fiscales y seguridad", icon: AccountCircleRoundedIcon },
  { path: "/admin/membresia", title: "Suscripciones", description: "Consulta y administra tu plan", icon: WorkspacePremiumRoundedIcon },
  { path: "/admin/complementos", title: "Complementos", description: "Amplía las funciones de tu tienda", icon: AutoAwesomeRoundedIcon },
];

export default function StoreHubNav() {
  const navigate = useNavigate();
  return <Box component="nav" aria-labelledby="store-settings-title">
    <Stack spacing={0.4} mb={1.75}>
      <Typography id="store-settings-title" variant="h6" sx={{ fontWeight: 900, color: "#202020" }}>Administración</Typography>
      <Typography variant="caption" sx={{ color: "#71717a", lineHeight: 1.45 }}>Opciones generales de tu cuenta y tienda.</Typography>
    </Stack>
    <Stack spacing={1}>{items.map(({ path, title, description, icon: Icon }) => <Card key={path} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid rgba(32,32,32,.09)", bgcolor: "rgba(255,255,255,.94)", overflow: "hidden", transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease", "&:hover": { transform: "translateX(3px)", borderColor: "rgba(249,178,51,.7)", boxShadow: "0 10px 24px rgba(78,42,11,.1)" } }}><CardActionArea onClick={() => navigate(path)} sx={{ p: 1.4 }}><Stack direction="row" alignItems="center" spacing={1.25}><Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: 2.2, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#f9b233,#e94e1b)", boxShadow: "0 7px 15px rgba(233,78,27,.2)" }}><Icon fontSize="small" sx={{ color: "#fff" }} /></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontWeight: 900, color: "#202020", fontSize: ".96rem" }}>{title}</Typography><Typography variant="caption" sx={{ color: "#71717a", display: "block", lineHeight: 1.35 }}>{description}</Typography></Box><ChevronRightRoundedIcon sx={{ color: "#a1a1aa" }} /></Stack></CardActionArea></Card>)}</Stack>
  </Box>;
}
