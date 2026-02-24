import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  Alert,
  Avatar,
  alpha,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocalPhoneRoundedIcon from "@mui/icons-material/LocalPhoneRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";

import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import UserModal from "../../components/admin/UserModal";

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const cardAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const rowAnim = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

const iconBtnMotion = {
  whileHover: { scale: 1.08 },
  whileTap: { scale: 0.96 },
};

const ROLES = [
  { value: "todos", label: "Todos" },
  { value: "usuario", label: "Usuario" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "SuperAdmin" },
];

function safeStr(v) {
  return (v ?? "").toString().trim();
}

function roleColor(role) {
  const r = safeStr(role).toLowerCase();
  if (r === "superadmin") return "secondary";
  if (r === "admin") return "primary";
  return "default";
}

const Users = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // ✅ md+ = tabla
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm")); // ✅ móvil

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState("crear");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // filters + sort + pagination
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("name"); // name | email | role | ganancias
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const obtenerUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/usuarios");
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setUsuarios([]);
      toast.error("No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    obtenerUsuarios();
  }, [obtenerUsuarios]);

  const abrirModalCrear = () => {
    setModo("crear");
    setUsuarioSeleccionado(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (usuario) => {
    setModo("editar");
    setUsuarioSeleccionado(usuario);
    setModalOpen(true);
  };

  const cerrarModal = () => setModalOpen(false);

  const handleGuardarUsuario = async (formData) => {
    try {
      if (modo === "crear") {
        await axios.post("/admin/usuarios", formData);
        toast.success("✅ Usuario creado correctamente.");
      } else {
        await axios.put(`/admin/usuarios/${formData.id}`, formData);
        toast.success("✅ Usuario actualizado correctamente.");
      }
      cerrarModal();
      obtenerUsuarios();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Error al guardar el usuario.";
      toast.error(`❌ ${msg}`);
      throw error; // para que el modal quite loading
    }
  };

  const pedirEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setConfirmOpen(true);
  };

  const cancelarEliminar = () => {
    setConfirmOpen(false);
    setUsuarioAEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!usuarioAEliminar?.id) return;
    try {
      setDeleting(true);
      await axios.delete(`/admin/usuarios/${usuarioAEliminar.id}`);
      toast.success("🗑️ Usuario eliminado correctamente.");
      cancelarEliminar();
      obtenerUsuarios();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo eliminar el usuario.";
      toast.error(`❌ ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    let list = [...usuarios];

    if (roleFilter !== "todos") {
      list = list.filter((u) => safeStr(u.role).toLowerCase() === roleFilter);
    }

    if (query) {
      list = list.filter((u) => {
        const name = safeStr(u.name).toLowerCase();
        const apellidos = safeStr(u.apellidos).toLowerCase();
        const email = safeStr(u.email).toLowerCase();
        const phone = safeStr(u.phone).toLowerCase();
        const role = safeStr(u.role).toLowerCase();
        return (
          name.includes(query) ||
          apellidos.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          role.includes(query)
        );
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];

      if (sortBy === "ganancias") {
        const an = Number(av ?? 0);
        const bn = Number(bv ?? 0);
        return (an - bn) * dir;
      }

      const as = safeStr(av).toLowerCase();
      const bs = safeStr(bv).toLowerCase();
      return as.localeCompare(bs) * dir;
    });

    return list;
  }, [usuarios, q, roleFilter, sortBy, sortDir]);

  // ✅ si cambian filtros y la página quedó “fuera”, regresamos a la 0
  useEffect(() => {
    setPage(0);
  }, [q, roleFilter, sortBy, sortDir]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const resetFilters = () => {
    setQ("");
    setRoleFilter("todos");
    setSortBy("name");
    setSortDir("asc");
    setPage(0);
    toast.info("Filtros reiniciados.");
  };

  const totalUsuarios = usuarios.length;
  const totalFiltrados = filtered.length;

  const stopAutoFill = {
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: "false",
  };

  return (
    <Box sx={{ p: { xs: 1.1, md: 2 } }}>
      {/* Header premium */}
      <MotionPaper
        variants={cardAnim}
        initial="hidden"
        animate="show"
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 1.5, md: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          background: `
            radial-gradient(1200px 500px at 15% 0%, ${alpha(
              theme.palette.primary.main,
              0.18
            )} 0%, transparent 60%),
            radial-gradient(900px 400px at 85% 10%, ${alpha(
              theme.palette.secondary?.main || theme.palette.primary.main,
              0.14
            )} 0%, transparent 55%),
            ${theme.palette.background.paper}
          `,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.5}>
            <Typography
              variant={isMdUp ? "h5" : "h6"}
              sx={{ fontWeight: 900 }}
            >
              Gestión de Usuarios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra usuarios, roles y ganancias con filtros, orden y
              paginación.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <Chip
                size="small"
                icon={<PersonRoundedIcon />}
                label={`Total: ${totalUsuarios}`}
                sx={{ borderRadius: 999 }}
              />
              <Chip
                size="small"
                label={`Mostrando: ${totalFiltrados}`}
                sx={{
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }}
              />
            </Stack>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={abrirModalCrear}
            sx={{
              borderRadius: 999,
              px: 2,
              py: 1,
              boxShadow: `0 10px 30px ${alpha(
                theme.palette.primary.main,
                0.28
              )}`,
              textTransform: "none",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            Crear Usuario
          </Button>
        </Stack>

        <Divider sx={{ my: 2, opacity: 0.7 }} />

        {/* Controls */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, rol…"
            fullWidth
            autoComplete="off"
            inputProps={stopAutoFill}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 999 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: { xs: "100%", md: 200 } }}>
            <InputLabel>Rol</InputLabel>
            <Select
              label="Rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterAltRoundedIcon />
                </InputAdornment>
              }
              sx={{ borderRadius: 999 }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: { xs: "100%", md: 220 } }}>
            <InputLabel>Orden</InputLabel>
            <Select
              label="Orden"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ borderRadius: 999 }}
            >
              <MenuItem value="name">Nombre</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Rol</MenuItem>
              <MenuItem value="ganancias">Ganancia (%)</MenuItem>
            </Select>
          </FormControl>

          <Tooltip
            title={`Dirección: ${
              sortDir === "asc" ? "Ascendente" : "Descendente"
            }`}
          >
            <IconButton
              component={motion.button}
              {...iconBtnMotion}
              onClick={() => setSortDir((p) => (p === "asc" ? "desc" : "asc"))}
              sx={{
                borderRadius: 999,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            >
              {sortDir === "asc" ? (
                <ArrowUpwardRoundedIcon />
              ) : (
                <ArrowDownwardRoundedIcon />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reiniciar filtros">
            <IconButton
              component={motion.button}
              {...iconBtnMotion}
              onClick={resetFilters}
              sx={{
                borderRadius: 999,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            >
              <RestartAltRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </MotionPaper>

      {/* Content */}
      <MotionPaper
        variants={cardAnim}
        initial="hidden"
        animate="show"
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton
              variant="rounded"
              height={52}
              sx={{ borderRadius: 2, mb: 1.2 }}
            />
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={isSmDown ? 116 : 44}
                sx={{ borderRadius: 2, mb: 1 }}
              />
            ))}
          </Box>
        ) : totalFiltrados === 0 ? (
          <Box sx={{ p: 2 }}>
            <Alert
              variant="outlined"
              severity="info"
              sx={{
                borderRadius: 3,
                "& .MuiAlert-message": { fontWeight: 600 },
              }}
            >
              No hay usuarios que coincidan con tus filtros.
            </Alert>
          </Box>
        ) : (
          <>
            {/* ✅ MOBILE = CARDS */}
            {!isMdUp ? (
              <Box sx={{ p: 1.2 }}>
                <Stack spacing={1.1}>
                  {paged.map((user) => {
                    const initials = safeStr(user.name)
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((x) => x[0]?.toUpperCase())
                      .join("");

                    const r = safeStr(user.role) || "usuario";
                    const ganancias = Number(user.ganancias ?? 0);

                    return (
                      <MotionCard
                        key={user.id}
                        variants={rowAnim}
                        initial="hidden"
                        animate="show"
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: `1px solid ${alpha(
                            theme.palette.divider,
                            0.8
                          )}`,
                          overflow: "hidden",
                          background: `
                            radial-gradient(700px 220px at 20% 0%, ${alpha(
                              theme.palette.primary.main,
                              0.12
                            )} 0%, transparent 55%),
                            ${theme.palette.background.paper}
                          `,
                        }}
                      >
                        <CardContent sx={{ p: 1.4 }}>
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                                  color: theme.palette.primary.main,
                                  fontWeight: 900,
                                }}
                              >
                                {initials || "U"}
                              </Avatar>

                              <Box>
                                <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                  {user.name} {user.apellidos ? user.apellidos : ""}
                                </Typography>
                                <Stack direction="row" spacing={0.8} sx={{ mt: 0.6 }}>
                                  <Chip
                                    size="small"
                                    color={roleColor(r)}
                                    label={r}
                                    sx={{
                                      fontWeight: 900,
                                      borderRadius: 999,
                                      textTransform: "capitalize",
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    icon={<PercentRoundedIcon />}
                                    label={`${ganancias.toFixed(1)}%`}
                                    sx={{
                                      borderRadius: 999,
                                      fontWeight: 900,
                                      bgcolor: alpha(theme.palette.success.main, 0.10),
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Editar">
                                <IconButton
                                  component={motion.button}
                                  {...iconBtnMotion}
                                  color="primary"
                                  onClick={() => abrirModalEditar(user)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(
                                      theme.palette.primary.main,
                                      0.2
                                    )}`,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                  }}
                                >
                                  <EditRoundedIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  component={motion.button}
                                  {...iconBtnMotion}
                                  color="error"
                                  onClick={() => pedirEliminar(user)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(
                                      theme.palette.error.main,
                                      0.22
                                    )}`,
                                    bgcolor: alpha(theme.palette.error.main, 0.06),
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>

                          <Divider sx={{ my: 1.1 }} />

                          <Stack spacing={0.9}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <EmailRoundedIcon
                                fontSize="small"
                                sx={{ color: "text.secondary" }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {user.email || "—"}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocalPhoneRoundedIcon
                                fontSize="small"
                                sx={{ color: "text.secondary" }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {user.phone || "—"}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <ShieldRoundedIcon
                                fontSize="small"
                                sx={{ color: "text.secondary" }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                ID: <b>{user.id}</b>
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </MotionCard>
                    );
                  })}
                </Stack>
              </Box>
            ) : (
              /* ✅ DESKTOP = TABLE */
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": {
                            fontWeight: 900,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderBottom: `1px solid ${alpha(
                              theme.palette.divider,
                              0.9
                            )}`,
                          },
                        }}
                      >
                        <TableCell>Usuario</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell>Ganancia (%)</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {paged.map((user) => {
                        const initials = safeStr(user.name)
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((x) => x[0]?.toUpperCase())
                          .join("");

                        const r = safeStr(user.role) || "usuario";
                        const ganancias = Number(user.ganancias ?? 0);

                        return (
                          <TableRow
                            key={user.id}
                            component={motion.tr}
                            variants={rowAnim}
                            initial="hidden"
                            animate="show"
                            hover
                            sx={{
                              "& td": {
                                borderBottom: `1px solid ${alpha(
                                  theme.palette.divider,
                                  0.65
                                )}`,
                              },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1.2} alignItems="center">
                                <Avatar
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                                    color: theme.palette.primary.main,
                                    fontWeight: 900,
                                  }}
                                >
                                  {initials || "U"}
                                </Avatar>

                                <Box>
                                  <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                    {user.name} {user.apellidos ? user.apellidos : ""}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Tel: {user.phone ? user.phone : "—"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell sx={{ fontWeight: 600 }}>
                              {user.email}
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                color={roleColor(r)}
                                label={r}
                                sx={{
                                  fontWeight: 900,
                                  borderRadius: 999,
                                  textTransform: "capitalize",
                                }}
                              />
                            </TableCell>

                            <TableCell sx={{ fontWeight: 900 }}>
                              <Chip
                                size="small"
                                label={`${ganancias.toFixed(1)}%`}
                                sx={{
                                  borderRadius: 999,
                                  fontWeight: 900,
                                  bgcolor: alpha(theme.palette.success.main, 0.10),
                                }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="Editar">
                                  <IconButton
                                    component={motion.button}
                                    {...iconBtnMotion}
                                    color="primary"
                                    onClick={() => abrirModalEditar(user)}
                                    sx={{
                                      borderRadius: 2,
                                      border: `1px solid ${alpha(
                                        theme.palette.primary.main,
                                        0.2
                                      )}`,
                                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                                    }}
                                  >
                                    <EditRoundedIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Eliminar">
                                  <IconButton
                                    component={motion.button}
                                    {...iconBtnMotion}
                                    color="error"
                                    onClick={() => pedirEliminar(user)}
                                    sx={{
                                      borderRadius: 2,
                                      border: `1px solid ${alpha(
                                        theme.palette.error.main,
                                        0.22
                                      )}`,
                                      bgcolor: alpha(theme.palette.error.main, 0.06),
                                    }}
                                  >
                                    <DeleteOutlineRoundedIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Divider />

            {/* ✅ PAGINACIÓN (para ambos) */}
            <TablePagination
              component="div"
              count={totalFiltrados}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[6, 8, 12, 20]}
              labelRowsPerPage="Filas"
            />
          </>
        )}
      </MotionPaper>

      {/* Modal Create/Edit */}
      <UserModal
        open={modalOpen}
        handleClose={cerrarModal}
        handleSubmit={handleGuardarUsuario}
        modo={modo}
        initialData={usuarioSeleccionado}
      />

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={cancelarEliminar} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 0.5 }}>
            ¿Seguro que deseas eliminar a{" "}
            <b>
              {usuarioAEliminar?.name} {usuarioAEliminar?.apellidos || ""}
            </b>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelarEliminar} sx={{ borderRadius: 999, textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarEliminar}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;