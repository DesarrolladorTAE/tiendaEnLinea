import React from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const RecargaStatus = ({ estado, onRetry }) => {
  return (
    <Box p={3} display="flex" flexDirection="column" alignItems="center">
      {estado.loading && (
        <>
          <CircularProgress size={48} />
          <Typography mt={2}>Procesando recarga...</Typography>
        </>
      )}

      {!estado.loading && estado.error && (
        <>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h6" color="error" mt={2}>
            {estado.error}
          </Typography>
          <Button
            onClick={onRetry}
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
          >
            Volver a intentar
          </Button>
        </>
      )}

      {!estado.loading && estado.data && (
        <>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
          <Typography variant="h6" color="success.main" mt={2}>
            ¡Recarga exitosa!
          </Typography>
        </>
      )}
    </Box>
  );
};

export default RecargaStatus;
