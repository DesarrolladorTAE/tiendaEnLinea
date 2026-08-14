import PropTypes from "prop-types";
import React, { Fragment } from "react";
import ShopTopAction from "../../components/product/ShopTopAction";

const ShopTopbar = ({
  getLayout,
  getFilterSortParams,
  productCount,
  sortedProductCount,
  categories = [],
  loadingCats = false,
  isStore464 = false,
  variantSearch = "",
}) => {
  return (
    <Fragment>
      <ShopTopAction
        getLayout={getLayout}
        getFilterSortParams={getFilterSortParams}
        productCount={productCount}
        sortedProductCount={sortedProductCount}
        categories={categories}
        loadingCats={loadingCats}
        isStore464={isStore464}
        variantSearch={variantSearch}
      />
    </Fragment>
  );
};

ShopTopbar.propTypes = {
  getFilterSortParams: PropTypes.func,
  getLayout: PropTypes.func,
  productCount: PropTypes.number,
  sortedProductCount: PropTypes.number,
  categories: PropTypes.array,
  loadingCats: PropTypes.bool,
  isStore464: PropTypes.bool,
  variantSearch: PropTypes.string,
};

export default ShopTopbar;
