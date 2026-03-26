// src/components/ClientesPOS.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
  Alert,
  Chip,
  Snackbar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import axiosClient from "../config/axiosClientPOS";
import ClientesTable from "./clientes/ClientesTable";
import ClienteFormDialog from "./clientes/ClienteFormDialog";
import ClienteHistoryModal from "./clientes/ClienteHistoryModal";
// import GateTaeconta from "./auth/GateTaeconta";
import useClientesGate from "../hooks/useClientesGate";

const PLAN_LABELS = {
  1: "Demo",
  2: "Negocio",
  3: "Profesional",
  4: "Avanzado",
};

export default function ClientesPOS({ cambiarVista }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    planId,
    canViewHistory,
    canCreate,
    canEdit,
    canDelete,
    clientsLimit,
    reasonClientsBlocked,
    openPlanesModal,
  } = useClientesGate(rows.length);

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.get("/clientes", {
        params: q ? { q } : undefined,
      });

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setRows(list);
    } catch (e) {
      setRows([]);
      setError("No se pudieron cargar los clientes. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onCreate = () => {
    if (!canCreate) {
      showSnackbar(
        reasonClientsBlocked || "Tu plan actual no permite registrar clientes.",
        "warning"
      );
      return;
    }

    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (row) => {
    if (!canEdit) {
      showSnackbar(
        reasonClientsBlocked || "Tu plan actual no permite editar clientes.",
        "warning"
      );
      return;
    }

    setEditing(row);
    setOpenForm(true);
  };

  const onViewHistory = (row) => {
    if (!canViewHistory) return;
    setHistoryClient(row);
    setHistoryOpen(true);
  };

  const onSubmit = async (payload) => {
    try {
      if (editing) {
        await axiosClient.put(`/clientes/${editing.id}`, payload);
        showSnackbar("✅ Cliente actualizado");
      } else {
        await axiosClient.post("/clientesnew", payload);
        showSnackbar("✅ Cliente creado");
      }

      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      const backendMessage =
        e?.response?.data?.message ||
        "No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.";

      setError(backendMessage);
      throw e;
    }
  };

  const onDelete = (row) => {
    if (!canDelete) {
      showSnackbar(
        reasonClientsBlocked || "Tu plan actual no permite eliminar clientes.",
        "warning"
      );
      return;
    }

    setDeletingId(row.id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    setDeletingBusy(true);
    try {
      await axiosClient.delete(`/clientes/${deletingId}`);
      setDeletingId(null);
      showSnackbar("🗑️ Cliente eliminado");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo eliminar el cliente.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const cancelDelete = () => setDeletingId(null);

  const headerTitle = useMemo(() => "Clientes", []);
  const planName = PLAN_LABELS[planId] || "Sin definir";

  const planMessage = useMemo(() => {
    if (planId === 2) {
      return "Tu plan Negocio puede visualizar clientes, pero no permite registrarlos.";
    }
    if (planId === 3) {
      return `Plan Profesional: ${rows.length || 0}/50 clientes registrados.`;
    }
    if (planId === 1) {
      return "Plan Demo: puedes registrar clientes sin límite.";
    }
    if (planId === 4) {
      return "Plan Avanzado: clientes ilimitados.";
    }
    return "Consulta y administra tus clientes.";
  }, [planId, rows.length]);

  return (
    <Box p={{ xs: 1.5, sm: 3, md: 4 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="success"
          startIcon={<DashboardIcon />}
          onClick={() => cambiarVista?.("menu")}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
        >
          Regresar al Panel
        </Button>
      </Box>

      {/* <GateTaeconta> */}
        <Paper
          elevation={0}
          sx={(t) => ({
            p: { xs: 2, sm: 3 },
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${t.palette.divider}`,
            background:
              t.palette.mode === "dark"
                ? alpha(t.palette.primary.main, 0.08)
                : alpha(t.palette.primary.main, 0.06),
          })}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} lg={6}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PeopleAltIcon
                  sx={(t) => ({
                    fontSize: 32,
                    color:
                      t.palette.mode === "dark"
                        ? t.palette.primary.light
                        : t.palette.primary.main,
                  })}
                />
                <Box>
                  <Typography
                    component="h2"
                    sx={(t) => ({
                      m: 0,
                      fontWeight: 900,
                      letterSpacing: 0.2,
                      fontSize: { xs: "1.2rem", sm: "1.5rem" },
                      background:
                        t.palette.mode === "dark"
                          ? "linear-gradient(90deg, #ffffff 0%, #9fd1ff 100%)"
                          : "linear-gradient(90deg, #111827 0%, #2563eb 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    })}
                  >
                    {headerTitle}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mt: 0.5 }}
                  >
                    <Chip
                      size="small"
                      icon={<Groups2OutlinedIcon />}
                      label={`Plan: ${planName}`}
                      color="primary"
                      variant="outlined"
                    />

                    {typeof clientsLimit === "number" ? (
                      <Chip
                        size="small"
                        label={`${rows.length}/${clientsLimit}`}
                        color={canCreate ? "success" : "warning"}
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        size="small"
                        label={`${rows.length} clientes`}
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  {Boolean(planId) && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      Plan actual: <b>{planId}</b>{" "}
                      {planId === 2
                        ? "· Solo consulta e historial ✅"
                        : planId === 3
                        ? "· Límite de 50 clientes ✅"
                        : "· Clientes disponibles ✅"}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                justifyContent="flex-end"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  size="small"
                  placeholder="Buscar cliente (Nombre, RFC, email, teléfono)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: q ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setQ("")}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{ minWidth: { xs: "100%", sm: 300 } }}
                />

                <Stack direction="row" spacing={1}>
                  <Tooltip title="Recargar">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={load}
                        disabled={loading}
                        startIcon={
                          loading ? <CircularProgress size={16} /> : <RefreshIcon />
                        }
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          fontWeight: 700,
                        }}
                      >
                        {loading ? "Cargando" : "Actualizar"}
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      canCreate
                        ? "Registrar cliente"
                        : reasonClientsBlocked ||
                          "Tu plan actual no permite registrar clientes"
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        startIcon={
                          canCreate ? <AddIcon /> : <LockOutlinedIcon />
                        }
                        onClick={onCreate}
                        disabled={!canCreate}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          fontWeight: 800,
                        }}
                      >
                        Nuevo cliente
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ pt: 1.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              {rows.length} resultado{rows.length === 1 ? "" : "s"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {planMessage}
            </Typography>
          </Stack>
        </Paper>

        {reasonClientsBlocked ? (
          <Alert
            severity={planId === 3 ? "warning" : "info"}
            sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={openPlanesModal}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Ver planes
              </Button>
            }
          >
            <b>Plan {planId || "?"}</b>: {reasonClientsBlocked}
          </Alert>
        ) : null}

        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<VisibilityOutlinedIcon fontSize="inherit" />}
        >
          Puedes consultar el historial de clientes desde cualquier plan.
        </Alert>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={4}
          sx={{
            p: { xs: 1, sm: 2 },
            borderRadius: 3,
            boxShadow: (t) =>
              `0 8px 24px ${
                t.palette.mode === "dark"
                  ? "rgba(0,0,0,.4)"
                  : "rgba(0,0,0,.08)"
              }`,
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <ClientesTable
              rows={rows}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
              canEdit={canEdit}
              canDelete={canDelete}
              canViewHistory={canViewHistory}
            />
          )}
        </Paper>

        <ClienteFormDialog
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
          initialValues={editing}
        />

        <ClienteHistoryModal
          open={historyOpen}
          onClose={() => {
            setHistoryOpen(false);
            setHistoryClient(null);
          }}
          cliente={historyClient}
        />

        {Boolean(deletingId) && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
              p: 2,
            }}
          >
            <Paper sx={{ p: 3, borderRadius: 3, width: "100%", maxWidth: 420 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <DeleteOutlineIcon color="error" sx={{ fontSize: 32 }} />
                <Typography variant="h6">¿Eliminar este cliente?</Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta acción no se puede deshacer.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                  <Button
                    onClick={cancelDelete}
                    disabled={deletingBusy}
                    sx={{ textTransform: "none" }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={confirmDelete}
                    disabled={deletingBusy}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 800,
                    }}
                  >
                    {deletingBusy ? (
                      <CircularProgress size={18} sx={{ color: "white" }} />
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={2800}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      {/* </GateTaeconta> */}
    </Box>
  );
}