import React from "react";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop"; // 👈 nuevo icono

const ProductTable = ({
  products,
  currentPage,
  productsPerPage,
  onDelete,
  onOpenImages,
  onOpenLabels, // 👈 nuevo callback para abrir modal de etiquetas
}) => {
  const startIndex = (currentPage - 1) * productsPerPage;

  return (
    <div className="table-responsive">
      <table className="table table-dark table-hover align-middle table-bordered">
        <thead className="table-secondary text-white">
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>IVA</th>
            <th>Stock</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product, index) => (
              <tr key={product.id}>
                <td>{startIndex + index + 1}</td>
                <td className="fw-semibold">{product.name || "N/A"}</td>
                <td>${product.price || "0.00"}</td>
                <td>
                  {product.iva === null
                    ? "Exento"
                    : `${(product.iva * 100).toFixed(0)}%`}
                </td>
                <td>
                  {product.has_variations
                    ? "Con Variaciones"
                    : `${product.stock ?? 0}`}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    {/* Editar */}
                    <Link
                      to={`edit/${product.id}`}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                      title="Editar producto"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <EditIcon fontSize="small" />
                    </Link>

                    {/* NUEVO: Imprimir etiquetas */}
                    <button
                      className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                      onClick={() => onOpenLabels(product)}
                      title="Imprimir etiquetas"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <LocalPrintshopIcon fontSize="small" />
                    </button>

                    {/* Imágenes */}
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => onOpenImages(product)}
                      title="Agregar Imágenes al Producto"
                    >
                      <ImageIcon fontSize="small" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => onDelete(product.id)}
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
              <td colSpan="6" className="text-center text-muted py-3">
                No hay productos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
