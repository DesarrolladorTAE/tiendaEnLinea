import React, { useState } from "react";
import { Paper, Typography, Box, Button, IconButton, Stack, Fade } from "@mui/material";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const RecargaDepositInfo = ({ bancos, referencia }) => {
  const [selected, setSelected] = useState(0);

  const handleCopy = () => {
    const banco = bancos[selected];
    let text = `
${banco.bank}
Número de Cuenta: ${banco.accountNumber}
CLABE: ${banco.clabe}
${banco.oxxo ? `Depósito OXXO: ${banco.oxxo}` : ""}
Beneficiario: ${banco.beneficiary}
Referencia: ${referencia}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        icon: "success",
        title: "✅ Datos copiados con referencia",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  };

  const handlePrev = () => setSelected((selected - 1 + bancos.length) % bancos.length);
  const handleNext = () => setSelected((selected + 1) % bancos.length);

  const banco = bancos[selected];

  return (
    <Paper sx={{ p: 3, textAlign: "center", position: "relative", minHeight: 360, display: "flex", flexDirection: "column", justifyContent: "center" }} elevation={3}>
      {/* Flechas y nombre */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
        <IconButton onClick={handlePrev}>
          <ChevronLeft fontSize="large" />
        </IconButton>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 18, mx: 2 }}>
            {banco.bank}
          </Typography>
        </Box>
        <IconButton onClick={handleNext}>
          <ChevronRight fontSize="large" />
        </IconButton>
      </Box>
      {/* Imagen + Info */}
      <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Fade in timeout={300} key={selected}>
          <Box sx={{ minWidth: 80, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={banco.logo} alt={banco.bank} style={{ maxWidth: 80, maxHeight: 80, borderRadius: 8, boxShadow: "0 2px 12px 0 rgba(0,0,0,0.07)" }} />
          </Box>
        </Fade>
        <Box sx={{ textAlign: "left", flex: 1 }}>
          <Typography>🆔 <b>Cuenta:</b> {banco.accountNumber}</Typography>
          <Typography>🔗 <b>CLABE:</b> {banco.clabe}</Typography>
          {banco.oxxo && (
            <Typography>🏪 <b>Depósito OXXO:</b> {banco.oxxo}</Typography>
          )}
          <Typography>👤 <b>Beneficiario:</b> {banco.beneficiary}</Typography>
          <Typography>🔖 <b>Referencia:</b> <span style={{ color: "#1565c0" }}>{referencia}</span></Typography>
        </Box>
      </Stack>
<Box
  sx={{
    mt: 3,
    mb: 1,
    py: 1.3,
    px: 2,
    background: "linear-gradient(90deg,#fffde7,#e3f2fd)",
    borderLeft: "5px solid #1976d2",
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 8px 0 rgba(21,101,192,0.07)",
    fontWeight: 600,
  }}
>
  <span role="img" aria-label="atención" style={{ fontSize: 22, marginRight: 8 }}>⚠️</span>
  <Typography fontWeight={700} color="primary" fontSize={16}>
    ¡IMPORTANTE! Usa <b>esta referencia</b> como concepto al hacer tu depósito o transferencia.
  </Typography>
</Box>

      <Box mt={2}>
        <Button variant="contained" onClick={handleCopy} sx={{ textTransform: "none", fontWeight: 600, px: 3 }}>
          📋 Copiar Datos
        </Button>
      </Box>
      {/* Dots */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1 }}>
        {bancos.map((b, idx) => (
          <Box
            key={b.bank}
            sx={{
              width: 14, height: 14, borderRadius: "50%",
              background: idx === selected ? "#1976d2" : "#e0e0e0",
              border: idx === selected ? "2px solid #1976d2" : "2px solid #e0e0e0",
              cursor: "pointer", transition: "all 0.2s"
            }}
            onClick={() => setSelected(idx)}
            title={b.bank}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default RecargaDepositInfo;
