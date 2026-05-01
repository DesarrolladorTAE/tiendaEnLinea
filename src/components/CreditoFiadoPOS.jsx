import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import HistoryIcon from "@mui/icons-material/History";
import PaymentsIcon from "@mui/icons-material/Payments";
import axiosClient from "../config/axiosClientPOS";
import CreditHistoryModal from "./credito/CreditHistoryModal";
import CreditPaymentModal from "./credito/CreditPaymentModal";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function CreditoFiadoPOS({ cambiarVista, posLocationId }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const loadAccounts = async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await axiosClient.get("/pos/credit-accounts", {
        params: {
          page: nextPage,
          per_page: 15,
          search: search || undefined,
          only_active: 1,
        //   pos_location_id: posLocationId || undefined,
        },
      });

      const paginated = data?.accounts || {};

      setRows(Array.isArray(paginated?.data) ? paginated.data : []);
      setSummary(data?.summary || null);

      setMeta({
        current_page: paginated?.current_page || 1,
        last_page: paginated?.last_page || 1,
        total: paginated?.total || 0,
      });
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.message || "No se pudieron cargar las cuentas de fiado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadAccounts(1);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, posLocationId]);

  const openHistory = (account) => {
    setSelectedAccount(account);
    setHistoryOpen(true);
  };

  const openPayment = (account) => {
    setSelectedAccount(account);
    setPaymentOpen(true);
  };

  return (
    <Box p={{ xs: 1.5, sm: 3, md: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} mb={2}>
        <Button
          variant="outlined"
          color="success"
          startIcon={<DashboardIcon />}
          onClick={() => cambiarVista?.("menu")}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
        >
          Regresar al Panel
        </Button>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={() => loadAccounts(page)}
          disabled={loading}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
        >
          Actualizar
        </Button>
      </Stack>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CreditScoreIcon sx={{ fontSize: 36, color: "#b45309" }} />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: { xs: "1.25rem", sm: "1.6rem" } }}>
                Clientes con fiado activo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consulta cuentas autorizadas, saldo pendiente, historial y abonos.
              </Typography>
            </Box>
          </Stack>

          <TextField
            size="small"
            placeholder="Buscar cliente o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
          <Chip label={`Fiados activos: ${summary?.total_active ?? meta.total}`} color="warning" variant="outlined" />
          <Chip label={`Con deuda: ${summary?.total_with_debt ?? 0}`} color="error" variant="outlined" />
          <Chip label={`Saldo total: ${money(summary?.total_balance)}`} color="primary" variant="outlined" />
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 900 } }}>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Límite</TableCell>
                    <TableCell>Disponible</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        No hay clientes con fiado activo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 900 }}>{r.client_name}</TableCell>
                        <TableCell>{r.client_phone || "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 900, color: Number(r.current_balance) > 0 ? "#b45309" : "inherit" }}>
                          {money(r.current_balance)}
                        </TableCell>
                        <TableCell>{Number(r.credit_limit || 0) <= 0 ? "Ilimitado" : money(r.credit_limit)}</TableCell>
                        <TableCell>{Number(r.credit_limit || 0) <= 0 ? "Ilimitado" : money(r.available_credit)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.is_active ? "Activo" : "Inactivo"} color={r.is_active ? "success" : "default"} />
                          {r.is_overdue ? <Chip size="small" label="Vencido" color="error" sx={{ ml: 0.5 }} /> : null}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver historial">
                            <IconButton color="primary" onClick={() => openHistory(r)}>
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Registrar abono">
                            <span>
                              <IconButton
                                color="success"
                                onClick={() => openPayment(r)}
                                disabled={Number(r.current_balance || 0) <= 0}
                              >
                                <PaymentsIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {meta.last_page > 1 && (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <Pagination
                  count={meta.last_page}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                    loadAccounts(value);
                  }}
                  color="primary"
                />
              </Stack>
            )}
          </>
        )}
      </Paper>

      <CreditHistoryModal
        open={historyOpen}
        account={selectedAccount}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedAccount(null);
        }}
      />

      <CreditPaymentModal
        open={paymentOpen}
        account={selectedAccount}
        onClose={() => {
          setPaymentOpen(false);
          setSelectedAccount(null);
        }}
        onSaved={() => loadAccounts(page)}
      />
    </Box>
  );
}