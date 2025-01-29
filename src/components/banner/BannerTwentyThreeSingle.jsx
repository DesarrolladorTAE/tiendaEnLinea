import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";

const BannerTwentyThreeSingle = ({ data, spaceBottomClass }) => {
  return (
      <div className={clsx("single-banner", spaceBottomClass)}>
        <Link to={data.link}>
          <img src={data.image} alt="" />
        </Link>
      </div>
  );
};

BannerTwentyThreeSingle.propTypes = {
  data: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string
};

export default BannerTwentyThreeSingle;
