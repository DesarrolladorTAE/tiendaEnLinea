import React from "react";
import { Box, Chip, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link } from "react-router-dom";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

const items = [
  { section: "Ventas y finanzas", title: "Utilidades por sucursal", description: "Visualiza las utilidades por punto de venta.", icon: AssessmentIcon, color: "#16a34a", route: "/admin/reportes/ventas" },
  { section: "Ventas y finanzas", title: "Ventas", description: "Consulta ventas por fecha, sucursal y forma de pago.", icon: ReceiptLongIcon, color: "#2563eb", route: "/admin/reportes/tipo-venta" },
  { section: "Servicios", title: "Tours", description: "Tours: pasajeros, reservaciones, anticipos y saldos.", icon: DirectionsBusRoundedIcon, color: "#9333ea", route: "/admin/reportes/servicios" },
  { section: "Inventario", title: "Inventario", description: "Consulta tu inventario actualizado 24/7.", icon: Inventory2OutlinedIcon, color: "#ea580c", route: "/admin/reportes/inventario" },
  { section: "Próximamente", title: "Más reportes en camino", description: "Pronto añadiremos más reportes útiles.", icon: HourglassEmptyIcon, color: "#64748b", disabled: true },
];

export default function Reportes() {
  return <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100%", bgcolor: "background.default" }}>
    <Typography variant="h4" fontWeight={700} mb={3}>Reportes</Typography>
    <List aria-label="Reportes disponibles" disablePadding sx={{ bgcolor: "background.paper" }}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return <React.Fragment key={item.title}>
          {items[index - 1]?.section !== item.section ? <ListSubheader disableSticky sx={{ bgcolor: "background.default", py: 1, lineHeight: "28px", fontWeight: 800 }}>{item.section}</ListSubheader> : <Divider component="li" />}
          <ListItem disablePadding>
            <ListItemButton
              {...(item.route ? { component: Link, to: item.route } : {})}
              disabled={Boolean(item.disabled)}
              sx={{
                minHeight: 80, py: 2, px: { xs: 2, sm: 3 }, gap: { xs: 1.5, sm: 2 },
                borderLeft: '4px solid', borderLeftColor: item.color,
                '&:hover': { bgcolor: alpha(item.color, 0.08) },
                '&.Mui-focusVisible': { bgcolor: alpha(item.color, 0.12), outline: '2px solid', outlineColor: item.color, outlineOffset: -2 },
                '&.Mui-disabled': { opacity: 0.65 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, width: 44, flexShrink: 0, height: 44, borderRadius: 2, alignItems: "center", justifyContent: "center", bgcolor: alpha(item.color, 0.12), color: item.color }}>
                <Icon sx={{ fontSize: 27 }} />
              </ListItemIcon>
              <ListItemText sx={{ minWidth: 0, overflowWrap: "anywhere" }} primary={item.title} secondary={item.description} slotProps={{ primary: { fontWeight: 700, color: 'text.primary' }, secondary: { sx: { mt: 0.5 } } }} />
              {item.disabled ? <Chip label="Próximamente" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} /> : <ChevronRightRoundedIcon sx={{ color: item.color, flexShrink: 0 }} />}
            </ListItemButton>
          </ListItem>
        </React.Fragment>;
      })}
    </List>
  </Box>;
}
