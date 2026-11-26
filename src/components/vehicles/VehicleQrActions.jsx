import React, { useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { showConfirm } from "../../utils/alerts";
import { qrCodePattern, validVehicleId, vehicleRecords, vehicleRecordsUrl } from "../../services/admin/vehicleRecords";
import { useVehicleMutation } from "./VehicleRecordFields";

const errorMessage = (failure, fallback) => ({
  401: "Inicia sesión para continuar.",
  403: "No tienes permiso para esta operación.",
  404: "El código o expediente no está disponible en este contexto.",
  429: "Se alcanzó el límite de intentos. Espera antes de continuar.",
})[failure.response?.status] || fallback;

export function VehicleQrResolver({ branchId }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { run, busy } = useVehicleMutation();
  const submit = (event) => {
    event.preventDefault();
    const value = code.trim();
    if (!qrCodePattern.test(value)) { setError("Ingresa el código completo del QR vehicular."); return; }
    setError("");
    void run(async (signal) => {
      try {
        const { data } = await vehicleRecords.resolve(branchId, value, signal);
        if (signal.aborted) return;
        if (!validVehicleId(data?.data?.vehicle_id) || typeof data.data.is_active !== "boolean") {
          setError("No se pudo verificar el expediente devuelto.");
          return;
        }
        setCode("");
        navigate(vehicleRecordsUrl(branchId, `/${data.data.vehicle_id}`));
      } catch (failure) {
        if (!signal.aborted) setError(errorMessage(failure, "No se pudo resolver el código vehicular."));
      }
    });
  };
  return <Stack component="form" onSubmit={submit} spacing={2} sx={{ maxWidth: 580 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField label="Código QR escaneado" type="password" autoComplete="off" value={code} disabled={busy}
      slotProps={{ htmlInput: { maxLength: 80 } }} onChange={(event) => setCode(event.target.value)} />
    <Button type="submit" variant="contained" disabled={busy}>Buscar expediente</Button>
  </Stack>;
}

export function useVehicleQrRotation({ branchId, id, invalidate, refresh }) {
  const { run, busy } = useVehicleMutation();
  const [notice, setNotice] = useState(null);
  const rotate = () => run(async (signal) => {
    if (!await showConfirm("El código anterior dejará de funcionar. Genera de nuevo las etiquetas que ya se habían descargado.", "Regenerar código") || signal.aborted) return;
    invalidate();
    setNotice(null);
    try {
      const { data } = await vehicleRecords.rotate(branchId, id, signal);
      if (signal.aborted) return;
      if (Number(data?.data?.vehicle_id) !== Number(id) || data.data.regenerated !== true) throw new Error("Respuesta de rotación no reconocida.");
      setNotice({ severity: "success", text: "Código regenerado. El código anterior dejó de funcionar." });
    } catch (failure) {
      if (!signal.aborted) setNotice({ severity: "error", text: errorMessage(failure, "No se pudo confirmar la rotación. Consulta el QR actual antes de volver a intentarlo.") });
    } finally {
      if (!signal.aborted) refresh();
    }
  });
  return { busy, notice, rotate };
}
