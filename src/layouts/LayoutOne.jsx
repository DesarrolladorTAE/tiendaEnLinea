import React, { Fragment } from "react";
import PropTypes from "prop-types";
import HeaderOne from "../wrappers/header/HeaderOne";
import FooterOne from "../wrappers/footer/FooterOne";
import ScrollToTop from "../components/scroll-to-top";
import useRealtimeUserData from "../hooks/useRealtimeUserData";
import { useSelector } from "react-redux";

const LayoutOne = ({
  children,
  headerContainerClass = "container-fluid",
  headerTop = "visible",
  headerPaddingClass = "header-padding-2",
  headerPositionClass = ""
}) => {

  // Trae el estado de usuario desde Redux
  const { isAuthenticated, sessionLoaded } = useSelector((state) => state.user);

  // Solo ejecuta el hook cuando la sesión está lista y hay autenticación
 // ✅ SIEMPRE se llama al hook, y el propio hook decide internamente si hace algo
  useRealtimeUserData(sessionLoaded && isAuthenticated ? 5000 : null);

  return (
    <Fragment>
      <HeaderOne
        layout={headerContainerClass}
        top={headerTop}
        headerPaddingClass={headerPaddingClass}
        headerPositionClass={headerPositionClass}
      />
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
