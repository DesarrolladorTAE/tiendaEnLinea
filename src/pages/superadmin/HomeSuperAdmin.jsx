import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Box,
  CssBaseline,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Modal,
} from "@mui/material";

const drawerWidth = 240;

export default function HomeSuperAdmin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [admin, setAdmin] = useState(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const editableFieldSx = { minWidth: 150, fontSize: "0.9rem" };

  const token = sessionStorage.getItem("SUPERADMIN_TOKEN");

  const axiosSuperadmin = axios.create({
    baseURL: "https://mitiendaenlineamx.com.mx/api/",
    headers: {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  useEffect(() => {
    if (!token) {
      setOpenLogin(true);
      setLoading(false);
      return;
    }

    axiosSuperadmin
      .get("/admin/me")
      .then((res) => {
        setAdmin(res.data);
        fetchDashboardData(); // Cargar stats y usuarios después de autenticar
      })
      .catch(() => {
        setOpenLogin(true);
        sessionStorage.removeItem("SUPERADMIN_TOKEN");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchDashboardData = () => {
    axiosSuperadmin
      .get("/admin/overview")
      .then((res) => {
        setStats(res.data.stats);
        setUsers(res.data.ultimos_usuarios);
      })
      .catch((err) => {
        console.error("Error al cargar dashboard", err);
      });
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post("https://mitiendaenlineamx.com.mx/api/admin/login", {
        email,
        password,
      });

      const token = res.data.token;
      sessionStorage.setItem("SUPERADMIN_TOKEN", token);

      const meRes = await axios.get("https://mitiendaenlineamx.com.mx/api/admin/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAdmin(meRes.data);
      setOpenLogin(false);
      fetchDashboardData();
    } catch {
      alert("Credenciales inválidas");
    }
  };

  const handleSave = async (i) => {
    const token = sessionStorage.getItem("SUPERADMIN_TOKEN");
    const user = users[i];
    const payload = {
      email: editedRow.email,
      phone_number: editedRow.phone_number,
      plan_expiration: editedRow.plan_expiration,
    };

    try {
      await axios.put(`https://mitiendaenlineamx.com.mx/api/admin/store/${user.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUsers = [...users];
      updatedUsers[i] = { ...updatedUsers[i], ...editedRow };
      setUsers(updatedUsers);
      setEditIndex(null);
    } catch (err) {
      console.error("Error al guardar", err);
      alert("Error al guardar los cambios");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <Modal open={openLogin}>
        <Box
          sx={{
            width: 400,
            bgcolor: "background.paper",
            p: 4,
            mx: "auto",
            my: "20vh",
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" mb={2}>
            Panel de Admin
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button fullWidth sx={{ mt: 2 }} variant="contained" onClick={handleLogin}>
            Ingresar
          </Button>
        </Box>
      </Modal>

      {admin && (
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" noWrap component="div">
                Bienvenido al Panel, <strong>{admin?.name}</strong>
              </Typography>

              <Button
                color="inherit"
                onClick={() => {
                  sessionStorage.removeItem("SUPERADMIN_TOKEN");
                  window.location.reload(); // o redirige manualmente si prefieres
                }}
              >
                Cerrar sesión
              </Button>
            </Toolbar>
          </AppBar>

          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: "auto" }}>
              <List>
                {["Usuarios"].map((text, index) => (
                  <ListItem disablePadding key={index}>
                    <ListItemButton>
                      <ListItemText primary={text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>

          <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
            {/* <Toolbar />
            {stats && (
              <Grid container spacing={2}>
                {[
                  { title: "Usuarios", value: stats.usuarios },
                  { title: "Ventas", value: `$${stats.ventas.toLocaleString()}` },
                  { title: "Visitas", value: stats.visitas },
                  { title: "Pedidos", value: stats.pedidos },
                ].map((stat) => (
                  <Grid item xs={12} sm={6} md={3} key={stat.title}>
                    <Card elevation={3}>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h5">{stat.value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )} */}

            {/* Tabla de usuarios */}
            <Box mt={5}>
              <Typography variant="h6" gutterBottom>
                Últimos usuarios registrados
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Fecha Plan</TableCell>
                      <TableCell>Fecha Demo</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((row, i) => {
                      const isEditing = editIndex === i;
                      return (
                        <TableRow key={`${row.email}-${i}`}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                variant="standard"
                                value={editedRow.email}
                                onChange={(e) =>
                                  setEditedRow({ ...editedRow, email: e.target.value })
                                }
                              />
                            ) : (
                              row.email
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                variant="standard"
                                value={editedRow.phone_number}
                                onChange={(e) =>
                                  setEditedRow({ ...editedRow, phone_number: e.target.value })
                                }
                              />
                            ) : (
                              row.phone_number || "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                type="date"
                                variant="standard"
                                value={editedRow.plan_expiration}
                                onChange={(e) =>
                                  setEditedRow({ ...editedRow, plan_expiration: e.target.value })
                                }
                              />
                            ) : (
                              row.plan_expiration || "—"
                            )}
                          </TableCell>
                          <TableCell>{row.trial_ends_at || "—"}</TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                color:
                                  row.status === "Plan"
                                    ? "green"
                                    : row.status === "Demo"
                                    ? "orange"
                                    : "red",
                              }}
                            >
                              {row.status}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <>
                                <Button size="small" onClick={() => handleSave(i)}>
                                  Guardar
                                </Button>
                                <Button
                                  size="small"
                                  color="secondary"
                                  onClick={() => setEditIndex(null)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="small"
                                onClick={() => {
                                  setEditIndex(i);
                                  setEditedRow(row);
                                }}
                              >
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
