import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Box,
  Pagination,
  InputAdornment,
  Stack,
  Chip,
  useMediaQuery,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Edit, Delete, Phone, Person, Search } from "@mui/icons-material";
import axios from "../../axiosConfig";
import { useLocation } from "react-router-dom";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

const BLUE_GRADIENT =
  "linear-gradient(90deg, #00A8FF 0%, #007BFF 60%, #0056D2 100%)";

const fieldSx = {
  "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    background: "rgba(2,6,23,0.02)",
    "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(0,123,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(0,123,255,0.60)" },
  },
};

// ✅ Extraer el mejor mensaje posible del backend (Laravel/Node/etc)
const getApiErrorMessage = (err) => {
  const data = err?.response?.data;

  // Laravel típico: { message: "...", errors: { field: [...] } }
  if (typeof data === "string") return data;

  if (data?.errors && typeof data.errors === "object") {
    const msgs = Object.values(data.errors)
      .flat()
      .filter(Boolean);
    if (msgs.length) return msgs.join("\n");
  }

  if (data?.message) return data.message;
  if (data?.error) return data.error;

  // Axios / network
  if (err?.message) return err.message;

  return "Ocurrió un error inesperado.";
};

const Contact = () => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [isSaving, setIsSaving] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("/contacts");
      setContacts(res.data || []);
      setFilteredContacts(res.data || []);
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: getApiErrorMessage(e) || "No se pudieron cargar los contactos",
        confirmButtonText: "Entendido",
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = contacts.filter(
      (c) =>
        String(c?.name || "").toLowerCase().includes(term) ||
        String(c?.phone || "").includes(term)
    );
    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [searchTerm, contacts]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;

    if (/^[0-9]*$/.test(value)) {
      const v = value.slice(0, 10);
      setPhone(v);
      setPhoneError("");

      if (v.length !== 10 && v.length > 0) setError("Son 10 dígitos");
      else setError("");
    } else {
      setPhoneError("Solo números telefónicos");
      setError("");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEditingIndex(null);
    setError("");
    setPhoneError("");
  };

  // ✅ Solo success/error (sin confirmación)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Escribe un nombre");
      await Swal.fire({
        icon: "warning",
        title: "Faltan datos",
        text: "Escribe el nombre del contacto.",
        confirmButtonText: "Ok",
      });
      return;
    }

    if (phone.length !== 10) {
      setError("Son 10 dígitos");
      await Swal.fire({
        icon: "warning",
        title: "Teléfono inválido",
        text: "El teléfono debe tener 10 dígitos.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const payload = { name: cleanName, phone };

    try {
      setIsSaving(true);

      if (editingIndex !== null) {
        // EDITAR
        const id = contacts[editingIndex]?.id;
        if (!id) throw new Error("No se encontró el id del contacto a editar");

        const res = await axios.put(`/contacts/${id}`, payload);

        setContacts((prev) => prev.map((c) => (c.id === id ? res.data : c)));
        resetForm();

        await Swal.fire({
          icon: "success",
          title: "Listo ✅",
          text: "Contacto editado exitosamente.",
          confirmButtonText: "Perfecto",
        });
      } else {
        // CREAR
        const res = await axios.post("/contacts", payload);
        setContacts((prev) => [...prev, res.data]);
        resetForm();

        await Swal.fire({
          icon: "success",
          title: "Listo ✅",
          text: "Contacto agregado correctamente.",
          confirmButtonText: "Perfecto",
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(err),
        confirmButtonText: "Ok",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredContacts, currentPage]);

  const handleEdit = async (index) => {
    const filteredIndex = (currentPage - 1) * itemsPerPage + index;
    const target = filteredContacts[filteredIndex];
    if (!target) return;

    setName(target.name || "");
    setPhone(String(target.phone || ""));

    const idx = contacts.findIndex((c) => c.id === target.id);
    setEditingIndex(idx);

    setError("");
    setPhoneError("");
  };

  // ✅ Confirmación SOLO aquí (eliminar)
  const handleDelete = async (index) => {
    const filteredIndex = (currentPage - 1) * itemsPerPage + index;
    const target = filteredContacts[filteredIndex];
    if (!target) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar contacto?",
      html: `<b>${target.name}</b><br/>${target.phone}`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`/contacts/${target.id}`);

      setContacts((prev) => prev.filter((c) => c.id !== target.id));

      // si estabas editando ese contacto, resetea
      if (editingIndex !== null && contacts[editingIndex]?.id === target.id) {
        resetForm();
      }

      await Swal.fire({
        icon: "success",
        title: "Eliminado 🗑️",
        text: "El contacto se eliminó correctamente.",
        confirmButtonText: "Ok",
      });
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(err),
        confirmButtonText: "Ok",
      });
    }
  };

  return (
    <LayoutOne headerTop="visible">
      <Breadcrumb
        pages={[
          { label: "Inicio", path: "/" },
          { label: "Mis Contactos", path: pathname },
        ]}
      />

      <Box
        sx={{
          background: "#fff",
          py: { xs: 2, md: 3 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 320px at 10% 10%, rgba(0,123,255,0.10), transparent 60%)," +
              "radial-gradient(680px 320px at 90% 20%, rgba(0,168,255,0.08), transparent 60%)," +
              "radial-gradient(800px 340px at 50% 95%, rgba(0,86,210,0.06), transparent 65%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 3 } }}>
          <Grid container spacing={2.5} justifyContent="center">
            {/* FORM */}
            <Grid
              item
              xs={12}
              md={5}
              lg={4}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                style={{ width: "100%" }}
              >
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    width: "100%",
                    maxWidth: 420,
                    border: "1px solid rgba(15,23,42,0.10)",
                    boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
                    position: "relative",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: -220,
                      pointerEvents: "none",
                      opacity: 0.7,
                      background:
                        "radial-gradient(closest-side at 25% 30%, rgba(0,123,255,0.10), transparent 60%)," +
                        "radial-gradient(closest-side at 75% 35%, rgba(0,168,255,0.08), transparent 60%)",
                      filter: "blur(2px)",
                    }}
                  />

                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.2 }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 950,
                            color: "#0b1220",
                            fontSize: 18,
                          }}
                        >
                          {editingIndex !== null
                            ? "Editar contacto"
                            : "Nuevo contacto"}
                        </Typography>
                        <Typography
                          sx={{
                            color: "rgba(11,18,32,0.62)",
                            fontSize: 13,
                          }}
                        >
                          Guarda contactos frecuentes.
                        </Typography>
                      </Box>

                      {editingIndex !== null && (
                        <Chip
                          label="Editando"
                          sx={{
                            fontWeight: 900,
                            borderRadius: 2,
                            background: "rgba(0,123,255,0.10)",
                            border: "1px solid rgba(0,123,255,0.22)",
                            color: "#0b5ed7",
                          }}
                        />
                      )}
                    </Stack>

                    <Stack alignItems="center" sx={{ mb: 1.6 }}>
                      <Avatar
                        sx={{
                          width: 86,
                          height: 86,
                          background: "rgba(0,123,255,0.10)",
                          border: "1px solid rgba(0,123,255,0.22)",
                          boxShadow: "0 18px 40px rgba(2,6,23,0.10)",
                        }}
                      >
                        <Person sx={{ fontSize: 44, color: "#0b5ed7" }} />
                      </Avatar>
                    </Stack>

                    <Box
                      component="form"
                      onSubmit={handleSubmit}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Nombre del contacto"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError("");
                        }}
                        required
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: "rgba(11,18,32,0.55)" }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                        inputProps={{ maxLength: 10 }}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone sx={{ color: "rgba(11,18,32,0.55)" }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {(phoneError || error) && (
                        <Typography
                          variant="caption"
                          color="error"
                          textAlign="center"
                          sx={{ fontWeight: 800, whiteSpace: "pre-line" }}
                        >
                          {phoneError || error}
                        </Typography>
                      )}

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.2}
                        sx={{ mt: 1 }}
                      >
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          disabled={isSaving}
                          sx={{
                            textTransform: "none",
                            fontWeight: 950,
                            borderRadius: 999,
                            py: 1.1,
                            background: BLUE_GRADIENT,
                            boxShadow: "0 14px 28px rgba(0, 86, 210, 0.18)",
                            "&:hover": {
                              filter: "brightness(1.05)",
                              transform: "translateY(-1px)",
                            },
                            "&.Mui-disabled": { opacity: 0.8, color: "#fff" },
                          }}
                        >
                          {isSaving
                            ? "Guardando..."
                            : editingIndex !== null
                            ? "Actualizar"
                            : "Agregar"}
                        </Button>

                        {editingIndex !== null && (
                          <Button
                            onClick={resetForm}
                            fullWidth
                            variant="outlined"
                            disabled={isSaving}
                            sx={{
                              textTransform: "none",
                              fontWeight: 950,
                              borderRadius: 999,
                              py: 1.1,
                              borderColor: "rgba(15,23,42,0.18)",
                              color: "#0b1220",
                              background: "rgba(2,6,23,0.02)",
                              "&:hover": { background: "rgba(2,6,23,0.05)" },
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            </Grid>

            {/* LIST */}
            <Grid item xs={12} md={7} lg={8}>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                style={{ width: "100%" }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.10)",
                    boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
                    mb: 2,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1.2}
                  >
                    <Box>
                      <Typography
                        sx={{ fontWeight: 950, color: "#0b1220", fontSize: 18 }}
                      >
                        📇 Mis contactos
                      </Typography>
                      <Typography
                        sx={{ color: "rgba(11,18,32,0.62)", fontSize: 13 }}
                      >
                        Busca por nombre o número.
                      </Typography>
                    </Box>

                    <Chip
                      label={`${filteredContacts.length} contacto(s)`}
                      sx={{
                        fontWeight: 950,
                        borderRadius: 2,
                        background: "rgba(2,6,23,0.06)",
                        border: "1px solid rgba(15,23,42,0.10)",
                        alignSelf: { xs: "flex-start", sm: "center" },
                      }}
                    />
                  </Stack>

                  <Box mt={1.5}>
                    <TextField
                      placeholder="Buscar contacto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          ...fieldSx["& .MuiOutlinedInput-root"],
                          borderRadius: 999,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: "rgba(11,18,32,0.55)" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Paper>

                <Box>
                  <AnimatePresence>
                    {paginatedContacts.length ? (
                      <Grid container spacing={2}>
                        {paginatedContacts.map((contact, index) => {
                          const isEditingThis =
                            editingIndex !== null &&
                            contacts[editingIndex]?.id === contact.id;

                          return (
                            <Grid item xs={12} sm={6} md={4} key={contact.id}>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.22 }}
                              >
                                <Card
                                  elevation={0}
                                  sx={{
                                    borderRadius: 3,
                                    border: isEditingThis
                                      ? "1px solid rgba(0,123,255,0.30)"
                                      : "1px solid rgba(15,23,42,0.10)",
                                    boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
                                    background:
                                      "linear-gradient(180deg, rgba(0,123,255,0.05), rgba(0,168,255,0.02))",
                                    transition:
                                      "transform .2s ease, box-shadow .2s ease",
                                    "&:hover": {
                                      transform: "translateY(-2px)",
                                      boxShadow: "0 16px 36px rgba(2,6,23,0.10)",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.4,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        bgcolor: "rgba(0,123,255,0.12)",
                                        color: "#0b5ed7",
                                        border:
                                          "1px solid rgba(0,123,255,0.20)",
                                        fontWeight: 900,
                                      }}
                                    >
                                      {String(contact?.name || "C")
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                    </Avatar>

                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                      <Typography
                                        sx={{
                                          fontWeight: 950,
                                          color: "#0b1220",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {contact.name}
                                      </Typography>

                                      <Stack
                                        direction="row"
                                        spacing={0.8}
                                        alignItems="center"
                                        sx={{ mt: 0.4 }}
                                      >
                                        <Phone
                                          fontSize="small"
                                          sx={{ color: "rgba(11,18,32,0.55)" }}
                                        />
                                        <Typography
                                          sx={{
                                            color: "rgba(11,18,32,0.72)",
                                            fontWeight: 800,
                                          }}
                                        >
                                          {contact.phone}
                                        </Typography>
                                      </Stack>

                                      {isEditingThis && (
                                        <Chip
                                          size="small"
                                          label="En edición"
                                          sx={{
                                            mt: 1,
                                            fontWeight: 900,
                                            borderRadius: 2,
                                            background: "rgba(0,123,255,0.10)",
                                            border:
                                              "1px solid rgba(0,123,255,0.22)",
                                            color: "#0b5ed7",
                                          }}
                                        />
                                      )}
                                    </Box>

                                    <Stack direction="row" spacing={0.4}>
                                      <IconButton
                                        onClick={() => handleEdit(index)}
                                        sx={{
                                          borderRadius: 2,
                                          border:
                                            "1px solid rgba(0,123,255,0.22)",
                                          background: "rgba(0,123,255,0.06)",
                                          "&:hover": {
                                            background: "rgba(0,123,255,0.12)",
                                          },
                                        }}
                                      >
                                        <Edit sx={{ color: "#0b5ed7" }} />
                                      </IconButton>

                                      <IconButton
                                        onClick={() => handleDelete(index)}
                                        sx={{
                                          borderRadius: 2,
                                          border:
                                            "1px solid rgba(244,67,54,0.25)",
                                          background: "rgba(244,67,54,0.06)",
                                          "&:hover": {
                                            background: "rgba(244,67,54,0.10)",
                                          },
                                        }}
                                      >
                                        <Delete sx={{ color: "#e53935" }} />
                                      </IconButton>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Box sx={{ py: 5, textAlign: "center" }}>
                        <Typography
                          sx={{ color: "rgba(11,18,32,0.70)", fontWeight: 800 }}
                        >
                          No hay contactos 😔
                        </Typography>
                      </Box>
                    )}
                  </AnimatePresence>

                  {filteredContacts.length > itemsPerPage && (
                    <Box mt={3} display="flex" justifyContent="center">
                      <Pagination
                        count={Math.ceil(filteredContacts.length / itemsPerPage)}
                        page={currentPage}
                        onChange={(e, value) => setCurrentPage(value)}
                        color="primary"
                        sx={{
                          "& .MuiPaginationItem-root": {
                            borderRadius: 2,
                            fontWeight: 900,
                          },
                          "& .Mui-selected": {
                            background: BLUE_GRADIENT,
                            color: "#fff",
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </LayoutOne>
  );
};

export default withAuth(Contact);