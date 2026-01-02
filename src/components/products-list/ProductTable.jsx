import React from "react";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CategoryIcon from "@mui/icons-material/Category";

const ProductTable = ({
  products,
  currentPage,
  productsPerPage,
  onDelete,
  onOpenImages,
  onOpenLabels,

  categoriesLoading = false,
  onOpenCategories,
}) => {
  const startIndex = (currentPage - 1) * productsPerPage;

  const getCategories = (product) =>
    Array.isArray(product?.categories) ? product.categories : [];

  const renderCategoryChip = (product) => {
    const cats = getCategories(product);
    const count = cats.length;

    // 0 categorías
    if (count === 0) {
      return (
        <span className="badge rounded-pill bg-secondary text-white">
          0
        </span>
      );
    }

    // 1 categoría → nombre azul neón
    if (count === 1) {
      return (
        <span
          className="badge rounded-pill"
          title={cats[0].name}
          style={{
            backgroundColor: "#00e5ff", // azul neón
            color: "#000",
            fontWeight: 700,
            maxWidth: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cats[0].name}
        </span>
      );
    }

    // 2+ categorías → número en blanco
    return (
      <span
        className="badge rounded-pill"
        title={`${count} categorías`}
        style={{
          backgroundColor: "#343a40",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
    );
  };

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
            <th style={{ width: 110, whiteSpace: "nowrap" }}>Categorias</th>
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

                {/* ✅ Categorías compactas */}
                <td style={{ width: 110 }}>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    {renderCategoryChip(product)}

                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                      onClick={() => onOpenCategories?.(product)}
                      disabled={categoriesLoading}
                      title="Administrar categorías"
                      style={{
                        width: 26,
                        height: 26,
                        padding: 0,
                      }}
                    >
                      <CategoryIcon fontSize="small" />
                    </button>
                  </div>
                </td>

                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <Link
                      to={`edit/${product.id}`}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                      title="Editar producto"
                      style={{ width: 32, height: 32 }}
                    >
                      <EditIcon fontSize="small" />
                    </Link>

                    <button
                      className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                      onClick={() => onOpenLabels(product)}
                      title="Imprimir etiquetas"
                      style={{ width: 32, height: 32 }}
                    >
                      <LocalPrintshopIcon fontSize="small" />
                    </button>

                    <button
                      className="btn btn-sm btn-outline-warning d-flex align-items-center justify-content-center"
                      onClick={() => onOpenImages(product)}
                      title="Agregar Imágenes"
                      style={{ width: 32, height: 32 }}
                    >
                      <ImageIcon fontSize="small" />
                    </button>

                    <button
                      onClick={() => onDelete(product.id)}
                      className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                      title="Eliminar"
                      style={{ width: 32, height: 32 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center text-muted py-3">
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
