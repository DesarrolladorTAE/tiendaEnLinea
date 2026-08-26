import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import ProductGridListSingle from "../../components/product/ProductGridListSingle";

const ProductGridList = ({
  products = [],
  variantResults = [],
  variantSearchActive = false,
  storeId,
  spaceBottomClass,
  currency,
  columns = 3,
  template = "negocio",
  groupVariants = false,
  storefrontSettings = {}, storefrontTheme = {}, storefrontColors = {}, storeSlug,
}) => {
  const desktopClass = columns === 2 ? "col-xl-6" : columns === 4 ? "col-xl-3" : "col-xl-4";
  const { cartItems = [] } = useSelector(
    (state) => state.cart ?? {},
  );

  const { wishlistItems = [] } = useSelector(
    (state) => state.wishlist ?? {},
  );

  const { compareItems = [] } = useSelector(
    (state) => state.compare ?? {},
  );

  // =====================================================
  // BÚSQUEDA NORMAL
  // =====================================================
  if (!variantSearchActive) {
    return (
      <Fragment>
        {products.map((product) => {
          if (!product?.id) return null;

          return (
            <div
              key={`product-${product.id}`}
              className={`col-6 col-sm-6 ${desktopClass} mb-3 mb-sm-4`}
            >
              <ProductGridListSingle
                spaceBottomClass={spaceBottomClass}
                product={product}
                currency={currency}
                storeId={storeId}
                variantCard={false}
                matchingVariants={[]}
                enableEffects={template === "avanzado"}
                storefrontTemplate={template}
                storefrontSettings={storefrontSettings}
                storefrontTheme={storefrontTheme}
                storefrontColors={storefrontColors}
                storeSlug={storeSlug}
                wishlistItem={wishlistItems.find(
                  (item) =>
                    Number(item.id) === Number(product.id),
                )}
                compareItem={compareItems.find(
                  (item) =>
                    Number(item.id) === Number(product.id),
                )}
              />
            </div>
          );
        })}
      </Fragment>
    );
  }

  // =====================================================
  // BÚSQUEDA POR EXISTENCIAS
  // UNA TARJETA POR PRODUCTO
  // =====================================================
  return (
    <Fragment>
      {(groupVariants ? variantResults : variantResults.flatMap((result) =>
        (result?.matchingVariants || []).map((match) => ({ ...result, matchingVariants: [match], singleMatch: match })),
      )).map((result) => {
        const product = result?.product;

        const matchingVariants = Array.isArray(
          result?.matchingVariants,
        )
          ? result.matchingVariants
          : [];

        if (!product?.id) {
          return null;
        }

        return (
          <div
            key={`variant-${product.id}-${result?.singleMatch?.variant?.id || "group"}`}
            className={`col-12 col-md-6 ${desktopClass} mb-3 mb-sm-4`}
          >
            <ProductGridListSingle
              spaceBottomClass={spaceBottomClass}
              product={product}
              currency={currency}
              storeId={storeId}

              // IMPORTANTE
              variantCard={!groupVariants}
              variantGroupCard={groupVariants}
              matchingVariants={matchingVariants}
              selectedVariant={result?.singleMatch?.variant || null}
              requestedQty={result?.singleMatch?.requestedQty || 1}
              availableStock={result?.singleMatch?.stock ?? null}
              variantSize={result?.singleMatch?.size || null}
              enableEffects={template === "avanzado"}
              storefrontTemplate={template}
              storefrontSettings={storefrontSettings}
              storefrontTheme={storefrontTheme}
              storefrontColors={storefrontColors}
              storeSlug={storeSlug}

              wishlistItem={wishlistItems.find(
                (item) =>
                  Number(item.id) === Number(product.id),
              )}

              compareItem={compareItems.find(
                (item) =>
                  Number(item.id) === Number(product.id),
              )}
            />
          </div>
        );
      })}

      {variantResults.length === 0 && (
        <div className="col-12">
          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              color: "rgba(255,255,255,0.82)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              textAlign: "center",
            }}
          >
            No encontramos productos que puedan cubrir todas
            las tallas y cantidades solicitadas.
          </div>
        </div>
      )}
    </Fragment>
  );
};

ProductGridList.propTypes = {
  products: PropTypes.array,
  variantResults: PropTypes.array,
  variantSearchActive: PropTypes.bool,
  spaceBottomClass: PropTypes.string,

  currency: PropTypes.shape({
    currencySymbol: PropTypes.string,
    currencyRate: PropTypes.number,
  }),

  storeId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  columns: PropTypes.number,
  template: PropTypes.string,
  groupVariants: PropTypes.bool,
  storefrontSettings: PropTypes.object,
  storefrontTheme: PropTypes.object,
  storefrontColors: PropTypes.object,
  storeSlug: PropTypes.string,
};

export default ProductGridList;
