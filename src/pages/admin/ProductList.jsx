import React, {
  lazy,
  useEffect,
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
import ImportProductsModal from "../../components/products-list/ImportProductsModal";
import AdvancedProductsModal from "../../components/products-list/AdvancedProductsModal";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { FiPackage, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { notifyInventoryChanged, subscribeInventoryChanges } from "../../utils/inventoryEvents";

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
  const [openImport, setOpenImport] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(null);
  const [error, setError] = useState(null);

  // categorías
  const [categoriesFlat, setCategoriesFlat] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // modal etiquetas
  const [openLabels, setOpenLabels] = useState(false);
  const [labelProduct, setLabelProduct] = useState(null);

  // ✅ modal categorías multi
  const [openCats, setOpenCats] = useState(false);
  const [catProduct, setCatProduct] = useState(null);
  const [savingCats, setSavingCats] = useState(false);

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

  const { puedeCrear, cargando, totalProductos, limitePermitido, actualizarLimite, errorLimite } =
    useLimiteProductos(activeBranch?.id ?? null);

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
    return subscribeInventoryChanges(() => { fetchProductos(); fetchCategorias(); });
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
      await actualizarLimite();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar.");
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

          <Box sx={{ display: "flex", alignItems: "center", width: { xs: "100%", sm: "auto" }, p: 0.75, borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(120deg, #292c30, #202226)", boxShadow: "0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.035)" }}>
            <Box role="status" aria-live="polite" sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.25, py: 0.75, flex: 1 }}>
              <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", justifyContent: "center", width: 40, height: 40, flexShrink: 0, borderRadius: "12px", color: "#f6ce73", background: "linear-gradient(145deg, rgba(246,206,115,0.16), rgba(246,206,115,0.04))", border: "1px solid rgba(246,206,115,0.12)" }}>
                <FiPackage size={21} aria-hidden="true" />
              </Box>
              <Box>
                <Typography component="p" sx={{ m: 0, color: "#a8adb5", fontSize: 11, lineHeight: 1.4, fontWeight: 500 }}>En esta sucursal</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                  <Typography component="span" sx={{ color: errorLimite ? "#f6ce73" : "#fff", fontSize: cargando || errorLimite ? 13 : 26, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                    {cargando ? "Consultando..." : errorLimite ? "Total no disponible" : totalProductos == null ? "—" : Number(totalProductos).toLocaleString("es-MX")}
                  </Typography>
                  {!cargando && !errorLimite && <Typography component="span" sx={{ color: "#d0d3d8", fontSize: 12 }}>productos</Typography>}
                </Box>
              </Box>
              {!cargando && !errorLimite && (
                <Box sx={{ ml: "auto", pl: { xs: 1, sm: 2 }, textAlign: "right", flexShrink: 0 }}>
                  <Typography component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1, py: 0.45, borderRadius: "7px", color: limitePermitido === Infinity ? "#9ae2bc" : "#e8ca88", bgcolor: limitePermitido === Infinity ? "rgba(110,215,157,0.08)" : "rgba(246,206,115,0.08)", fontSize: 11, fontWeight: 600 }}>
                    {limitePermitido === Infinity && <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>∞</span>}
                    {limitePermitido === Infinity ? "Sin límite" : `Límite: ${Number(limitePermitido).toLocaleString("es-MX")}`}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ borderLeft: "1px solid rgba(255,255,255,0.09)", ml: 1, pl: 0.75, display: "flex" }}>
              <Tooltip title="Eliminar todos los productos" arrow>
                <IconButton aria-label="Eliminar todos los productos" onClick={() => setAdvancedMode("delete")}
                  sx={{ width: 40, height: 44, color: "#b7a2a4", borderRadius: "11px", transition: "background-color 160ms, color 160ms", "&:hover": { color: "#fda4af", bgcolor: "rgba(244,63,94,0.12)" }, "&.Mui-focusVisible": { outline: "2px solid #fca5a5", outlineOffset: 2 } }}>
                  <FiTrash2 size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </div>

        <ProductSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          {!tiendaLoading && puedeImportarMasivo && (
            <button
              className="btn btn-warning d-inline-flex align-items-center gap-2"
              onClick={() => setOpenImport(true)}
            >
              <FiUploadCloud size={20} /> Importar productos
            </button>
          )}

          {puedeCrear ? (
            <Link
              to="new"
              className="btn btn-outline-light d-flex align-items-center gap-2"
            >
              <span className="fs-5">➕</span> Crear Producto
            </Link>
          ) : cargando ? (
            <span className="text-light small">Consultando disponibilidad...</span>
          ) : errorLimite ? (
            <button className="btn btn-outline-warning" onClick={actualizarLimite}>Reintentar consulta de límite</button>
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

        {advancedMode && <AdvancedProductsModal
          mode={advancedMode} branch={activeBranch} onClose={() => setAdvancedMode(null)}
          onChanged={async () => {
            notifyInventoryChanged();
            await Promise.all([fetchProductos(), fetchCategorias(), actualizarLimite()]);
          }}
        />}

        {openImport && (
          <ImportProductsModal
            open={openImport}
            onClose={() => setOpenImport(false)}
            branch={activeBranch}
            onImported={async () => {
              notifyInventoryChanged();
              await Promise.all([fetchProductos(), fetchCategorias(), actualizarLimite()]);
            }}
          />
        )}

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
