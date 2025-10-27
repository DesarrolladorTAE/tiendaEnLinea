import React, { useState } from "react";
import {
  Paper, Typography, Box, Button, IconButton, Stack, Fade,
  Tabs, Tab
} from "@mui/material";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const RecargaDepositInfo = ({ bancos, referencia }) => {
  const [selected, setSelected] = useState(0);

  const handleCopy = () => {
    const banco = bancos[selected];
    const text = `
${banco.bank}
Número de Cuenta: ${banco.accountNumber}
CLABE: ${banco.clabe}
${banco.oxxo ? `Depósito OXXO: ${banco.oxxo}\n` : ""}Beneficiario: ${banco.beneficiary}
Referencia: ${referencia}`.trim();

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
  const handleTab = (_e, val) => setSelected(val);

  const banco = bancos[selected];

  return (
<Paper
  sx={{
    p: 3,
    textAlign: "center",
    position: "relative",
    minHeight: 360,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
  elevation={3}
>
  {/* Tabs con logos (los 3 visibles) */}
  <Tabs
    value={selected}
    onChange={handleTab}
    variant="fullWidth"
    sx={{
       // 👈 agrega separación abajo
      "& .MuiTabs-indicator": {
        height: 3,
        backgroundColor: "#1976d2",
        borderRadius: 2,
      },
      "& .MuiTab-root": { minHeight: 56 },
    }}
    aria-label="Bancos disponibles"
  >
    {bancos.map((b, idx) => (
      <Tab
        key={b.bank}
        value={idx}
        icon={
          <img
            src={b.logo}
            alt={b.bank}
            style={{
              height: 28,
              objectFit: "contain",
              filter: selected === idx ? "none" : "grayscale(1) opacity(.6)",
              transition: "filter .2s ease",
            }}
          />
        }
        aria-label={b.bank}
        sx={{
          px: 1.5,
          "&.Mui-selected": {
            bgcolor: "transparent",
          },
        }}
      />
    ))}
  </Tabs>

  {/* 👇 Línea de separación visual */}
  <Box
    sx={{
      width: "100%",
      height: "1px",
      background: "linear-gradient(to right, #e0e0e0, #cfd8dc, #e0e0e0)",
      mb: 2,
      mt: 1,
    }}
  />

  {/* Info */}
  <Stack
    direction="row"
    spacing={3}
    alignItems="center"
    justifyContent="center"
    sx={{
      width: "100%",
      background: "#f9fafb",
      borderRadius: 2,
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      p: 3,
      transition: "all 0.3s ease",
      "&:hover": { boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
    }}
  >
    <Fade in timeout={300} key={selected}>
      <Box sx={{ minWidth: 80, minHeight: 80 }} />
    </Fade>

    <Box sx={{ textAlign: "left", flex: 1 }}>
      <Typography>🆔 <b>Cuenta:</b> {banco.accountNumber}</Typography>
      <Typography>🔗 <b>CLABE:</b> {banco.clabe}</Typography>
      {banco.oxxo && <Typography>🏪 <b>Depósito OXXO:</b> {banco.oxxo}</Typography>}
      <Typography>👤 <b>Beneficiario:</b> {banco.beneficiary}</Typography>
      <Typography>
        🔖 <b>Referencia:</b>{" "}
        <span style={{ color: "#1565c0" }}>{referencia}</span>
      </Typography>
    </Box>
  </Stack>


      {/* Aviso referencia */}
      <Box
        sx={{
          mt: 3, mb: 1, py: 1.3, px: 2,
          background: "linear-gradient(90deg,#fffde7,#e3f2fd)",
          borderLeft: "5px solid #1976d2",
          borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 8px 0 rgba(21,101,192,0.07)", fontWeight: 600,
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


    </Paper>
  );
};

export default RecargaDepositInfo;
