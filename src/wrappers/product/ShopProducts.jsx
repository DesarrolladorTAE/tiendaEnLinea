import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import ProductgridList from "./ProductgridList";

const ShopProducts = ({
  products = [],
  layout,
  variantResults = [],
  variantSearchActive = false,
  storeId,
}) => {
  const currency = {
    currencySymbol: "MX$",
    currencyRate: 1,
  };

  return (
    <div className="shop-bottom-area mt-35">
      <div className={clsx("row", layout)}>
        <ProductgridList
          products={products}
          variantResults={variantResults}
          variantSearchActive={variantSearchActive}
          storeId={storeId}
          spaceBottomClass="mb-25"
          currency={currency}
        />
      </div>
    </div>
  );
};

ShopProducts.propTypes = {
  layout: PropTypes.string,
  products: PropTypes.array,
  variantResults: PropTypes.array,
  variantSearchActive: PropTypes.bool,
  storeId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default ShopProducts;