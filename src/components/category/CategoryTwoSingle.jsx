import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const CategoryTwoSingle = ({ data }) => {
  return (
    <div className="collection-product">
      <div className="collection-img">
        <Link to={data.link}>
          <img src={data.image} alt="" />
        </Link>
      </div>
      <div className="collection-content text-center">
        <span>{data.subtitle}</span>
        <h4>
          <Link to={data.link}>{data.title}</Link>
        </h4>
      </div>
    </div>
  );
};

CategoryTwoSingle.propTypes = {
  data: PropTypes.shape({}),
}

export default CategoryTwoSingle;
