import React, { Fragment, useState, useEffect, useMemo } from "react";
import Paginator from "react-hooks-paginator";
import { useLocation, useParams } from "react-router-dom";
// import { getSortedProducts } from "../../helpers/product"; // <- úsalo si luego agregas ordenamiento
import SEO from "../../components/seo";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";
import { useStoreData } from "../../hooks/useStoreData";
import WhatsAppFloatingButton from "../../components/WhatsAppFloatingButton";
import axios from "axios";

// 👇 monkey‑patch para quitar el warning en dev (react-hooks-paginator con React 18)
if (Paginator && "defaultProps" in Paginator) {
  try {
    // eslint-disable-next-line no-param-reassign
    Paginator.defaultProps = undefined;
  } catch {}
}

const API_BASE = "https://mitiendaenlineamx.com.mx/api";
const pageLimit = 12;

/* ========================= Helpers ========================= */

/** Normaliza una categoría a {id, name} cuando venga como id, slug, objeto, etc. */
function normCatObj(cat) {
  if (!cat) return null;
  if (typeof cat === "string" || typeof cat === "number") {
    return { id: cat, name: String(cat) };
  }
  if (typeof cat === "object") {
    const id = cat.id ?? cat.value ?? cat.slug ?? cat.name;
    const name = cat.name ?? cat.label ?? cat.slug ?? String(id ?? "");
    return id ? { id, name } : null;
  }
  return null;
}

/** Extrae tokens de categoría presentes en un producto (minúsculas). 
 * Soporta: product.category (string|obj|array), categoryId, category_id, categories[], tags[].
 */
function getProductCategoryTokensFromProduct(p) {
  const out = new Set();

  // by id numérico/slug directo
  const idLike = p?.categoryId ?? p?.category_id ?? p?.catId;
  if (idLike !== null && idLike !== undefined) out.add(String(idLike).toLowerCase());

  // product.category (string | obj | array)
  const c = p?.category;
  if (typeof c === "string") {
    out.add(c.toLowerCase());
  } else if (Array.isArray(c)) {
    c.forEach((x) => {
      if (!x) return;
      if (typeof x === "string") out.add(x.toLowerCase());
      else if (typeof x === "object") {
        const t = x.id ?? x.slug ?? x.value ?? x.name;
        if (t) out.add(String(t).toLowerCase());
      }
    });
  } else if (typeof c === "object" && c) {
    const t = c.id ?? c.slug ?? c.value ?? c.name;
    if (t) out.add(String(t).toLowerCase());
  }

  // product.categories (array)
  const cats = p?.categories;
  if (Array.isArray(cats)) {
    cats.forEach((x) => {
      if (!x) return;
      if (typeof x === "string") out.add(x.toLowerCase());
      else if (typeof x === "object") {
        const t = x.id ?? x.slug ?? x.value ?? x.name;
        if (t) out.add(String(t).toLowerCase());
      }
    });
  }

  // product.tags (por si las usan como categoría)
  const tags = p?.tags;
  if (Array.isArray(tags)) {
    tags.forEach((t) => t && out.add(String(t).toLowerCase()));
  }

  return Array.from(out);
}

/* ========================= Componente ========================= */

const Catalogo = () => {
  const { storeSlug } = useParams();
  const { isStoreValid, products, storePhone, storeName } = useStoreData(storeSlug);
  const { pathname } = useLocation();

  const [layout, setLayout] = useState("grid three-column");

  // filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // {id, name} o null

  // paginación
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // categorías
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // fetch categorías
  useEffect(() => {
    let alive = true;
    setLoadingCats(true);
    axios
      .get(`${API_BASE}/public/stores/slug/${storeSlug}/categories`)
      .then(({ data }) => {
        if (!alive) return;
        setCategories(data?.categories ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setCategories([]);
      })
      .finally(() => {
        if (alive) setLoadingCats(false);
      });
    return () => {
      alive = false;
    };
  }, [storeSlug]);

  const getLayout = (nextLayout) => setLayout(nextLayout);

  /** Recibe eventos desde ShopTopAction */
  const getFilterSortParams = (type, value) => {
    if (type === "searchQuery") {
      setSearchQuery(value ?? "");
      setCurrentPage(1);
      setOffset(0);
      return;
    }
    if (type === "category") {
      // value puede ser id o objeto {id,name}
      let cat = normCatObj(value);

      // Si vino id/slug, trata de obtener el objeto completo de la lista categories
      if (cat && (typeof value === "string" || typeof value === "number")) {
        const match = (categories || []).find((c) => {
          const cid = c?.id ?? c?.value ?? c?.slug ?? c?.name;
          return String(cid) === String(value);
        });
        if (match) cat = normCatObj(match);
      }

      setSelectedCategory(cat); // null limpia
      setCurrentPage(1);
      setOffset(0);
      return;
    }

    // Si más adelante agregas: rango de precio, sort, etc., manéjalo aquí.
  };

  /* ====== Derivados: filtrado y paginación ====== */

  const filteredProducts = useMemo(() => {
    let base = Array.isArray(products) ? products : [];

    // Búsqueda por nombre
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter((p) => (p?.name ?? "").toLowerCase().includes(q));
    }

    // Filtro por categoría (match por id o name/slug)
    if (selectedCategory) {
      const wantId = String(selectedCategory.id).toLowerCase();
      const wantName = String(selectedCategory.name ?? selectedCategory.id).toLowerCase();

      base = base.filter((p) => {
        const tokens = getProductCategoryTokensFromProduct(p); // ['zapatos','hombre','123']
        return tokens.includes(wantId) || tokens.includes(wantName);
      });
    }

    // Ordenamiento opcional:
    // base = getSortedProducts(base, sortType, sortValue);

    return base;
  }, [products, searchQuery, selectedCategory]);

  const currentData = useMemo(
    () => filteredProducts.slice(offset, offset + pageLimit),
    [filteredProducts, offset]
  );

  // Clamp paginación si cambia el filtrado
  useEffect(() => {
    if (offset >= filteredProducts.length && filteredProducts.length > 0) {
      setCurrentPage(1);
      setOffset(0);
    }
  }, [filteredProducts, offset]);

  if (isStoreValid === null) return <div>Cargando tienda...</div>;

  return (
    <Fragment>
      <SEO
        title={` ${storeName}`}
        description={`Explora los productos disponibles en ${storeName}. Compra fácil y rápido.`}
      />

      <Breadcrumb
        pages={[
          { label: "BIENVENIDO", path: pathname },
          { label: "CATALOGO", path: pathname }
        ]}
      />

      <div className="shop-area pt-50 pb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <ShopTopbar
                getLayout={getLayout}
                getFilterSortParams={getFilterSortParams}
                productCount={products.length}
                sortedProductCount={filteredProducts.length} // total tras filtros
                categories={categories}
                loadingCats={loadingCats}
              />

              <ShopProducts layout={layout} products={currentData} />

              <div className="pro-pagination-style text-center mt-30">
                <Paginator
                  totalRecords={filteredProducts.length}
                  pageLimit={pageLimit}
                  pageNeighbours={2}
                  setOffset={setOffset}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  pageContainerClass="mb-0 mt-0"
                  pagePrevText="«"
                  pageNextText="»"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppFloatingButton storePhone={storePhone} />
    </Fragment>
  );
};

export default Catalogo;
