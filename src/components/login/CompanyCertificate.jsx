import React, { useId, useState } from "react";
import { Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";

export default function CompanyCertificate() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ver certificado de Empresa Guerrerense"
        aria-haspopup="dialog"
        sx={{
          gap: 0.8, py: 0.75, px: 1.25, minHeight: 44, borderRadius: "999px",
          border: "1px solid #d5005333", bgcolor: "#fff", boxShadow: "0 5px 16px #0001",
          textTransform: "none", textAlign: "left",
          "&:hover": { bgcolor: "#fff3f7", borderColor: "#d5005373" },
          "&.Mui-focusVisible": { outline: "2px solid #d50053", outlineOffset: 2 },
        }}
      >
        <Box component="img" src="/assets/images/certificado-thumb.jpg" alt="" sx={{
          width: { xs: 28, sm: 34 }, height: { xs: 28, sm: 34 }, borderRadius: "50%",
          objectFit: "cover", objectPosition: "88% 82%", border: "1px solid #d50053",
        }} />
        <Box component="span">
          <Typography component="span" display="block" variant="caption" color="text.secondary" lineHeight={1.2}>
            Empresa Guerrerense
          </Typography>
          <Typography component="span" display="block" variant="caption" color="#d50053" fontWeight={900}>
            Certificada
          </Typography>
        </Box>
      </Button>

      <Dialog
        open={open}
        onClose={close}
        aria-labelledby={titleId}
        fullWidth
        maxWidth="lg"
        slotProps={{ paper: { sx: {
          m: { xs: 1, sm: 3 }, width: { xs: "calc(100% - 16px)", sm: "calc(100% - 48px)" },
          maxWidth: 1050, maxHeight: { xs: "calc(100dvh - 16px)", sm: "calc(100dvh - 48px)" },
          borderRadius: { xs: 2, sm: 3 },
        } } }}
      >
        <Box component="header" sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Box>
              <Typography id={titleId} component="h2" sx={{ fontSize: { xs: 16, sm: 20 }, fontWeight: 900, color: "#d50053" }}>
                Empresa Guerrerense Certificada
              </Typography>
              <Typography variant="caption" color="text.secondary">Folio 2026-027</Typography>
            </Box>
            <Button autoFocus onClick={close} sx={{ flexShrink: 0, minHeight: 44, textTransform: "none", fontWeight: 800 }}>
              Cerrar
            </Button>
          </Stack>
        </Box>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          <Stack spacing={1}>
            <Typography fontWeight={900}>Tecnologías Administrativas Elad, S. de R.L. de C.V.</Typography>
            <Typography variant="body2" fontWeight={700} color="#d50053">Consultoría Tecnológica Certificada</Typography>
            <Typography variant="body2" color="text.secondary">
              Avalado por la Secretaría de Fomento y Desarrollo Económico conforme a la Ley de Fomento Económico,
              Inversión y Desarrollo del Estado de Guerrero.
            </Typography>
            <Box component="img" src="/assets/images/certificado.png" alt="Certificado de Empresa Guerrerense, folio 2026-027"
              sx={{ display: "block", width: "100%", maxWidth: 820, height: "auto", mx: "auto", borderRadius: 2 }} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
