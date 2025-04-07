import React from "react";
import { Fragment } from "react";
import PropTypes from "prop-types";
import HeaderLogin from "../wrappers/header/HeaderLogin";
import FooterOne from "../wrappers/footer/FooterOne";
import ScrollToTop from "../components/scroll-to-top";

const LayoutOne = ({
  children,
  headerContainerClass = "",
  headerTop = "",
  headerPaddingClass = "",
  headerPositionClass = ""
}) => {
  return (
    <Fragment>
      {/* <HeaderLogin
        layout={headerContainerClass}
        top={headerTop}
        headerPaddingClass={headerPaddingClass}
        headerPositionClass={headerPositionClass}
      /> */}
      {children}
      <FooterOne
        backgroundColorClass="bg-gray"
        spaceTopClass="pt-100"
        spaceBottomClass="pb-70"
      />
      <ScrollToTop />
    </Fragment>
  );
};

LayoutOne.propTypes = {
  children: PropTypes.node,
  headerContainerClass: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  headerTop: PropTypes.string
};

export default LayoutOne;
