import React, { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { motion } from "framer-motion";

const RecargaStatus = ({ estado, onRetry }) => {
  // estado puede traer:
  // estado.error -> string (para mostrar)
  // estado.errorMeta -> { tiempo_faltante, puedes_recargar_en, ultima_recarga, referencia, ... } (opcional)
  const meta = estado?.errorMeta || null;

  const errorFinal = useMemo(() => {
    // Si backend mandó error RECARGA_RECIENTE + tiempo faltante
    if (meta?.tiempo_faltante) {
      return `Debes esperar 12 minutos desde la última recarga a este número.\nTiempo faltante: ${meta.tiempo_faltante}`;
    }
    return estado?.error || "";
  }, [estado?.error, meta]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        background: "#fff",

        // ✅ centra bien en escritorio (y también móvil)
        flex: 1,
        minHeight: { xs: 260, md: "calc(90vh - 220px)" },
        justifyContent: estado.loading ? "center" : "flex-start",
      }}
    >
      {estado.loading && (
        <motion.div
          style={{ width: "100%" }}  // ✅
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              border: "1px solid rgba(0,123,255,0.18)",
              background: "rgba(0,123,255,0.06)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 18px 45px rgba(2,6,23,0.08)",
            }}
          >
            <AutorenewRoundedIcon
              sx={{
                fontSize: 42,
                color: "#0b5ed7",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </Box> */}

          <Typography sx={{ mt: 2, fontWeight: 950, color: "#0b1220" }}>
            Procesando recarga...
          </Typography>
          <Typography sx={{ mt: 0.6, color: "rgba(11,18,32,0.62)", fontWeight: 800 }}>
            No cierres esta ventana.
          </Typography>
        </motion.div>
      )}

      {!estado.loading && estado.error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 76, color: "#d32f2f" }} />
          <Typography sx={{ mt: 1, fontWeight: 950, color: "#d32f2f", fontSize: 16 }}>
            Ocurrió un error
          </Typography>

          <Typography
            sx={{
              mt: 1,
              maxWidth: 520,
              whiteSpace: "pre-line",
              color: "rgba(11,18,32,0.72)",
              fontWeight: 800,
            }}
          >
            {errorFinal}
          </Typography>

          {/* Si viene tiempo faltante, puedes mostrar un mini detalle extra */}
          {/* {!!meta?.puedes_recargar_en && (
            <Typography sx={{ mt: 1, color: "rgba(11,18,32,0.55)", fontWeight: 800 }}>
              Podrás recargar después de: {meta.puedes_recargar_en}
            </Typography>
          )} */}

          <Button
            onClick={onRetry}
            variant="outlined"
            sx={{
              mt: 2.4,
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              borderColor: "rgba(244,67,54,0.28)",
              color: "#d32f2f",
              background: "rgba(244,67,54,0.06)",
              "&:hover": { background: "rgba(244,67,54,0.10)" },
            }}
          >
            Volver a intentar
          </Button>
        </motion.div>
      )}

      {!estado.loading && estado.data && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 76, color: "#2e7d32" }} />
          <Typography sx={{ mt: 1, fontWeight: 950, color: "#2e7d32", fontSize: 16 }}>
            ¡Recarga exitosa!
          </Typography>
          <Typography sx={{ mt: 0.6, color: "rgba(11,18,32,0.62)", fontWeight: 800 }}>
            Preparando tu comprobante.
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};

export default RecargaStatus;