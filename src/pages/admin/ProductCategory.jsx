import React, { useEffect, useState } from "react";
import axiosClient from "../../config/axiosClient";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", editingId: null });

  const fetchCategories = async () => {
    const response = await axiosClient.get("categorias");
    setCategories(response.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.editingId) {
      await axios.put(`/api/categories/${form.editingId}`, { name: form.name });
    } else {
      await axios.post("/api/categories", { name: form.name });
    }

    setForm({ name: "", editingId: null });
    fetchCategories();
  };

  const handleEdit = (category) => {
    setForm({ name: category.name, editingId: category.id });
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")
    ) {
      await axios.delete(`/api/categories/${id}`);
      fetchCategories();
    }
  };

  return (
    <div className="category-container bg-dark text-white p-4 rounded shadow border border-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 text-white">
          <span role="img" aria-label="folder">
            📁
          </span>{" "}
          Gestión de Categorías
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="row g-2 align-items-center mb-4">
        <div className="col-sm">
          <div className="input-group">
            <span className="input-group-text bg-dark border-light text-white">
              🏷️
            </span>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              className="form-control bg-dark text-white border-light"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-outline-light">
            ➕ {form.editingId ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>

      <ul className="list-group list-group-flush border-top border-light pt-2">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <li
              key={cat.id}
              className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-light"
            >
              <span className="fw-semibold">{cat.name}</span>
              <div className="d-flex gap-2">
                <button
                  onClick={() => handleEdit(cat)}
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  title="Editar categoría"
                >
                  ✏️ <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  title="Eliminar categoría"
                >
                  🗑 <span>Eliminar</span>
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="list-group-item bg-dark text-muted text-center border-light">
            No hay categorías disponibles
          </li>
        )}
      </ul>
    </div>
  );
};

export default CategoryManager;
