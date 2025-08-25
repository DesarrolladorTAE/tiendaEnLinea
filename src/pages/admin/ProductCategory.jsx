import React, { useEffect, useState } from "react";
import axiosClient from "../../config/axiosClient";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", editingId: null });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get("admin/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      showSnackbar("Error al cargar categorías", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.editingId) {
        await axiosClient.post(`admin/categories/${form.editingId}`, {
          name: form.name,
          _method: "PATCH",
        });
        setCategories((prev) =>
          prev.map((cat) => (cat.id === form.editingId ? { ...cat, name: form.name } : cat))
        );
        showSnackbar("Categoría actualizada correctamente");
      } else {
        const response = await axiosClient.post("admin/categories", { name: form.name });
        setCategories((prev) => [...prev, response.data]);
        showSnackbar("Categoría creada correctamente");
      }
      setForm({ name: "", editingId: null });
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      showSnackbar("Error al guardar categoría", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setForm({ name: category.name, editingId: category.id });
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
     await axiosClient.delete(`admin/categories/${deleteDialog.id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== deleteDialog.id));
      showSnackbar("Categoría eliminada correctamente");
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      showSnackbar("Error al eliminar categoría", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card variant="outlined" sx={{ bgcolor: "background.paper", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            📁 Gestión de Categorías
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre de la categoría"
              variant="filled"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              disabled={loading}
            >
              {form.editingId ? "Actualizar" : "Crear"}
            </Button>
          </Box>

          <List sx={{ mt: 4 }}>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <ListItem
                  key={cat.id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="editar"
                        onClick={() => handleEdit(cat)}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="eliminar"
                        onClick={() => setDeleteDialog({ open: true, id: cat.id })}
                        color="error"
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText primary={cat.name} />
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                No hay categorías disponibles
              </Typography>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>¿Eliminar Categoría?</DialogTitle>
        <DialogContent>¿Estás seguro de que deseas eliminar esta categoría?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={loading}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Category;
