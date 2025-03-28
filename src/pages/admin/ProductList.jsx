import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const headers = {
      "X-Store-Name": "Tienda Zapatos MX",
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
    <div className="bg-dark text-white p-4 shadow rounded border border-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white">
          <span role="img" aria-label="cart">
            🛒
          </span>{" "}
          Lista de Productos
        </h2>
        <Link
          to="new"
          className="btn btn-outline-light d-flex align-items-center gap-2"
        >
          <span className="fs-5">➕</span> Crear Producto
        </Link>
      </div>

      {error && <p className="text-danger text-center">{error}</p>}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle table-bordered">
          <thead className="table-secondary text-white">
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
                        to={`edit/${product.id}`}
                        className="btn btn-sm btn-outline-primary"
                        title="Editar producto"
                      >
                        ✏️
                      </Link>
                      <Link
                        to={`images/${product.id}`}
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
  );
};

export default ProductList;
