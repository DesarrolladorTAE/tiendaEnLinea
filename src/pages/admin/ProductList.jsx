import React, {
  lazy,
  useEffect,
  useRef,
  useState,
  Suspense,
  useMemo,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import useLimiteProductos from "../../hooks/useLimiteProductos";
import ProductSearchBar from "../../components/products-list/ProductSearchBar";
import ProductTable from "../../components/products-list/ProductTable";
import ProductPagination from "../../components/products-list/ProductPagination";
import useComplementosActivos from "../../hooks/useComplementosActivos";
import Taebanner from "../../components/admin/promociones/Taebanner";
import LabelModal from "./modals/LabelModal";
import { useTienda } from "../../context/TiendaContext";
import CategoryModal from "../../components/products-list/CategoryModal";

// ✅ sucursal seleccionada + layout
import { useAdminUi } from "../../context/AdminUiContext";

const ProductImages = lazy(() => import("./ProductImages"));

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();

  const branchFromNav = location.state?.branch ?? null;
  const branchIdFromUrl = params.get("branch_id");

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cargandoCSV, setCargandoCSV] = useState(false);
  const [error, setError] = useState(null);

  // categorías
  const [categoriesFlat, setCategoriesFlat] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // modal etiquetas
  const fileInputRef = useRef();
  const [openLabels, setOpenLabels] = useState(false);
  const [labelProduct, setLabelProduct] = useState(null);

  // ✅ modal categorías multi
  const [openCats, setOpenCats] = useState(false);
  const [catProduct, setCatProduct] = useState(null);
  const [savingCats, setSavingCats] = useState(false);

  const { puedeCrear, cargando, totalProductos, limitePermitido } =
    useLimiteProductos();
  const productsPerPage = 10;
  const { tieneComplemento } = useComplementosActivos();

  const { tienda, tiendaLoading } = useTienda();
  const planId = Number(tienda?.plan_id || 0);

  // ✅ permitir por plan 1 o 4
  const permitidoPorPlan = planId === 1 || planId === 4;
  // ✅ permitir por complemento 6 (lo que ya usas)
  const permitidoPorComplemento = tieneComplemento(6);
  // ✅ regla final
  const puedeImportarMasivo = permitidoPorPlan || permitidoPorComplemento;

  // ✅ Branch activo (state > context > query)
  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  // ✅ en productos siempre se muestra layout
  useEffect(() => {
    setHideLayout(false);
  }, [setHideLayout]);

  // ✅ si vienes desde navegación con state, lo guardamos en contexto
  useEffect(() => {
    if (branchFromNav?.id) {
      setSelectedBranch(branchFromNav);
    }
  }, [branchFromNav, setSelectedBranch]);

  // ✅ si no hay sucursal, regresamos a sucursales
  useEffect(() => {
    if (!activeBranch?.id) {
      navigate("/admin/sucursales");
    }
  }, [activeBranch?.id, navigate]);

  const handleOpenLabels = (product) => {
    setLabelProduct(product);
    setOpenLabels(true);
  };
  const handleCloseLabels = () => setOpenLabels(false);

  const handleOpenCats = (product) => {
    setCatProduct(product);
    setOpenCats(true);
  };
  const handleCloseCats = () => {
    if (savingCats) return;
    setOpenCats(false);
    setCatProduct(null);
  };

  // filtrar
  useEffect(() => {
    const term = (searchTerm || "").toLowerCase();
    const resultado = (products || []).filter((p) =>
      p.name?.toLowerCase().includes(term),
    );
    setFiltered(resultado);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const fetchProductos = async () => {
    try {
      setError(null);

      if (!activeBranch?.id) return;

      const res = await axiosClient.get(
        `/admin/branches/${activeBranch.id}/products`,
      );

      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setError("Error al obtener productos.");
      setProducts([]);
    }
  };

  const fetchCategorias = async () => {
    try {
      setCategoriesLoading(true);
      const res = await axiosClient.get("/admin/categories");
      const cats = res?.data?.categories ?? res?.data ?? [];
      setCategoriesFlat(Array.isArray(cats) ? cats : []);
    } catch (e) {
      console.error("Error al obtener categorías:", e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ✅ cargar productos/categorías cuando hay branch activo
  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchProductos();
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch?.id]);

  // Construir árbol padre->hijas (sin backend extra)
  const categoriesTree = useMemo(() => {
    const flat = categoriesFlat || [];
    const parents = flat.filter((c) => c.parent_id == null);
    const childrenByParent = new Map();

    for (const c of flat) {
      if (c.parent_id != null) {
        const arr = childrenByParent.get(c.parent_id) ?? [];
        arr.push(c);
        childrenByParent.set(c.parent_id, arr);
      }
    }

    return parents
      .map((p) => ({
        ...p,
        children: (childrenByParent.get(p.id) ?? []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [categoriesFlat]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await axiosClient.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar.");
    }
  };

  const cargarCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("archivo", file);

    setCargandoCSV(true);
    try {
      const res = await axiosClient.post("/cargar/importarDesdeCSV", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: activeBranch?.id ? { branch_id: activeBranch.id } : undefined,
      });

      await fetchProductos();
      alert(res?.data?.message || "Archivo cargado correctamente.");
    } catch (error) {
      console.error("Error al cargar CSV:", error);
      alert("Error al importar el archivo CSV.");
    } finally {
      setCargandoCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Guardar múltiples categorías (sync pivot)
  const handleSaveCategories = async (productId, categoryIds) => {
    setSavingCats(true);

    // ✅ Optimista: actualiza UI primero
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              category_ids: categoryIds,
            }
          : p,
      ),
    );

    try {
      await axiosClient.post(`/admin/products/${productId}/categories`, {
        _method: "PATCH",
        category_ids: categoryIds,
      });

      await fetchProductos();
    } catch (e) {
      console.error("Error al guardar categorías:", e);
      await fetchProductos();
      alert("Error al guardar categorías.");
    } finally {
      setSavingCats(false);
    }
  };

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
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
    <>
      <div className="bg-dark text-white p-4 shadow rounded border border-light mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div>
            <h2 className="text-white mb-1">🛒 Lista de Productos</h2>

            {/* ✅ sucursal activa */}
            {activeBranch?.id ? (
              <div className="small">
                <span className="badge bg-warning text-dark">
                  📍 Sucursal:{" "}
                  {activeBranch?.name
                    ? activeBranch.name
                    : `#${activeBranch.id}`}
                </span>
                <Link
                  to="/admin/sucursales"
                  className="ms-2 text-decoration-underline text-info"
                >
                  Cambiar sucursal
                </Link>
              </div>
            ) : null}
          </div>

          <p className="text-white small mb-0 text-end">
            {cargando
              ? "Cargando límites..."
              : `Tienes ${totalProductos} / ${
                  limitePermitido === Infinity ? "∞" : limitePermitido
                } productos creados`}
          </p>
        </div>

        <ProductSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          {!tiendaLoading && puedeImportarMasivo && (
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
                {cargandoCSV
                  ? "Importando CSV..."
                  : "📤 Importar productos CSV"}
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
          onOpenLabels={handleOpenLabels}
          categoriesTree={categoriesTree}
          categoriesFlat={categoriesFlat}
          categoriesLoading={categoriesLoading}
          onOpenCategories={handleOpenCats}
        />

        <LabelModal
          open={openLabels}
          onClose={handleCloseLabels}
          product={labelProduct}
        />

        <CategoryModal
          open={openCats}
          onClose={handleCloseCats}
          product={catProduct}
          categoriesFlat={categoriesFlat}
          categoriesTree={categoriesTree}
          loading={categoriesLoading}
          saving={savingCats}
          onSave={handleSaveCategories}
        />

        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="bg-white text-dark rounded shadow mb-4">
        <Taebanner />
      </div>
    </>
  );
};

export default ProductList;
