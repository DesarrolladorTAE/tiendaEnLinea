import React from "react";
import { Fragment } from "react";
import PropTypes from "prop-types";
import ScrollToTop from "../components/scroll-to-top";

const LayoutOne = ({
  children,
}) => {
  return (
    <Fragment>
      {children}
      <ScrollToTop />
    </Fragment>
  );
};

LayoutOne.propTypes = {
  children: PropTypes.node,
};

export default LayoutOne;
