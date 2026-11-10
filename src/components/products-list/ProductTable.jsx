import React from "react";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CategoryIcon from "@mui/icons-material/Category";
import { productStock } from "../../utils/productInventory";
import ProductProfitFactorCell from "./ProductProfitFactorCell";
import "./ProductTable.css";

const ProductTable = ({
  products,
  loading = false,
  error = null,
  showOeNumber = false,
  showProfitFactor = false,
  onProfitFactorSaved,
  onDelete,
  onOpenImages,
  onOpenLabels,

  categoriesLoading = false,
  onOpenCategories,
}) => {
  const columnCount = 7 + (showProfitFactor ? 1 : 0);
  const hasOeNumber = showOeNumber && products.some(product => String(product.oe_number ?? "").trim() !== "");
  const codeStyle = { color: "#fff", fontFamily: "monospace", minWidth: 130, overflowWrap: "anywhere" };
  const renderStock = product => {
    const warehouses = Array.isArray(product.warehouse_stocks) ? product.warehouse_stocks.filter(row => Number.isFinite(Number(row.qty)) && Number(row.qty) !== 0) : [];
    const unassignedStock = Number(product.stock);
    const hasUnassignedStock = product.stock != null && Number.isFinite(unassignedStock) && unassignedStock !== 0;
    if (warehouses.length || hasUnassignedStock) return (
      <div className="product-warehouse-stocks">
        {hasUnassignedStock && <div className="product-warehouse-stock"><span>Sin almacén</span><strong>{unassignedStock.toLocaleString("es-MX", { maximumFractionDigits: 6 })}</strong></div>}
        {warehouses.map(row => <div key={row.warehouse_id} className="product-warehouse-stock"><span>{row.warehouse_name || `Almacén #${row.warehouse_id}`}</span><strong>{Number(row.qty).toLocaleString("es-MX", { maximumFractionDigits: 6 })}</strong></div>)}
      </div>
    );
    return productStock(product) ?? product.stock ?? "Consultar detalle";
  };

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
    <div className="table-responsive product-list-responsive">
      <table className="table table-dark table-hover align-middle table-bordered">
        <thead className="table-secondary text-dark">
          <tr>
            <th>{hasOeNumber ? "SKU / OE" : "SKU"}</th>
            <th>Nombre</th>
            <th>Precio</th>
            {showProfitFactor && <th title="Porcentaje de aumento sobre el costo de compra; el precio final ya incluye IVA.">Factor de utilidad</th>}
            <th>IVA</th>
            <th>Stock</th>
            <th style={{ width: 110, whiteSpace: "nowrap" }}>Categorias</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {loading || error ? <tr><td colSpan={columnCount} className="text-center text-light py-3 product-table-status" role="status">{loading ? "Cargando productos..." : "No se pudieron cargar los productos."}</td></tr> : products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td data-label="Código" style={codeStyle}>
                  <div><span className="product-code-label">SKU </span>{product.sku || "Sin SKU"}</div>
                  {String(product.oe_number ?? "").trim() && <div className="product-oe"><span className="product-code-label">OE </span>{product.oe_number}</div>}
                </td>
                <td data-label="Producto" className="fw-semibold product-name">{product.name || "N/A"}</td>
                <td data-label="Precio">${product.price || "0.00"}</td>
                {showProfitFactor && <td data-label="Factor de utilidad"><ProductProfitFactorCell product={product} onSaved={onProfitFactorSaved} /></td>}

                <td data-label="IVA">
                  {product.iva === null
                    ? "Exento"
                    : `${(product.iva * 100).toFixed(0)}%`}
                </td>

                <td data-label="Stock">{renderStock(product)}</td>

                {/* ✅ Categorías compactas */}
                <td data-label="Categorías" style={{ width: 110 }}>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    {renderCategoryChip(product)}

                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                      onClick={() => onOpenCategories?.(product)}
                      disabled={categoriesLoading}
                      title="Administrar categorías"
                      style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                      }}
                    >
                      <CategoryIcon fontSize="small" />
                    </button>
                  </div>
                </td>

                <td data-label="Acciones" className="text-center product-actions">
                  <div className="product-action-grid">
                    <Link
                      to={`edit/${product.id}`}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                      title="Editar producto"
                      style={{ minWidth: 40, minHeight: 40 }}
                    >
                      <EditIcon fontSize="small" /><span className="product-action-label">Editar</span>
                    </Link>

                    <button
                      className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                      onClick={() => onOpenLabels(product)}
                      title="Imprimir etiquetas"
                      style={{ minWidth: 40, minHeight: 40 }}
                    >
                      <LocalPrintshopIcon fontSize="small" /><span className="product-action-label">Etiquetas</span>
                    </button>

                    <button
                      className="btn btn-sm btn-outline-warning d-flex align-items-center justify-content-center"
                      onClick={() => onOpenImages(product)}
                      title="Agregar Imágenes"
                      style={{ minWidth: 40, minHeight: 40 }}
                    >
                      <ImageIcon fontSize="small" /><span className="product-action-label">Imágenes</span>
                    </button>

                    <button
                      onClick={() => onDelete(product.id)}
                      className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                      title="Eliminar"
                      style={{ minWidth: 40, minHeight: 40 }}
                    >
                      <DeleteIcon fontSize="small" /><span className="product-action-label">Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnCount} className="text-center text-light py-3 product-table-status" role="status">
                No se encontraron productos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
