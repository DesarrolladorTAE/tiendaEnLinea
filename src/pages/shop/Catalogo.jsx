import React, { Fragment, useState, useEffect, useMemo } from "react";
import Paginator from "react-hooks-paginator";
import { useLocation, useParams } from "react-router-dom";
import SEO from "../../components/seo";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";
import { useStoreData } from "../../hooks/useStoreData";
import WhatsAppFloatingButton from "../../components/WhatsAppFloatingButton";
import axios from "axios";

// 👇 monkey-patch para quitar el warning en dev (react-hooks-paginator con React 18)
if (Paginator && "defaultProps" in Paginator) {
  try {
    // eslint-disable-next-line no-param-reassign
    Paginator.defaultProps = undefined;
  } catch {}
}

const API_BASE = "https://mitiendaenlineamx.com.mx/api";
const pageLimit = 12;

/* ========================= Helpers ========================= */

function getProductCategoryTokensFromProduct(p) {
  const out = new Set();

  const push = (v) => {
    if (v === null || v === undefined) return;
    out.add(String(v).toLowerCase());
  };

  if (Array.isArray(p?.categories)) {
    p.categories.forEach((c) => {
      if (!c) return;
      if (typeof c === "string" || typeof c === "number") {
        push(c);
      } else if (typeof c === "object") {
        push(c.id);
        push(c.name);
        push(c.slug);
        push(c.parent_id);
      }
    });
  }

  const c = p?.category;
  if (Array.isArray(c)) {
    c.forEach((x) => push(x));
  } else if (typeof c === "string" || typeof c === "number") {
    push(c);
  } else if (c && typeof c === "object") {
    push(c.id);
    push(c.name);
    push(c.slug);
  }

  push(p?.categoryId);
  push(p?.category_id);
  push(p?.catId);
  push(p?.categoria_id);
  push(p?.categoriaId);

  if (Array.isArray(p?.tags)) p.tags.forEach((t) => push(t));

  return Array.from(out);
}

function buildChildrenIndex(categories) {
  const childrenByParent = new Map();

  (categories || []).forEach((c) => {
    if (!c) return;

    if (Array.isArray(c.children) && c.children.length) {
      childrenByParent.set(String(c.id), c.children);
      return;
    }

    if (c.parent_id != null) {
      const key = String(c.parent_id);
      const arr = childrenByParent.get(key) || [];
      arr.push(c);
      childrenByParent.set(key, arr);
    }
  });

  return childrenByParent;
}

/* ========================= Componente ========================= */

const Catalogo = ({ storeId: storeIdProp, storeSlug: storeSlugProp }) => {
  const params = useParams();

  // ✅ IMPORTANTE: usa prop si viene, si no params
  const storeSlug = storeSlugProp ?? params.storeSlug;

  const { isStoreValid, products, storePhone, storeName } = useStoreData(storeSlug);
  const { pathname } = useLocation();

  const [layout, setLayout] = useState("grid three-column");

  // filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // paginación
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // categorías
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const storeId = storeIdProp;

  // ✅ NO TOCO TU ENDPOINT: lo dejo igual que antes
  useEffect(() => {
    let alive = true;
    setLoadingCats(true);

    axios
      .get(`${API_BASE}/public/stores/slug/${storeSlug}/categories?mode=tree`)
      .then(({ data }) => {
        if (!alive) return;
        setCategories(data?.parents ?? []);
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

  const getFilterSortParams = (type, value) => {
    if (type === "searchQuery") {
      setSearchQuery(value ?? "");
      setCurrentPage(1);
      setOffset(0);
      return;
    }
    if (type === "category") {
      setSelectedCategory(value || null);
      setCurrentPage(1);
      setOffset(0);
      return;
    }
  };

  const childrenIndex = useMemo(() => buildChildrenIndex(categories), [categories]);

  const filteredProducts = useMemo(() => {
    let base = Array.isArray(products) ? products : [];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter((p) => String(p?.name ?? "").toLowerCase().includes(q));
    }

    if (selectedCategory?.id) {
      const wantId = String(selectedCategory.id).toLowerCase();
      const wantName = String(selectedCategory.name ?? "").toLowerCase();

      const tokensMatchAny = (p, ids, names) => {
        const tokens = getProductCategoryTokensFromProduct(p).map((t) => String(t).toLowerCase());
        return tokens.some((t) => ids.has(t) || names.has(t));
      };

      if (selectedCategory.type === "parent") {
        const parent = categories.find((c) => String(c.id) === String(selectedCategory.id));

        const children =
          parent?.children ??
          categories.filter((c) => String(c.parent_id) === String(selectedCategory.id));

        const ids = new Set([wantId]);
        const names = new Set([wantName]);

        children.forEach((c) => {
          ids.add(String(c.id).toLowerCase());
          names.add(String(c.name).toLowerCase());
        });

        base = base.filter((p) => tokensMatchAny(p, ids, names));
      } else {
        const ids = new Set([wantId]);
        const names = new Set([wantName]);
        base = base.filter((p) => tokensMatchAny(p, ids, names));
      }
    }

    return base;
  }, [products, searchQuery, selectedCategory, childrenIndex, categories]);

  const currentData = useMemo(
    () => filteredProducts.slice(offset, offset + pageLimit),
    [filteredProducts, offset]
  );

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
                productCount={Array.isArray(products) ? products.length : 0}
                sortedProductCount={filteredProducts.length}
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

      {/* ✅ CLAVE: pasa storeSlug para que el botón resuelva storeId por /bootstrap */}
      <WhatsAppFloatingButton
        storePhone={storePhone}
        storeId={storeId}
        storeSlug={storeSlug}
      />
    </Fragment>
  );
};

export default Catalogo;
