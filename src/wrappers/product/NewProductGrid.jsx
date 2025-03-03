import React from "react";
import PropTypes from "prop-types";

import ProductGridTwo from "./ProductGridTwo";
import SectionTitleTwo from "../../components/section-title/SectionTitleTwo";

const NewProductGrid = ({ category, limit }) => {
  return (
    <div className="product-area pb-60 section-padding-1">
      <div className="container-fluid">
        <SectionTitleTwo
          titleText="Populares"
          subTitleText="No lo pienses mas y empieza a ¡Disfrutar!"
          positionClass="text-center"
          spaceClass="mb-60"
        />
        <div className="row five-column">
          <ProductGridTwo
            category={category}
            type="new"
            limit={limit}
            spaceBottomClass="mb-25"
          />
        </div>
      </div>
    </div>
  );
};

NewProductGrid.propTypes = {
  category: PropTypes.string,
  limit: PropTypes.number
};

export default NewProductGrid;
