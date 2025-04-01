import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', editingId: null });

  const fetchCategories = async () => {
    const response = await axios.get('https://mitiendaenlineamx.com.mx/api/categorias');
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
      await axios.post('/api/categories', { name: form.name });
    }

    setForm({ name: '', editingId: null });
    fetchCategories();
  };

  const handleEdit = (category) => {
    setForm({ name: category.name, editingId: category.id });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      await axios.delete(`/api/categories/${id}`);
      fetchCategories();
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Gestión de Categorías</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Nombre de la categoría"
          className="flex-1 border px-4 py-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {form.editingId ? 'Actualizar' : 'Crear'}
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>{cat.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(cat)}
                className="text-sm text-blue-600"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-sm text-red-600"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryManager;
