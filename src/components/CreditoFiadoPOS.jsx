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
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import HistoryIcon from "@mui/icons-material/History";
import PaymentsIcon from "@mui/icons-material/Payments";

import axiosClient from "../config/axiosClientPOS";
import CreditHistoryModal from "./credito/CreditHistoryModal";
import CreditPaymentModal from "./credito/CreditPaymentModal";
import { posHeaderButton, posHeaderChip, posHeaderInput, posMobileCard, posSectionHeader, posSectionIcon, posSectionTitle, posTableHeader } from "./POS/posSectionStyles";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function CreditoFiadoPOS({ posLocationId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
          // pos_location_id: posLocationId || undefined,
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
      setError(
        e?.response?.data?.message ||
          "No se pudieron cargar las cuentas de fiado."
      );
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

  const renderActions = (r, mobile = false) => (
    <Stack
      direction={mobile ? "column" : "row"}
      spacing={1}
      justifyContent="center"
      alignItems="center"
    >
      <Button
        fullWidth={mobile}
        variant="outlined"
        color="primary"
        startIcon={<HistoryIcon />}
        onClick={() => openHistory(r)}
        sx={{
          textTransform: "none",
          fontWeight: 900,
          borderRadius: 2,
        }}
      >
        Historial
      </Button>

      <Button
        fullWidth={mobile}
        variant="contained"
        color="success"
        startIcon={<PaymentsIcon />}
        onClick={() => openPayment(r)}
        disabled={Number(r.current_balance || 0) <= 0}
        sx={{
          textTransform: "none",
          fontWeight: 900,
          borderRadius: 2,
        }}
      >
        Abonar
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ minWidth: 0, maxWidth: 1500, mx: "auto" }}>
      <Paper elevation={0} sx={posSectionHeader}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
            <Box sx={posSectionIcon}><CreditScoreIcon /></Box>
            <Box>
              <Typography component="h2" sx={posSectionTitle}>Créditos y fiados</Typography>
              <Typography variant="body2" sx={{ color: "#c7cbd1 !important", mt: 0.5 }}>Consulta saldos, historial y abonos.</Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ width: { md: 420 }, minWidth: 0 }}>
          <TextField
            size="small"
            placeholder="Buscar cliente o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ ...posHeaderInput, minWidth: 0, flex: 1 }}
            inputProps={{ "aria-label": "Buscar cliente o teléfono" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <RefreshIcon />}
            onClick={() => loadAccounts(page)} disabled={loading} sx={posHeaderButton}>Actualizar</Button>
          </Stack>
        </Stack>

        <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" sx={{ mt: 2, pt: 2, borderTop: "1px solid #434953" }}>
          <Chip
            label={`Créditos activos: ${summary?.total_active ?? meta.total}`}
            sx={posHeaderChip}
          />
          <Chip
            label={`Con deuda: ${summary?.total_with_debt ?? 0}`}
            sx={{ ...posHeaderChip, bgcolor: "#472c30", color: "#ffb4ab" }}
          />
          <Chip
            label={`Saldo total: ${money(summary?.total_balance)}`}
            sx={{ ...posHeaderChip, bgcolor: "#293c4b", color: "#c6e5ff" }}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              <Stack spacing={1.5} sx={{ p: 1.5 }}>
                {rows.length === 0 ? (
                  <Typography
                    align="center"
                    color="text.secondary"
                    sx={{ py: 4 }}
                  >
                    No hay clientes con crédito activo.
                  </Typography>
                ) : (
                  rows.map((r) => {
                    const hasDebt = Number(r.current_balance || 0) > 0;
                    const unlimited = Number(r.credit_limit || 0) <= 0;

                    return (
                      <Paper
                        key={r.id}
                        variant="outlined"
                        sx={{
                          ...posMobileCard,
                          p: 1.8,
                          borderColor: hasDebt ? "#fed7aa" : "divider",
                          bgcolor: hasDebt ? "#fff7ed" : "background.paper",
                        }}
                      >
                        <Stack spacing={1.3}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 950 }}>
                                {r.client_name}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Tel: {r.client_phone || "—"}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={0.5}>
                              <Chip
                                size="small"
                                label={r.is_active ? "Activo" : "Inactivo"}
                                color={r.is_active ? "success" : "default"}
                                sx={{ fontWeight: 800 }}
                              />

                              {r.is_overdue ? (
                                <Chip
                                  size="small"
                                  label="Vencido"
                                  color="error"
                                  sx={{ fontWeight: 800 }}
                                />
                              ) : null}
                            </Stack>
                          </Stack>

                          <Divider />

                          <Stack direction="row" gap={1} useFlexGap flexWrap="wrap">
                            <Chip
                              label={`Saldo: ${money(r.current_balance)}`}
                              color={hasDebt ? "warning" : "default"}
                              sx={{ fontWeight: 900 }}
                            />

                            <Chip
                              label={`Límite: ${
                                unlimited ? "Ilimitado" : money(r.credit_limit)
                              }`}
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />

                            <Chip
                              label={`Disponible: ${
                                unlimited
                                  ? "Ilimitado"
                                  : money(r.available_credit)
                              }`}
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>

                          {renderActions(r, true)}
                        </Stack>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={posTableHeader}>
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
                          No hay clientes con crédito activo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 900 }}>
                            {r.client_name}
                          </TableCell>

                          <TableCell>{r.client_phone || "—"}</TableCell>

                          <TableCell
                            sx={{
                              fontWeight: 900,
                              color:
                                Number(r.current_balance) > 0
                                  ? "#b45309"
                                  : "inherit",
                            }}
                          >
                            {money(r.current_balance)}
                          </TableCell>

                          <TableCell>
                            {Number(r.credit_limit || 0) <= 0
                              ? "Ilimitado"
                              : money(r.credit_limit)}
                          </TableCell>

                          <TableCell>
                            {Number(r.credit_limit || 0) <= 0
                              ? "Ilimitado"
                              : money(r.available_credit)}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={r.is_active ? "Activo" : "Inactivo"}
                              color={r.is_active ? "success" : "default"}
                            />
                            {r.is_overdue ? (
                              <Chip
                                size="small"
                                label="Vencido"
                                color="error"
                                sx={{ ml: 0.5 }}
                              />
                            ) : null}
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip title="Ver historial">
                              <IconButton
                                color="primary"
                                onClick={() => openHistory(r)}
                              >
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
            )}

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
