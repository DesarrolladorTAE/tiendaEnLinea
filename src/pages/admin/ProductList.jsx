import React, { Suspense, lazy, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { Box, Button } from "@mui/material";
const ProductImages = lazy(() => import("./ProductImages"));

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cargandoCSV, setCargandoCSV] = useState(false)

  useEffect(() => {
    verProducto()
  }, []);

  const verProducto = () => {
    axiosClient
      .get("/admin/products")
      .then((response) => {
        // console.log("Respuesta del backend:", response.data);
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al obtener productos:", error);
        setError(error.response?.data?.error || "Error desconocido");
      });
  }

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

  const fileInputRef = useRef();

  const cargarCSV = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    console.log('file: ', file)

    const formData = new FormData();
    formData.append("archivo", file);
    setCargandoCSV(true)
    try {
      const response = await axiosClient.post(
        "https://mitiendaenlineamx.com.mx/api/cargar/importarDesdeCSV",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      ).then((res) => {
        verProducto()
        setCargandoCSV(false)
        const mensaje = res?.data?.message || "✅ Archivo cargado correctamente.";
        alert(mensaje);
      });


    } catch (error) {
      console.error("❌ Error al cargar CSV:", error);
      setCargandoCSV(false)

      const mensaje =
        error?.response?.data?.message ||
        (typeof error?.message === "string" ? error.message : "Error inesperado al subir el archivo.");

      alert("❌ Error al cargar CSV:\n" + mensaje);
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

        <div>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            className="btn btn-warning me-2"
            onClick={cargarCSV}
            disabled={cargandoCSV}
          >
            {cargandoCSV ? 'Importando CSV...' : '📤 Importar productos CSV'}
          </button>


        </div>
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
              <th>IVA</th>
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
                  <td>{product.iva === null ? "Exento" : `${(product.iva * 100).toFixed(0)}%`}</td>
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
                        onClick={() => setSelectedProduct(product)}
                        title="Agregar Imagenes al Producto"
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
