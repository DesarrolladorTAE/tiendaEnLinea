import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const headers = {
      "X-Store-Name": "Tienda de Prueba",
    };

    axios
      .get("http://mitiendaenlineamx.com.mx/api/products", { headers })
      .then((response) => setProducts(response.data))
      .catch((error) => {
        console.error("Error al obtener productos:", error);
        setError(error.response?.data?.error || "Error desconocido");
      });
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro que deseas eliminar este producto?")) {
      axios
        .delete(`http://mitiendaenlineamx.com.mx/api/products/${id}`)
        .then(() => {
          setProducts(products.filter((product) => product.id !== id));
        })
        .catch((error) => {
          console.error("Error al eliminar el producto:", error);
          alert("Error al eliminar el producto.");
        });
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <div
        className="bg-white p-4 shadow rounded w-100"
        style={{ maxWidth: "960px" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-primary">🛒 Lista de Productos</h2>
          <Link to="/admin/products/new" className="btn btn-success">
            ➕ Crear Producto
          </Link>
        </div>

        {error && <p className="text-danger text-center">{error}</p>}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="fw-semibold">{product.name || "N/A"}</td>
                    <td>${product.price || "0.00"}</td>
                    <td>{product.stock ?? "Con Variaciones"}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <Link
                          to={`/product/${product.id}`}
                          className="btn btn-sm btn-outline-info"
                          title="Ver detalles"
                        >
                          🔍
                        </Link>
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="Editar producto"
                        >
                          ✏️
                        </Link>
                        <Link
                          to={`/admin/products/images/${product.id}`}
                          className="btn btn-sm btn-outline-warning"
                          title="Modificar imágenes"
                        >
                          🖼
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Eliminar producto"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-3">
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
