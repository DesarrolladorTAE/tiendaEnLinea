import React, { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
const ProductImages = lazy(() => import("./ProductImages"));

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/admin/products")
      .then((response) => {
        console.log("Respuesta del backend:", response.data); // 👈 AQUI
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al obtener productos:", error);
        setError(error.response?.data?.error || "Error desconocido");
      });
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro que deseas eliminar este producto?")) {
      axiosClient
        .delete(`/admin/products/${id}`)
        .then(() => {
          setProducts(products.filter((product) => product.id !== id));
        })
        .catch((error) => {
          console.error("Error al eliminar el producto:", error);
          alert("Error al eliminar el producto.");
        });
    }
  };

  if (selectedProduct) {
    return (
      <div className="bg-dark text-white p-4">
        <Suspense fallback={<p className="text-white">Cargando imágenes...</p>}>
        <ProductImages productId={selectedProduct.id} onClose={() => setSelectedProduct(null)} />
        </Suspense>
      </div>
    );
  }  

  return (
    <div className="bg-dark text-white p-4 shadow rounded border border-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white">
          <span role="img" aria-label="cart">
            🛒
          </span>{" "}
          Lista de Productos
        </h2>
        <Link to="new" className="btn btn-outline-light d-flex align-items-center gap-2">
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
                  <td>{product.has_variations ? "Con Variaciones" : `${product.stock ?? 0}`}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      {/* <Link
                        to={`/product/${product.id}`}
                        className="btn btn-sm btn-outline-info"
                        title="Ver detalles"
                      >
                        🔍
                      </Link> */}
                      <Link
                        to={`edit/${product.id}`}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                        title="Editar producto"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <EditIcon fontSize="small" />
                      </Link>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => setSelectedProduct(product)} // 👈 cambia a render local
                      >
                        <ImageIcon fontSize="small" />
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                        title="Eliminar producto"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <DeleteIcon fontSize="small" />
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
