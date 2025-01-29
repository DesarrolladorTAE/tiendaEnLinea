import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const ImageSliderOneSingle = ({ data }) => {
  return (
    <div className="single-image">
      <Link to={data.link}>
        <img src={data.image} alt="" />
      </Link>
    </div>
  );
};

ImageSliderOneSingle.propTypes = {
  data: PropTypes.shape({})
};

export default ImageSliderOneSingle;
