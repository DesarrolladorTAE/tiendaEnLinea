import React from "react";
import PropTypes from "prop-types";

import { setActiveLayout } from "../../helpers/product";

const ShopTopAction = ({ getLayout, getFilterSortParams, productCount, sortedProductCount }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  return (
    <div className="shop-top-bar mb-35">
      <div className="select-shoing-wrap">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            getFilterSortParams("searchQuery", e.target.value);
          }}
          className="shop-select"
        />
        <div className="shop-select">
          <select onChange={(e) => getFilterSortParams("filterSort", e.target.value)}>
            <option value="default">Ordenar Por</option>
            <option value="priceHighToLow">Precio - Alto a Bajo</option>
            <option value="priceLowToHigh">Precio - Bajo a Alto</option>
          </select>
        </div>
        <p>
          Mostrando {sortedProductCount} de {productCount} productos
        </p>
      </div>

      <div className="shop-tab">
        <button
          onClick={(e) => {
            getLayout("grid two-column");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-th-large" />
        </button>
        <button
          onClick={(e) => {
            getLayout("grid three-column");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-th" />
        </button>
        <button
          onClick={(e) => {
            getLayout("list");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-list-ul" />
        </button>
      </div>
    </div>
  );
};

ShopTopAction.propTypes = {
  getFilterSortParams: PropTypes.func,
  getLayout: PropTypes.func,
  productCount: PropTypes.number,
  sortedProductCount: PropTypes.number,
};

export default ShopTopAction;
