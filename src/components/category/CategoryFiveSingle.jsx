import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const CategoryFiveSingle = ({ data }) => {
  return (
      <div className="category-grid">
        <div className="category-grid__image">
          <Link to={data.url}>
            <img
              src={data.image}
              alt=""
              className="img-fluid"
            />
          </Link>
        </div>
        <div className="category-grid__content">
          <Link to={data.url}>{data.title}</Link>
        </div>
      </div>
  );
};

CategoryFiveSingle.propTypes = {
  data: PropTypes.shape({})
};

export default CategoryFiveSingle;
