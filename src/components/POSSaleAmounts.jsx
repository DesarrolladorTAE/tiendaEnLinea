import React, { useState } from "react";
import { Box, Chip, Paper, Popover, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { posMoney, saleAmounts } from "../utils/posSaleInfo";

export function SaleAmountBreakdown({ sale }) {
  const amounts = saleAmounts(sale);
  return <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
    <Typography fontWeight={800} sx={{ mb: 1.5 }}>Importes de la venta</Typography>
    <Stack spacing={1}>
      {[["Subtotal", amounts.subtotal], ["IVA", amounts.iva], [amounts.hasRetention ? "Total antes de retenciones" : "Total de venta", amounts.gross], ["Retención ISR", amounts.retention]].map(([label, value]) =>
        <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" fontWeight={700}>{label === "Retención ISR" && value > 0 ? "−" : ""}{posMoney(value)}</Typography>
        </Stack>)}
      <Box sx={theme => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08) })}>
        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
          <Typography fontWeight={800}>Total neto</Typography>
          <Typography fontWeight={900} color="success.main">{posMoney(amounts.net)}</Typography>
        </Stack>
      </Box>
      {[amounts.gross, amounts.iva, amounts.retention, amounts.net].some(value => value === null) &&
        <Typography variant="caption" color="text.secondary">El desglose está incompleto: algunos importes no fueron proporcionados.</Typography>}
    </Stack>
  </Paper>;
}

export function SaleAmountDisplay({ sale }) {
  const [anchor, setAnchor] = useState(null);
  const amounts = saleAmounts(sale);
  return <Stack spacing={0.25} alignItems="flex-end" sx={{ minWidth: 0, maxWidth: "100%", "& .MuiTypography-root": { overflowWrap: "anywhere", textAlign: "right" } }}>
    {amounts.hasRetention && <>
      <Typography component="del" variant="body2" color="error.main" fontWeight={700}>{posMoney(amounts.gross)}</Typography>
      <Typography variant="caption" color="text.secondary">ISR: {amounts.retention > 0 ? "\u2212" : ""}{posMoney(amounts.retention)}</Typography>
    </>}
    <Typography fontWeight={900} color="success.main">{posMoney(amounts.net)}</Typography>
    {amounts.hasRetention && <>
      <Chip size="small" label="ISR retenido" color="info" variant="outlined" onClick={event => setAnchor(event.currentTarget)} aria-label="Ver desglose de ISR retenido" />
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { maxWidth: "calc(100vw - 32px)", width: 360 } } }}>
        <SaleAmountBreakdown sale={sale} />
      </Popover>
    </>}
  </Stack>;
}
