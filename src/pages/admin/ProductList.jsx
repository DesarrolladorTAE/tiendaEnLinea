import React, { lazy, useEffect, useRef, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import useLimiteProductos from "../../hooks/useLimiteProductos";
import ProductSearchBar from "../../components/products-list/ProductSearchBar";
import ProductTable from "../../components/products-list/ProductTable";
import ProductPagination from "../../components/products-list/ProductPagination";
import useComplementosActivos from "../../hooks/useComplementosActivos";

const ProductImages = lazy(() => import("./ProductImages"));

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cargandoCSV, setCargandoCSV] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const { puedeCrear, cargando, totalProductos, limitePermitido } =
    useLimiteProductos();

  const productsPerPage = 10;
  const { tieneComplemento } = useComplementosActivos();

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const resultado = products.filter((p) =>
      p.name?.toLowerCase().includes(term)
    );
    setFiltered(resultado);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const fetchProductos = async () => {
    try {
      const res = await axiosClient.get("/admin/products");
      setProducts(res.data || []);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setError("Error al obtener productos.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await axiosClient.delete(`/admin/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar.");
    }
  };

  const cargarCSV = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("archivo", file);
    setCargandoCSV(true);
    try {
      const res = await axiosClient.post("/cargar/importarDesdeCSV", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchProductos();
      alert(res?.data?.message || "Archivo cargado correctamente.");
    } catch (error) {
      console.error("Error al cargar CSV:", error);
      alert("Error al importar el archivo CSV.");
    } finally {
      setCargandoCSV(false);
    }
  };

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  if (selectedProduct) {
    return (
      <div className="bg-dark text-white p-4">
        <Suspense fallback={<p className="text-white">Cargando imágenes...</p>}>
          <ProductImages
            productId={selectedProduct.id}
            onClose={() => setSelectedProduct(null)}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white p-4 shadow rounded border border-light">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="text-white mb-0">🛒 Lista de Productos</h2>
        <p className="text-white small mb-0 text-end">
          {cargando
            ? "Cargando límites..."
            : `Tienes ${totalProductos} / ${
                limitePermitido === Infinity ? "∞" : limitePermitido
              } productos creados`}
        </p>
      </div>

      <ProductSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        {tieneComplemento(6) && (
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
              {cargandoCSV ? "Importando CSV..." : "📤 Importar productos CSV"}
            </button>
            <a
              href="/assets/ejemploCSV/CSVejemplo.csv"
              download
              className="text-decoration-underline text-info d-block mt-1"
            >
              📄 Descargar CSV de ejemplo
            </a>
          </div>
        )}

        {puedeCrear ? (
          <Link
            to="new"
            className="btn btn-outline-light d-flex align-items-center gap-2"
          >
            <span className="fs-5">➕</span> Crear Producto
          </Link>
        ) : (
          <div className="text-warning text-end">
            Límite alcanzado (
            {limitePermitido === Infinity ? "∞" : limitePermitido})
          </div>
        )}
      </div>

      {error && <p className="text-danger text-center">{error}</p>}

      <ProductTable
        products={paginatedProducts}
        currentPage={currentPage}
        productsPerPage={productsPerPage}
        onDelete={handleDelete}
        onOpenImages={setSelectedProduct}
      />

      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductList;
