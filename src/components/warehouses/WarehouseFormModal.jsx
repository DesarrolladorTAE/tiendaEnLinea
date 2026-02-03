import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Switch,
  FormControlLabel,
  MenuItem,
  Divider,
} from "@mui/material";
import { useForm } from "react-hook-form";

import axiosClient from "../../config/axiosClient";
import { showSuccess, alertFromAxiosError } from "../../utils/alerts";

export default function WarehouseFormModal({
  open,
  mode = "create", // create | edit
  branchId,
  warehouse = null,
  onClose,
  onSaved,
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      code: "",
      type: "general",
      is_active: true,
      is_default: false,
      use_branch_address: true,

      address_line1: "",
      address_line2: "",
      neighborhood: "",
      city: "",
      state: "",
      postal_code: "",
      country: "México",
    },
  });

  const useBranchAddress = watch("use_branch_address");

  // 🔁 cargar datos en modo edición
  useEffect(() => {
    if (mode === "edit" && warehouse) {
      reset({
        name: warehouse.name ?? "",
        code: warehouse.code ?? "",
        type: warehouse.type ?? "general",
        is_active: warehouse.is_active ?? true,
        is_default: warehouse.is_default ?? false,
        use_branch_address: warehouse.use_branch_address ?? true,

        address_line1: warehouse.address_line1 ?? "",
        address_line2: warehouse.address_line2 ?? "",
        neighborhood: warehouse.neighborhood ?? "",
        city: warehouse.city ?? "",
        state: warehouse.state ?? "",
        postal_code: warehouse.postal_code ?? "",
        country: warehouse.country ?? "México",
      });
    }

    if (mode === "create") {
      reset();
    }
  }, [mode, warehouse, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "create") {
        await axiosClient.post(`/branches/${branchId}/warehouses`, form);
        showSuccess("Almacén creado correctamente");
      } else {
        await axiosClient.put(`/warehouses/${warehouse.id}`, form);
        showSuccess("Almacén actualizado correctamente");
      }

      onSaved?.();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar el almacén");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === "create" ? "Nuevo almacén" : "Editar almacén"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* Datos básicos */}
          <TextField
            label="Nombre del almacén"
            {...register("name", { required: "El nombre es obligatorio" })}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />

          <TextField
            label="Código"
            {...register("code")}
            helperText="Opcional (ej. ALM-CENTRAL)"
            fullWidth
          />

          <TextField
            select
            label="Tipo"
            {...register("type")}
            fullWidth
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="venta">Venta</MenuItem>
            <MenuItem value="reserva">Reserva</MenuItem>
          </TextField>

          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={<Switch {...register("is_active")} defaultChecked />}
              label="Activo"
            />

            <FormControlLabel
              control={<Switch {...register("is_default")} />}
              label="Almacén default"
            />
          </Stack>

          <Divider />

          {/* Dirección */}
          <FormControlLabel
            control={<Switch {...register("use_branch_address")} defaultChecked />}
            label="Usar dirección de la sucursal"
          />

          {!useBranchAddress && (
            <Stack spacing={2}>
              <TextField label="Calle y número" {...register("address_line1")} fullWidth />
              <TextField label="Colonia" {...register("neighborhood")} fullWidth />
              <TextField label="Ciudad" {...register("city")} fullWidth />
              <TextField label="Estado" {...register("state")} fullWidth />
              <TextField label="Código Postal" {...register("postal_code")} fullWidth />
              <TextField label="País" {...register("country")} fullWidth />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          sx={{ fontWeight: 900 }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
