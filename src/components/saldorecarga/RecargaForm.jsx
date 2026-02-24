import React, { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { NumericFormat } from "react-number-format";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

function isWithinBusinessHours(now = new Date()) {
  const day = now.getDay(); // 0=Dom, 1=Lun ... 6=Sab
  const h = now.getHours();
  const m = now.getMinutes();
  const minutes = h * 60 + m;

  // Domingo cerrado
  if (day === 0) return false;

  // Lun-Vie 08:00-17:00
  if (day >= 1 && day <= 5) {
    return minutes >= 8 * 60 && minutes <= 17 * 60;
  }

  // Sábado 08:30-14:00
  if (day === 6) {
    return minutes >= 8 * 60 + 30 && minutes <= 14 * 60;
  }

  return false;
}

const RecargaForm = ({ submitting, onSubmit, receiptFile, setReceiptFile }) => {
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { amount: "" },
  });

  const amountVal = watch("amount");
  const inHoursInitial = useMemo(() => isWithinBusinessHours(new Date()), []);

  const handleFormSubmit = async (data) => {
    const nowOk = isWithinBusinessHours(new Date());

    // Aviso si está fuera de horario (pero deja enviar)
    if (!nowOk) {
      const res = await Swal.fire({
        icon: "info",
        title: "Fuera de horario ⏳",
        html: `
          <div style="text-align:left;line-height:1.45">
            <b>Horario de solicitudes:</b><br/>
            • Lunes a viernes: <b>8:00 am – 5:00 pm</b><br/>
            • Sábado: <b>8:30 am – 2:00 pm</b><br/>
            • Domingo: <b>descanso</b><br/><br/>
            Si envías tu solicitud ahora, <b>se registrará</b> y se <b>aplicará</b> en el siguiente horario hábil.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Continuar y enviar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#1976d2",
      });

      if (!res.isConfirmed) return;
    }

    await onSubmit(data, reset);
  };

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
          opacity: 0.8,
          background:
            "radial-gradient(closest-side at 20% 20%, rgba(0,229,255,0.10), transparent 60%)," +
            "radial-gradient(closest-side at 75% 35%, rgba(25,118,210,0.12), transparent 60%)",
          filter: "blur(2px)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography sx={{ color: "#0b1220", fontWeight: 900 }}>
            📝 Solicitud de recarga
          </Typography>

          <Chip
            icon={inHoursInitial ? <CheckCircleRoundedIcon /> : <WarningAmberRoundedIcon />}
            label={inHoursInitial ? "En horario" : "Fuera de horario"}
            sx={{
              fontWeight: 900,
              background: inHoursInitial
                ? "rgba(46, 204, 113, 0.12)"
                : "rgba(255, 193, 7, 0.16)",
              border: "1px solid rgba(15,23,42,0.10)",
              "& .MuiChip-icon": { color: "rgba(11,18,32,0.85)" },
            }}
          />
        </Stack>

        {/* Horario */}
        <Box
          sx={{
            p: 1.6,
            borderRadius: 2.4,
            background:
              "linear-gradient(90deg, rgba(25,118,210,0.08), rgba(156,39,176,0.06))",
            border: "1px solid rgba(15,23,42,0.10)",
            mb: 2,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <AccessTimeRoundedIcon sx={{ color: "rgba(25,118,210,0.95)", mt: "2px" }} />
            <Box>
              <Typography sx={{ color: "#0b1220", fontWeight: 950 }}>
                Horarios de atención
              </Typography>
              <Typography sx={{ color: "rgba(11,18,32,0.80)" }}>
                • Lunes a viernes: <b>8:00 am – 5:00 pm</b>
                <br />
                • Sábado: <b>8:30 am – 2:00 pm</b>
                <br />
                • Domingo: <b>descanso</b>
              </Typography>
              <Typography sx={{ color: "rgba(11,18,32,0.70)", mt: 0.8 }}>
                Si envías fuera de horario, tu solicitud se registrará y se aplicará en el siguiente horario hábil.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(15,23,42,0.10)", mb: 2 }} />

        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          encType="multipart/form-data"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Monto */}
          <Controller
            name="amount"
            control={control}
            rules={{ required: "Ingresa un monto" }}
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <NumericFormat
                value={value}
                onValueChange={({ value: v }) => onChange(v)}
                thousandSeparator=","
                prefix="$"
                suffix=" MXN"
                customInput={TextField}
                label="Monto a recargar"
                onBlur={onBlur}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)" },
                  "& .MuiOutlinedInput-root": {
                    color: "#0b1220",
                    borderRadius: 2.2,
                    background: "rgba(2, 6, 23, 0.02)",
                    "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
                    "&:hover fieldset": { borderColor: "rgba(25,118,210,0.35)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(25,118,210,0.65)" },
                  },
                  "& .MuiFormHelperText-root": { color: "rgba(11,18,32,0.70)" },
                }}
              />
            )}
          />

          {/* Upload PRO */}
          <Box
            sx={{
              p: 1.6,
              borderRadius: 2.4,
              background: "rgba(2, 6, 23, 0.02)",
              border: "1px dashed rgba(15,23,42,0.18)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              gap={1.2}
            >
              <Box>
                <Typography sx={{ color: "#0b1220", fontWeight: 950 }}>
                  Comprobante (opcional)
                </Typography>
                <Typography sx={{ color: "rgba(11,18,32,0.70)" }}>
                  Acepta imagen o PDF.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<UploadFileRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 950,
                    borderRadius: 2.2,
                    py: 1.1,
                    px: 2.2,
                    background: "linear-gradient(90deg, #ff4081, #9c27b0)",
                    boxShadow: "0 12px 28px rgba(2, 6, 23, 0.12)",
                    "&:hover": { filter: "brightness(1.03)", transform: "translateY(-1px)" },
                  }}
                >
                  Subir archivo
                  <input
                    hidden
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </Button>

                {receiptFile && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteOutlineRoundedIcon />}
                    onClick={() => setReceiptFile(null)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 950,
                      borderRadius: 2.2,
                      py: 1.1,
                      px: 2.2,
                      color: "#0b1220",
                      borderColor: "rgba(15,23,42,0.20)",
                      background: "rgba(2, 6, 23, 0.02)",
                      "&:hover": { background: "rgba(2, 6, 23, 0.05)" },
                    }}
                  >
                    Quitar
                  </Button>
                )}
              </Stack>
            </Stack>

            {receiptFile && (
              <Box mt={1.6}>
                <Typography sx={{ color: "rgba(11,18,32,0.86)" }}>
                  Archivo seleccionado: <b>{receiptFile.name}</b>
                </Typography>

                {receiptFile.type?.startsWith("image/") && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Box
                      sx={{
                        mt: 1.2,
                        borderRadius: 2.2,
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.10)",
                        background: "rgba(2, 6, 23, 0.02)",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(receiptFile)}
                        alt="Vista previa"
                        style={{
                          width: "100%",
                          display: "block",
                          maxHeight: 240,
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  </motion.div>
                )}
              </Box>
            )}
          </Box>

          {/* Botón enviar */}
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !amountVal}
            sx={{
              mt: 0.5,
              textTransform: "none",
              fontWeight: 1000,
              borderRadius: 2.4,
              py: 1.4,
              background: "linear-gradient(90deg, #00e5ff, #1976d2)",
              boxShadow: "0 14px 34px rgba(2, 6, 23, 0.14)",
              "&:hover": { filter: "brightness(1.03)", transform: "translateY(-1px)" },
              "&.Mui-disabled": {
                background: "rgba(2, 6, 23, 0.10)",
                color: "rgba(11,18,32,0.55)",
              },
            }}
          >
            {submitting ? <CircularProgress size={24} /> : "🚀 Enviar solicitud"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RecargaForm;