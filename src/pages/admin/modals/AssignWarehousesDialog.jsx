import React, { useMemo } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { adminSectionDialog, adminSectionPrimaryAction } from "../../../components/admin/AdminSectionOption";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
};

export default function AssignWarehousesDialog({
  open,
  onClose,
  isMobile,
  pos,
  warehouses,
  warehouseIds,
  setWarehouseIds,
  showUnassigned,
  setShowUnassigned,
  loading,
  onSave,
}) {
  const selectedWarehouses = useMemo(() => {
    const ids = new Set((warehouseIds || []).map((x) => Number(x)));
    return (warehouses || []).filter((w) => ids.has(Number(w.id)));
  }, [warehouses, warehouseIds]);

  return (
    <Dialog
      open={!!open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={!!isMobile}
      aria-labelledby="pos-warehouses-title"
      sx={{ ...adminSectionDialog, "& .MuiDialog-paperFullScreen": { m: 0, borderRadius: 0 } }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          border: `1px solid ${alpha("#000", 0.1)}`,
        },
      }}
    >
      <DialogTitle id="pos-warehouses-title"
        sx={{
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pr: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#ffc107",
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <WarehouseRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box>
            <Typography sx={{ color: "#fff !important", fontWeight: 800, lineHeight: 1.1 }}>
              Asignación de almacenes
            </Typography>
            <Typography variant="caption" sx={{ color: "#c7cbd1 !important" }}>
              {pos?.name ? pos.name : "POS"}
            </Typography>
          </Box>
        </Stack>

        <IconButton aria-label="Cerrar" onClick={onClose} disabled={loading} sx={{ borderRadius: 2, color: "#fff" }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.2}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              bgcolor: alpha("#000", 0.03),
              border: `1px solid ${alpha("#000", 0.08)}`,
            }}
          >
            Selecciona los almacenes que este POS podrá usar para ventas e
            inventario.
          </Alert>

          <Autocomplete
            multiple
            options={warehouses || []}
            disableCloseOnSelect
            getOptionLabel={(o) => o?.name || ""}
            value={selectedWarehouses}
            onChange={(_, selected) => {
              const ids = (selected || []).map((x) => Number(x.id));
              setWarehouseIds(ids);
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox checked={selected} />
                <Typography sx={{ fontWeight: 800 }}>
                  {option?.name || `Almacén #${option?.id}`}
                </Typography>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Almacenes asignados"
                placeholder="Selecciona uno o varios…"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  },
                }}
              />
            )}
          />

          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={1.2}
            sx={{
              p: 1.2,
              borderRadius: 2,
              border: `1px solid ${alpha("#000", 0.08)}`,
              bgcolor: alpha("#000", 0.02),
            }}
          >
            <Switch
              checked={!!showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
              sx={{ mt: 0.4 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>
                Mostrar productos sin almacén
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Si se activa, este POS podrá vender productos que no estén
                asignados a ningún almacén.
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            <b>Seleccionados:</b> {(warehouseIds || []).length} almacenes
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            borderColor: alpha("#000", 0.18),
            color: COLORS.black,
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={onSave}
          variant="contained"
          disabled={!!loading}
          startIcon={<SaveRoundedIcon />}
          sx={adminSectionPrimaryAction}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
