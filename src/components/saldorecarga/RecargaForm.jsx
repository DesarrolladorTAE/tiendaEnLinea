import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { NumericFormat } from "react-number-format";

const RecargaForm = ({
  submitting,
  onSubmit,
  receiptFile,
  setReceiptFile,
}) => {
  const { control, handleSubmit, reset } = useForm({ defaultValues: { amount: "" } });

  const handleFormSubmit = async (data) => {
    await onSubmit(data, reset);
  };

  return (
    <Paper sx={{ p: 3 }} elevation={3}>
      <Typography variant="subtitle1" gutterBottom align="center">
        📝 Formulario de Solicitud
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(handleFormSubmit)}
        encType="multipart/form-data"
        sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      >
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
              label="Monto a Recargar"
              onBlur={onBlur}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              sx={{ width: { xs: "100%", sm: "80%" } }}
            />
          )}
        />

        <TextField
          key={receiptFile ? "hasFile" : "noFile"}
          type="file"
          inputProps={{ accept: "image/*,.pdf" }}
          fullWidth
          margin="dense"
          onChange={(e) => setReceiptFile(e.target.files?.[0])}
          sx={{ width: { xs: "100%", sm: "80%" } }}
        />

        {receiptFile && (
          <>
            <Typography variant="body2" color="text.secondary">
              Archivo seleccionado: {receiptFile.name}
            </Typography>
            {receiptFile.type.startsWith("image/") && (
              <Box mt={2}>
                <img
                  src={URL.createObjectURL(receiptFile)}
                  alt="Vista previa"
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
              </Box>
            )}
          </>
        )}

        <Button type="submit" variant="contained" disabled={submitting} sx={{ px: 4, py: 1.5 }}>
          {submitting ? <CircularProgress size={24} /> : "🚀 Enviar Solicitud"}
        </Button>
      </Box>
    </Paper>
  );
};

export default RecargaForm;
