import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const CategoryFourSingle = ({ data, sliderClass }) => {
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
        <Link
          to={data.link}
          className="collection-btn"
        >
          SHOP NOW
        </Link>
      </div>
    </div>
  );
};

CategoryFourSingle.propTypes = {
  data: PropTypes.shape({}),
  sliderClass: PropTypes.string
};

export default CategoryFourSingle;
