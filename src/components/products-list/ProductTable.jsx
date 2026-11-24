import React, { useState } from "react";
import { ListItemIcon, Menu, MenuItem } from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { productStock } from "../../utils/productInventory";
import { tracksBatches } from "../../utils/batchInventory";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
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
  showVehicleCompatibilities = false,
  onOpenVehicles,
  onOpenImages,
  onOpenLabels,
  onOpenBatches,

  categoriesLoading = false,
  onOpenCategories,
}) => {
  const [actionMenu, setActionMenu] = useState(null);
  const selectedProduct = actionMenu && products.find(product => product.id === actionMenu.productId);
  const actions = selectedProduct ? [
    { label: "Administrar categorías", icon: CategoryIcon, action: onOpenCategories, disabled: categoriesLoading },
    { label: "Administrar lotes", icon: Inventory2OutlinedIcon, action: onOpenBatches },
    { label: "Imprimir etiquetas", icon: LocalPrintshopIcon, action: onOpenLabels },
    { label: "Agregar imágenes", icon: ImageIcon, action: onOpenImages },
    { label: "Ver compatibilidades vehiculares", icon: DirectionsCarIcon, action: showVehicleCompatibilities &&
        ([true, 1, "1"].includes(selectedProduct.has_vehicle_compatibilities) || Number(selectedProduct.vehicle_compatibilities_count) > 0) && onOpenVehicles },
    { label: "Eliminar producto", icon: DeleteIcon, action: onDelete && (product => onDelete(product.id)), destructive: true },
  ].filter(item => item.action) : [];
  const columnCount = 7 + (showProfitFactor ? 1 : 0);
  const hasOeNumber = showOeNumber && products.some(product => String(product.oe_number ?? "").trim() !== "");
  const codeStyle = { color: "#fff", fontFamily: "monospace", minWidth: 130, overflowWrap: "anywhere" };
  const renderStock = product => {
    if (tracksBatches(product)) return (
      <div className="product-warehouse-stocks">
        <strong>Vendible: {product.available_qty ?? "Consultar lotes"}</strong>
        {(Array.isArray(product.warehouse_stocks) ? product.warehouse_stocks : []).filter(row => row.available_qty != null).map(row => (
          <div key={row.warehouse_id} className="product-warehouse-stock">
            <span>{row.warehouse_name || `Almacén #${row.warehouse_id}`}</span><strong>{row.available_qty}</strong>
          </div>
        ))}
      </div>
    );
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

                <td data-label="Categorías" style={{ width: 110 }}>{renderCategoryChip(product)}</td>
                <td data-label="Acciones" className="text-center product-actions">
                  <div className="product-action-grid">
                    <Link to={`edit/${product.id}`} className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                      title="Editar producto" aria-label="Editar producto">
                      <EditIcon fontSize="small" />
                    </Link>
                    <button type="button" className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center"
                      aria-label={`Más acciones de ${product.name || "producto"}`} aria-haspopup="menu"
                      aria-expanded={selectedProduct?.id === product.id}
                      onClick={event => setActionMenu({ productId: product.id, anchor: event.currentTarget })}>
                      <MoreHorizRoundedIcon fontSize="small" />
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
      <Menu anchorEl={actionMenu?.anchor} open={Boolean(selectedProduct) && !loading && !error}
        onClose={() => setActionMenu(null)} slotProps={{ list: { "aria-label": "Acciones del producto" } }}>
        {actions.map(({ label, icon: Icon, action, disabled, destructive }) => (
          <MenuItem key={label} disabled={disabled} sx={{ minHeight: 44, ...(destructive && { color: "error.main" }) }}
            onClick={() => { setActionMenu(null); action(selectedProduct); }}>
            <ListItemIcon sx={{ color: "inherit" }}><Icon fontSize="small" /></ListItemIcon>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default ProductTable;
