import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Stack
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "../../axiosConfig";
import UserModal from "../../components/admin/UserModal";
import { toast } from "react-toastify";


const Users = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState("crear");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    obtenerUsuarios(); // ✅ llama a la función que sí has definido abajo
  }, []);
  
//   const obtenerUsuarios = async () => {
//     try {
//       const response = await axios.get("/admin/usuarios");
//       console.log("👥 Usuarios cargados:", response.data);
//       setUsuarios(Array.isArray(response.data) ? response.data : []);
//     } catch (error) {
//       toast.error("No se pudo cargar la lista de usuarios.");
//     }
//   };
  
  const obtenerUsuarios = async () => {
    try {
      const response = await axios.get("/admin/usuarios");
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setUsuarios([]);
      toast.error("No se pudo cargar la lista de usuarios.");
    }
  };
  
  const handleGuardarUsuario = async (formData) => {
    try {
      if (modo === "crear") {
        await axios.post("/admin/usuarios", formData);
        toast.success("Usuario creado correctamente.");
      } else {
        await axios.put(`/admin/usuarios/${formData.id}`, formData);
        toast.success("Usuario actualizado correctamente.");
      }
      cerrarModal();
      obtenerUsuarios();
    } catch (error) {
      toast.error("Error al guardar el usuario.");
    }
  };
  
  
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

  const cerrarModal = () => {
    setModalOpen(false);
  };



  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestión de Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModalCrear}>
          Crear Usuario
        </Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Ganancia (%)</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.ganancias}%</TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton color="primary" onClick={() => abrirModalEditar(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" disabled>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <UserModal
        open={modalOpen}
        handleClose={cerrarModal}
        handleSubmit={handleGuardarUsuario}
        modo={modo}
        initialData={usuarioSeleccionado}
      />
    </Box>
  );
};

export default Users;
