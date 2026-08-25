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
  columns = 3,
  template = "negocio",
  groupVariants = false,
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
          columns={columns}
          template={template}
          groupVariants={groupVariants}
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
  columns: PropTypes.number,
  template: PropTypes.string,
  groupVariants: PropTypes.bool,
};

export default ShopProducts;
