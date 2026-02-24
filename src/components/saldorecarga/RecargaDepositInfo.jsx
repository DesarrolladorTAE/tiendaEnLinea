import React, { useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Fade,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ContentCopyRounded,
  InfoRounded,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const RecargaDepositInfo = ({ bancos, referencia }) => {
  const [selected, setSelected] = useState(0);
  const banco = bancos[selected];

  const textToCopy = useMemo(() => {
    return `
${banco.bank}
Número de Cuenta: ${banco.accountNumber}
CLABE: ${banco.clabe}
${banco.oxxo ? `Depósito OXXO: ${banco.oxxo}\n` : ""}Beneficiario: ${banco.beneficiary}
Referencia: ${referencia}`.trim();
  }, [banco, referencia]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy);
    Swal.fire({
      icon: "success",
      title: "✅ Datos copiados",
      text: "Incluye cuenta, CLABE y referencia.",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handlePrev = () => setSelected((s) => (s - 1 + bancos.length) % bancos.length);
  const handleNext = () => setSelected((s) => (s + 1) % bancos.length);
  const handleTab = (_e, val) => setSelected(val);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        p: { xs: 2.2, sm: 3 },
        borderRadius: 3,
        overflow: "hidden",
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(15,23,42,0.10)",
        boxShadow: "0 18px 45px rgba(2, 6, 23, 0.10)",
        minHeight: 380,
      }}
    >
      {/* Acento suave */}
      <Box
        sx={{
          position: "absolute",
          inset: -160,
          pointerEvents: "none",
          opacity: 0.75,
          background:
            "radial-gradient(closest-side at 25% 25%, rgba(25,118,210,0.13), transparent 60%)," +
            "radial-gradient(closest-side at 80% 35%, rgba(156,39,176,0.10), transparent 60%)",
          filter: "blur(2px)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.2}>
          <Typography sx={{ color: "#0b1220", fontWeight: 900 }}>
            🏦 Datos de depósito / transferencia
          </Typography>

          {bancos.length > 1 ? (
            <Stack direction="row" gap={0.5}>
              <Tooltip title="Anterior">
                <IconButton onClick={handlePrev} size="small">
                  <ChevronLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Siguiente">
                <IconButton onClick={handleNext} size="small">
                  <ChevronRight />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Chip
              label="1 banco"
              sx={{
                fontWeight: 800,
                background: "rgba(2, 6, 23, 0.06)",
                border: "1px solid rgba(15,23,42,0.10)",
              }}
            />
          )}
        </Stack>

        <Tabs
          value={selected}
          onChange={handleTab}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 1.2,
            "& .MuiTabs-indicator": {
              height: 3,
              background: "linear-gradient(90deg, #1976d2, #9c27b0)",
              borderRadius: 999,
            },
            "& .MuiTab-root": {
              minHeight: 56,
              px: 1.25,
              opacity: 0.85,
            },
            "& .Mui-selected": { opacity: 1 },
          }}
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
                    height: 46,
                    width: 120,
                    objectFit: "contain",
                    filter: selected === idx ? "none" : "grayscale(1) opacity(.60)",
                    transition: "filter .2s ease",
                  }}
                />
              }
              aria-label={b.bank}
            />
          ))}
        </Tabs>

        <Divider sx={{ borderColor: "rgba(15,23,42,0.10)", mb: 2 }} />

        <Fade in timeout={240} key={selected}>
          <Box>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Box
                sx={{
                  p: { xs: 2, sm: 2.4 },
                  borderRadius: 3,
                  background:
                    "linear-gradient(180deg, rgba(25,118,210,0.06), rgba(156,39,176,0.04))",
                  border: "1px solid rgba(15,23,42,0.10)",
                  boxShadow: "0 14px 30px rgba(2, 6, 23, 0.08)",
                }}
              >
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.2}>
                  <Chip
                    label={banco.bank}
                    sx={{
                      color: "#0b1220",
                      fontWeight: 900,
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(15,23,42,0.10)",
                    }}
                  />
                  <Chip
                    label={`Referencia: ${referencia}`}
                    sx={{
                      color: "#0b1220",
                      fontWeight: 900,
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(15,23,42,0.10)",
                    }}
                  />
                </Stack>

                <Stack spacing={0.85}>
                  <Typography sx={{ color: "rgba(11,18,32,0.92)" }}>
                    🆔 <b>Cuenta:</b> {banco.accountNumber}
                  </Typography>
                  <Typography sx={{ color: "rgba(11,18,32,0.92)" }}>
                    🔗 <b>CLABE:</b> {banco.clabe}
                  </Typography>
                  {banco.oxxo && (
                    <Typography sx={{ color: "rgba(11,18,32,0.92)" }}>
                      🏪 <b>Depósito OXXO:</b> {banco.oxxo}
                    </Typography>
                  )}
                  <Typography sx={{ color: "rgba(11,18,32,0.88)" }}>
                    👤 <b>Beneficiario:</b> {banco.beneficiary}
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.3,
                      p: 1.2,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(15,23,42,0.10)",
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <InfoRounded sx={{ fontSize: 20, color: "rgba(25,118,210,0.95)" }} />
                    <Typography sx={{ color: "rgba(11,18,32,0.92)", fontWeight: 800 }}>
                      Usa la <b>referencia</b> como concepto al depositar/transferir.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </motion.div>

            <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} mt={2}>
              <Button
                variant="contained"
                onClick={handleCopy}
                startIcon={<ContentCopyRounded />}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.2,
                  py: 1.2,
                  flex: 1,
                  background: "linear-gradient(90deg, #00e5ff, #1976d2)",
                  boxShadow: "0 12px 28px rgba(2, 6, 23, 0.16)",
                  "&:hover": {
                    filter: "brightness(1.03)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Copiar datos (con referencia)
              </Button>

              <Button
                variant="outlined"
                onClick={() =>
                  Swal.fire({
                    icon: "info",
                    title: "Referencia",
                    text: referencia,
                    confirmButtonText: "Listo",
                  })
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.2,
                  py: 1.2,
                  flex: 1,
                  color: "#0b1220",
                  borderColor: "rgba(15,23,42,0.18)",
                  background: "rgba(2, 6, 23, 0.02)",
                  "&:hover": { background: "rgba(2, 6, 23, 0.05)" },
                }}
              >
                Ver referencia
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

export default RecargaDepositInfo;