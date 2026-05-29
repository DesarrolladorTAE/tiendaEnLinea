// src/components/restocks/SupplierRestockHistory.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CloseRounded,
  LocalShippingRounded,
  SearchRounded,
  TuneRounded,
} from "@mui/icons-material";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

const btnBlackSx = {
  borderRadius: 2,
  fontWeight: 900,
  textTransform: "none",
  bgcolor: COLORS.black,
  color: "#fff",
  "&:hover": { bgcolor: "#222" },
};

export default function SupplierRestockHistory({
  open,
  onClose,
  branchId,
  suppliers,
  renderHistoryCard,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [supplier, setSupplier] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!branchId || !supplier?.id) return;

    try {
      setLoading(true);

      const params = {
        branch_id: branchId,
        supplier_id: supplier.id,
        per_page: 500,
      };

      if (filterType === "range") {
        if (from) params.from = from;
        if (to) params.to = to;
      }

      const { data } = await axiosClient.get("/restocks", { params });

      setHistory(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      alertFromAxiosError(err, "Error al cargar historial del proveedor.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, supplier?.id, filterType, from, to]);

  useEffect(() => {
    if (open && supplier?.id) fetchHistory();

    if (!open) {
      setSupplier(null);
      setHistory([]);
      setFilterType("all");
      setFrom("");
      setTo("");
    }
  }, [open, supplier?.id, fetchHistory]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          height: fullScreen ? "100dvh" : "90vh",
          maxHeight: fullScreen ? "100dvh" : "90vh",
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              display: "grid",
              placeItems: "center",
            }}
          >
            <LocalShippingRounded sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
              Historial por proveedor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consulte movimientos de abastecimiento por proveedor.
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: COLORS.softBg,
          p: 2,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: COLORS.paper,
              border: `1px solid ${alpha("#000", 0.08)}`,
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TuneRounded />
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>
                    Filtros de consulta
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seleccione un proveedor y rango de fechas si lo necesita.
                  </Typography>
                </Box>
              </Stack>

              <Autocomplete
                value={supplier}
                onChange={(_, value) => {
                  setSupplier(value);
                  setHistory([]);
                }}
                options={suppliers || []}
                fullWidth
                getOptionLabel={(s) =>
                  s?.name
                    ? `${s.name}${s.phone ? ` • ${s.phone}` : ""}`
                    : ""
                }
                isOptionEqualToValue={(option, value) =>
                  Number(option?.id) === Number(value?.id)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar proveedor"
                    size="small"
                    sx={fieldSx}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchRounded fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  label="Filtro"
                  size="small"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  fullWidth
                  sx={fieldSx}
                >
                  <option value="all">Todos</option>
                  <option value="range">Rango de fechas</option>
                </TextField>

                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={filterType !== "range"}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={fieldSx}
                />

                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={filterType !== "range"}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={fieldSx}
                />

                <Button
                  variant="contained"
                  onClick={fetchHistory}
                  disabled={!supplier || loading}
                  sx={{ ...btnBlackSx, minWidth: 140 }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Consultar"
                  )}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: COLORS.paper,
              border: `1px solid ${alpha("#000", 0.08)}`,
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 950 }}>
                Movimientos encontrados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {supplier
                  ? `${history.length} movimiento(s) encontrados`
                  : "Seleccione un proveedor para iniciar la consulta"}
              </Typography>
            </Box>

            <Divider />

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                p: 1.5,
                bgcolor: "#fff",
              }}
            >
              {!supplier ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Seleccione un proveedor para consultar su historial.
                </Alert>
              ) : loading ? (
                <Stack alignItems="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Cargando historial del proveedor...
                  </Typography>
                </Stack>
              ) : history.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Este proveedor no tiene movimientos registrados.
                </Alert>
              ) : (
                <Stack spacing={1.2}>
                  {history.map((entry, idx) => renderHistoryCard(entry, idx))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}