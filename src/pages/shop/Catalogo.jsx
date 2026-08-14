import React, {
  Fragment,
  useState,
  useEffect,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import Paginator from "react-hooks-paginator";
import {
  useLocation,
  useParams,
} from "react-router-dom";
import axios from "axios";

import SEO from "../../components/seo";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";
import { useStoreData } from "../../hooks/useStoreData";
import WhatsAppFloatingButton from "../../components/WhatsAppFloatingButton";

// Monkey-patch para quitar el warning en desarrollo
// de react-hooks-paginator con React 18.
if (Paginator && "defaultProps" in Paginator) {
  try {
    Paginator.defaultProps = undefined;
  } catch {
    // No es necesario realizar otra acción.
  }
}

const API_BASE =
  "https://mitiendaenlineamx.com.mx/api";

const pageLimit = 12;

/* =========================================================
 * Helpers de categorías
 * ======================================================= */

function getProductCategoryTokensFromProduct(product) {
  const tokens = new Set();

  const push = (value) => {
    if (value === null || value === undefined) {
      return;
    }

    tokens.add(
      String(value)
        .trim()
        .toLowerCase()
    );
  };

  if (Array.isArray(product?.categories)) {
    product.categories.forEach((category) => {
      if (!category) return;

      if (
        typeof category === "string" ||
        typeof category === "number"
      ) {
        push(category);
        return;
      }

      if (typeof category === "object") {
        push(category.id);
        push(category.name);
        push(category.slug);
        push(category.parent_id);
      }
    });
  }

  const category = product?.category;

  if (Array.isArray(category)) {
    category.forEach((item) => {
      if (
        typeof item === "object" &&
        item !== null
      ) {
        push(item.id);
        push(item.name);
        push(item.slug);
        push(item.parent_id);
      } else {
        push(item);
      }
    });
  } else if (
    typeof category === "string" ||
    typeof category === "number"
  ) {
    push(category);
  } else if (
    category &&
    typeof category === "object"
  ) {
    push(category.id);
    push(category.name);
    push(category.slug);
    push(category.parent_id);
  }

  push(product?.categoryId);
  push(product?.category_id);
  push(product?.catId);
  push(product?.categoria_id);
  push(product?.categoriaId);

  if (Array.isArray(product?.tags)) {
    product.tags.forEach((tag) => {
      if (
        typeof tag === "object" &&
        tag !== null
      ) {
        push(tag.id);
        push(tag.name);
        push(tag.slug);
      } else {
        push(tag);
      }
    });
  }

  return Array.from(tokens);
}

/* =========================================================
 * Helpers de búsqueda de variantes
 * ======================================================= */

/**
 * Formatos permitidos:
 *
 * CH9,M3,XL3
 * CH-9,M-3,XL-3
 * CH 9, M 3, XL 3
 */
function parseVariantSearch(value) {
  const input = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!input) return [];

  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(
        /^(.+?)[\s-]*(\d+)$/
      );

      if (!match) return null;

      const size = match[1]
        .trim()
        .replace(/[\s_-]+/g, "")
        .toUpperCase();

      const qty = Number(match[2]);

      if (
        !size ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return null;
      }

      return {
        size,
        qty,
      };
    })
    .filter(Boolean);
}

/**
 * Obtiene la talla desde los atributos de la variante.
 * Si no existen atributos, utiliza variant.name.
 */
function getVariantSize(variant) {
  const directName = String(
    variant?.name ?? ""
  ).trim();

  const attributes = Array.isArray(
    variant?.variant_attributes
  )
    ? variant.variant_attributes
    : Array.isArray(variant?.attributes)
    ? variant.attributes
    : [];

  const sizeAttribute = attributes.find(
    (attribute) => {
      const name = String(
        attribute?.name ?? ""
      )
        .trim()
        .toLowerCase();

      return (
        name === "talla" ||
        name === "size" ||
        name.includes("talla") ||
        name.includes("size")
      );
    }
  );

  return String(
    sizeAttribute?.value ?? directName
  )
    .trim()
    .replace(/[\s_-]+/g, "")
    .toUpperCase();
}

/**
 * Obtiene la existencia total de una variante.
 */
function getVariantStock(
  variant,
  useWarehouseInventory
) {
  if (
    useWarehouseInventory &&
    Array.isArray(variant?.warehouse_stocks)
  ) {
    return variant.warehouse_stocks.reduce(
      (total, row) =>
        total +
        (
          Number(
            row?.stock ??
            row?.qty
          ) || 0
        ),
      0
    );
  }

  return Number(variant?.stock) || 0;
}

/* =========================================================
 * Componente
 * ======================================================= */

const Catalogo = ({
  storeId: storeIdProp,
  storeSlug: storeSlugProp,
}) => {
  const params = useParams();
  const { pathname } = useLocation();

  const storeSlug =
    storeSlugProp ??
    params.storeSlug;

  const {
    isStoreValid,
    products,
    storePhone,
    storeName,
  } = useStoreData(storeSlug);

  /*
   * El fallback por slug permite identificar la tienda
   * aunque el componente padre no mande storeId.
   */
  const storeId = Number(
    storeIdProp ??
    (
      storeSlug === "ans-machado-uniformes"
        ? 464
        : null
    )
  );

  const isStore464 = storeId === 464;

  // Diseño de productos.
  const [layout, setLayout] = useState(
    "grid three-column"
  );

  // Filtros normales.
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(null);

  // Búsqueda especial de variantes.
  const [
    variantSearch,
    setVariantSearch,
  ] = useState("");

  // Paginación.
  const [
    offset,
    setOffset,
  ] = useState(0);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  // Categorías.
  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loadingCats,
    setLoadingCats,
  ] = useState(true);

  /* =======================================================
   * Carga de categorías
   * ===================================================== */

  useEffect(() => {
    let alive = true;

    setLoadingCats(true);

    axios
      .get(
        `${API_BASE}/public/stores/slug/${storeSlug}/categories?mode=tree`
      )
      .then(({ data }) => {
        if (!alive) return;

        setCategories(
          Array.isArray(data?.parents)
            ? data.parents
            : []
        );
      })
      .catch(() => {
        if (!alive) return;
        setCategories([]);
      })
      .finally(() => {
        if (alive) {
          setLoadingCats(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [storeSlug]);

  /* =======================================================
   * Eventos de filtros
   * ===================================================== */

  const getLayout = (nextLayout) => {
    setLayout(nextLayout);
  };

  const getFilterSortParams = (
    type,
    value
  ) => {
    if (type === "searchQuery") {
      setSearchQuery(value ?? "");
      setCurrentPage(1);
      setOffset(0);
      return;
    }

    if (type === "variantSearch") {
      setVariantSearch(value ?? "");
      setCurrentPage(1);
      setOffset(0);
      return;
    }

    if (type === "category") {
      setSelectedCategory(
        value || null
      );
      setCurrentPage(1);
      setOffset(0);
    }
  };

  /* =======================================================
   * Filtrado normal de productos
   * ===================================================== */

  const filteredProducts = useMemo(() => {
    let result = Array.isArray(products)
      ? products
      : [];

    const query = searchQuery
      .trim()
      .toLowerCase();

    if (query) {
      result = result.filter((product) =>
        String(product?.name ?? "")
          .toLowerCase()
          .includes(query)
      );
    }

    if (!selectedCategory?.id) {
      return result;
    }

    const selectedId = String(
      selectedCategory.id
    ).toLowerCase();

    const selectedName = String(
      selectedCategory.name ?? ""
    ).toLowerCase();

    const tokensMatchAny = (
      product,
      ids,
      names
    ) => {
      const productTokens =
        getProductCategoryTokensFromProduct(
          product
        );

      return productTokens.some(
        (token) =>
          ids.has(
            String(token).toLowerCase()
          ) ||
          names.has(
            String(token).toLowerCase()
          )
      );
    };

    if (
      selectedCategory.type === "parent"
    ) {
      const parent = categories.find(
        (category) =>
          String(category.id) ===
          String(selectedCategory.id)
      );

      const children =
        parent?.children ??
        categories.filter(
          (category) =>
            String(category.parent_id) ===
            String(selectedCategory.id)
        );

      const ids = new Set([
        selectedId,
      ]);

      const names = new Set([
        selectedName,
      ]);

      children.forEach((category) => {
        ids.add(
          String(category.id).toLowerCase()
        );

        names.add(
          String(
            category.name ?? ""
          ).toLowerCase()
        );
      });

      return result.filter((product) =>
        tokensMatchAny(
          product,
          ids,
          names
        )
      );
    }

    const ids = new Set([
      selectedId,
    ]);

    const names = new Set([
      selectedName,
    ]);

    return result.filter((product) =>
      tokensMatchAny(
        product,
        ids,
        names
      )
    );
  }, [
    products,
    searchQuery,
    selectedCategory,
    categories,
  ]);

  /* =======================================================
   * Interpretación de la búsqueda especial
   * ===================================================== */

  const variantRequests = useMemo(() => {
    if (!isStore464) {
      return [];
    }

    return parseVariantSearch(
      variantSearch
    );
  }, [
    isStore464,
    variantSearch,
  ]);

  /* =======================================================
   * Resultados individuales de variantes
   * ===================================================== */

  const variantResults = useMemo(() => {
    if (
      !isStore464 ||
      variantRequests.length === 0
    ) {
      return [];
    }

    const requestsBySize = new Map(
      variantRequests.map((request) => [
        request.size,
        request.qty,
      ])
    );

    /*
     * Partimos de filteredProducts para respetar también
     * el nombre y la categoría seleccionados.
     */
    return filteredProducts.flatMap(
      (product) => {
        const variants = Array.isArray(
          product?.variants
        )
          ? product.variants
          : [];

        return variants
          .filter(
            (variant) =>
              variant?.is_active !== false
          )
          .map((variant) => {
            const size = getVariantSize(
              variant
            );

            const requestedQty =
              requestsBySize.get(size);

            if (!requestedQty) {
              return null;
            }

            const stock =
              getVariantStock(
                variant,
                Boolean(
                  product?.use_warehouse_inventory
                )
              );

            /*
             * Solamente se muestra si tiene la cantidad
             * solicitada o una existencia mayor.
             */
            if (stock < requestedQty) {
              return null;
            }

            return {
              product,
              variant,
              size,
              stock,
              requestedQty,
            };
          })
          .filter(Boolean);
      }
    );
  }, [
    isStore464,
    filteredProducts,
    variantRequests,
  ]);

  const isVariantSearchActive =
    isStore464 &&
    variantRequests.length > 0;

  /* =======================================================
   * Paginación
   * ===================================================== */

  const currentData = useMemo(
    () =>
      filteredProducts.slice(
        offset,
        offset + pageLimit
      ),
    [
      filteredProducts,
      offset,
    ]
  );

  const paginatedVariantResults =
    useMemo(
      () =>
        variantResults.slice(
          offset,
          offset + pageLimit
        ),
      [
        variantResults,
        offset,
      ]
    );

  const activeTotal =
    isVariantSearchActive
      ? variantResults.length
      : filteredProducts.length;

  /*
   * Regresa a la primera página si el filtro deja
   * el offset actual fuera del número de resultados.
   */
  useEffect(() => {
    if (
      offset > 0 &&
      offset >= activeTotal
    ) {
      setCurrentPage(1);
      setOffset(0);
    }
  }, [
    activeTotal,
    offset,
  ]);

  /*
   * Todos los hooks deben estar antes de este retorno.
   */
  if (isStoreValid === null) {
    return (
      <div>
        Cargando tienda...
      </div>
    );
  }

  return (
    <Fragment>
      <SEO
        title={` ${storeName}`}
        description={
          `Explora los productos disponibles en ${storeName}. ` +
          "Compra fácil y rápido."
        }
      />

      <Breadcrumb
        pages={[
          {
            label: "BIENVENIDO",
            path: pathname,
          },
          {
            label: "CATÁLOGO",
            path: pathname,
          },
        ]}
      />

      <div className="shop-area pt-50 pb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <ShopTopbar
                getLayout={getLayout}
                getFilterSortParams={
                  getFilterSortParams
                }
                productCount={
                  Array.isArray(products)
                    ? products.length
                    : 0
                }
                sortedProductCount={
                  activeTotal
                }
                categories={categories}
                loadingCats={loadingCats}
                isStore464={isStore464}
                variantSearch={
                  variantSearch
                }
              />

              <ShopProducts
                layout={layout}
                products={currentData}
                variantResults={
                  paginatedVariantResults
                }
                variantSearchActive={
                  isVariantSearchActive
                }
                storeId={storeId}
              />

              {activeTotal > pageLimit && (
                <div className="pro-pagination-style text-center mt-30">
                  <Paginator
                    totalRecords={
                      activeTotal
                    }
                    pageLimit={pageLimit}
                    pageNeighbours={2}
                    setOffset={setOffset}
                    currentPage={
                      currentPage
                    }
                    setCurrentPage={
                      setCurrentPage
                    }
                    pageContainerClass="mb-0 mt-0"
                    pagePrevText="«"
                    pageNextText="»"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WhatsAppFloatingButton
        storePhone={storePhone}
        storeId={storeId}
        storeSlug={storeSlug}
      />
    </Fragment>
  );
};

Catalogo.propTypes = {
  storeId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  storeSlug: PropTypes.string,
};

export default Catalogo;