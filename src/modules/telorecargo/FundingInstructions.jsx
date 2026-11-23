import React, { useState } from "react";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { fundingReference } from "./fundingReference";

export const fundingDetails = {
  bank: "Santander", account: "6551128849",
  clabe: "014261655112884941", oxxo: "5579-0890-0687-2124",
  beneficiary: "Tecnologías Administrativas ELAD S. de R.L. de C.V.",
};

export default function FundingInstructions({ telorecargoUserId }) {
  const [feedback, setFeedback] = useState(null);
  const concept = fundingReference(telorecargoUserId);
  async function copyDetails() {
    if (!concept) return;
    try {
      await navigator.clipboard.writeText(`Banco: ${fundingDetails.bank}\nReferencia / concepto: ${concept}\nCuenta: ${fundingDetails.account}\nCLABE: ${fundingDetails.clabe}\nDepósito OXXO: ${fundingDetails.oxxo}\nBeneficiario: ${fundingDetails.beneficiary}`);
      setFeedback({ severity: "success", text: "Datos bancarios copiados con la referencia." });
    } catch {
      setFeedback({ severity: "info", text: "No fue posible copiar automáticamente. Puedes seleccionar y copiar los datos de esta tarjeta." });
    }
  }
  return <Paper variant="outlined" className="trc-funding-details" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0 }}><Stack spacing={2.5}>
    <Stack direction="row" gap={1} alignItems="center"><AccountBalanceOutlinedIcon color="primary" /><Typography component="h2" variant="h6" fontWeight={850}>Datos de depósito / transferencia</Typography></Stack>
    <Box component="img" src="/assets/santander.svg" alt="Santander" sx={{ width: 160, maxWidth: "100%", height: 40, objectFit: "contain", objectPosition: "left" }} />
    <Box className="trc-bank-data">
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}><Chip label="Santander" variant="outlined" /><Chip label={concept ? `Referencia: ${concept}` : "Referencia no disponible"} color="primary" variant="outlined" /></Stack>
      <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
        {[["Cuenta", fundingDetails.account], ["CLABE", fundingDetails.clabe], ["Depósito OXXO", fundingDetails.oxxo], ["Beneficiario", fundingDetails.beneficiary]].map(([label, value]) => <Box key={label}><Typography component="dt" variant="body2" fontWeight={800}>{label}</Typography><Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere", userSelect: "text", fontVariantNumeric: "tabular-nums" }}>{value}</Typography></Box>)}
      </Box>
    </Box>
    {concept ? <Alert severity="info">Usa <strong>{concept}</strong> como concepto al depositar o transferir. Para solicitar saldo, captura el monto, la referencia bancaria y adjunta tu comprobante.</Alert> : <Alert severity="warning">La referencia está pendiente de consultar con Telorecargo. Verifica tu referencia en tu cuenta de Telorecargo antes de depositar.</Alert>}
    <Button variant="contained" disabled={!concept} startIcon={<ContentCopyOutlinedIcon />} onClick={copyDetails}>Copiar datos con referencia</Button>
    {feedback && <Alert severity={feedback.severity} role="status">{feedback.text}</Alert>}
  </Stack></Paper>;
}

export function FundingSchedule() {
  return <Alert severity="info" icon={<ScheduleOutlinedIcon />}><Typography fontWeight={800}>Horarios de atención</Typography><Box component="ul" sx={{ pl: 2.5, my: 1 }}><li>Lunes a viernes: <strong>8:00 am – 5:00 pm</strong></li><li>Sábado: <strong>8:30 am – 2:00 pm</strong></li><li>Domingo: <strong>descanso</strong></li></Box>Si envías fuera de horario, tu solicitud se registrará y se aplicará en el siguiente horario hábil.</Alert>;
}
