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
}) => {
  const { cartItems = [] } = useSelector((state) => state.cart ?? {});

  const { wishlistItems = [] } = useSelector((state) => state.wishlist ?? {});

  const { compareItems = [] } = useSelector((state) => state.compare ?? {});

  const items = variantSearchActive ? variantResults : products;

  return (
    <Fragment>
      {items.map((item) => {
        const product = variantSearchActive ? item.product : item;

        const selectedVariant = variantSearchActive ? item.variant : null;

        const key = variantSearchActive
          ? `variant-${product.id}-${selectedVariant.id}`
          : `product-${product.id}`;

        return (
          <div key={key} className="col-6 col-sm-6 col-xl-4 mb-3 mb-sm-4">
            <ProductGridListSingle
              spaceBottomClass={spaceBottomClass}
              product={product}
              currency={currency}
              storeId={storeId}
              variantCard={variantSearchActive}
              selectedVariant={selectedVariant}
              requestedQty={variantSearchActive ? item.requestedQty : 1}
              availableStock={variantSearchActive ? item.stock : null}
              variantSize={variantSearchActive ? item.size : null}
              cartItem={cartItems.find((cartItem) =>
                variantSearchActive
                  ? Number(cartItem.variant_id) === Number(selectedVariant.id)
                  : Number(cartItem.id) === Number(product.id),
              )}
              wishlistItem={wishlistItems.find(
                (wishlistItem) =>
                  Number(wishlistItem.id) === Number(product.id),
              )}
              compareItem={compareItems.find(
                (compareItem) => Number(compareItem.id) === Number(product.id),
              )}
            />
          </div>
        );
      })}

      {variantSearchActive && items.length === 0 && (
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
            No encontramos variantes con las tallas y existencias solicitadas.
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
  storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ProductGridList;
