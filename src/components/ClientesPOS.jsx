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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import axiosClient from "../config/axiosClientPOS";
import ClientesTable from "./clientes/ClientesTable";
import ClienteFormDialog from "./clientes/ClienteFormDialog";

export default function ClientesPOS({ cambiarVista }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.get("/clientes", {
        params: q ? { q } : undefined,
      });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(list);
    } catch (e) {
      setRows([]);
      setError("No se pudieron cargar los clientes. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // carga inicial + búsqueda con pequeño debounce
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setOpenForm(true);
  };

  const onSubmit = async (payload) => {
    try {
      if (editing) {
        await axiosClient.put(`/clientes/${editing.id}`, payload);
      } else {
        await axiosClient.post("/clientesnew", payload); // <- conservando tu endpoint
      }
      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError("No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.");
    }
  };

  const onDelete = (row) => setDeletingId(row.id);

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeletingBusy(true);
    try {
      await axiosClient.delete(`/clientes/${deletingId}`);
      setDeletingId(null);
      await load();
    } catch (e) {
      setError("No se pudo eliminar el cliente.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const cancelDelete = () => setDeletingId(null);

  const headerTitle = useMemo(() => "Clientes", []);

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      {/* Barra superior */}
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

      {/* Header estilizado con gradiente */}
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
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PeopleAltIcon
                sx={(t) => ({
                  fontSize: 32,
                  color: t.palette.mode === "dark" ? t.palette.primary.light : t.palette.primary.main,
                })}
              />
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
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
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
                      startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                      sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                    >
                      {loading ? "Cargando" : "Actualizar"}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreate}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                >
                  Nuevo cliente
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 2 }} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {rows.length} resultado{rows.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </Paper>

      {/* Mensaje de error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 1, sm: 2 },
          borderRadius: 3,
          boxShadow: (t) => `0 8px 24px ${t.palette.mode === "dark" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)"}`,
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <ClientesTable rows={rows} onEdit={onEdit} onDelete={onDelete} />
        )}
      </Paper>

      {/* Formulario crear/editar */}
      <ClienteFormDialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        initialValues={editing}
      />

      {/* Confirmación simple de borrado */}
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
                <Button onClick={cancelDelete} disabled={deletingBusy} sx={{ textTransform: "none" }}>
                  Cancelar
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={confirmDelete}
                  disabled={deletingBusy}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                >
                  {deletingBusy ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Eliminar"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
