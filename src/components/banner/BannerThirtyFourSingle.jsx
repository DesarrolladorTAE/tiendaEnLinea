import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";

const BannerThirtyFourSingle = ({ data, spaceBottomClass }) => {
  return (
      <div
        className={clsx("single-banner", spaceBottomClass)}
      >
        <Link to={data.url}>
          <img src={data.image} alt="" />
        </Link>
        <div className="banner-content-5 banner-content-5-white">
          <span>{data.title}</span>
          <h3>{data.subtitle}</h3>
          <Link to={data.url}>
            <i className="fa fa-long-arrow-right" />
          </Link>
        </div>
      </div>
  );
};

BannerThirtyFourSingle.propTypes = {
  data: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string
};

export default BannerThirtyFourSingle;
