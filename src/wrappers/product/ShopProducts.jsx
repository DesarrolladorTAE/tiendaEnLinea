import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import ProductgridList from "./ProductgridList";

const ShopProducts = ({ products, layout }) => {
  const currency = {
    currencySymbol: "MX$", // Define aquí la divisa que deseas
    currencyRate: 1
  };

  return (
    <div className="shop-bottom-area mt-35">
      <div className={clsx("row", layout)}>
        <ProductgridList
          products={products}
          spaceBottomClass="mb-25"
          currency={currency} // <-- se pasa como prop
        />
      </div>
    </div>
  );
};


ShopProducts.propTypes = {
  layout: PropTypes.string,
  products: PropTypes.array
};

export default ShopProducts;
