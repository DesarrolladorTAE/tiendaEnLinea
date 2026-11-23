import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button,
  Stack,
  LinearProgress,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

function mmss(sec) {
  const s = Math.max(0, Number(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const CountdownLockModal = ({
  open,
  seconds = 60,
  title = "¡Pago confirmado!",
  message = "Estamos activando tu plan. Por favor espera un momento.",
  onDone, // cuando el usuario da click en “Continuar” (solo al final)
}) => {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (!open) return;
    setLeft(seconds);
  }, [open, seconds]);

  useEffect(() => {
    if (!open) return;

    const t = setInterval(() => {
      setLeft((p) => Math.max(0, p - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [open]);

  const done = left <= 0;
  const progress = useMemo(() => {
    const total = Math.max(1, seconds);
    const passed = total - Math.max(0, left);
    return Math.min(100, Math.max(0, (passed / total) * 100));
  }, [left, seconds]);

  return (
    <Dialog
      open={open}
      // 🔒 imposible cerrar: no ESC, no backdrop
      onClose={() => {}}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          py: 2,
        }}
      >
        {done ? (
          <CheckCircleRoundedIcon color="success" />
        ) : (
          <AccessTimeRoundedIcon color="warning" />
        )}
        {title}
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
        <Typography sx={{ fontWeight: 700 }}>
          {message}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1 }}
          >
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              Activando…
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 900 }}>
              {done ? "LISTO" : mmss(left)}
            </Typography>
          </Stack>
        </Box>

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2, fontWeight: 900, borderRadius: 2, py: 1 }}
          disabled={!done}
          onClick={onDone}
        >
          Continuar
        </Button>

        <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
          *Cuando termine el contador podrás continuar.*
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default CountdownLockModal;