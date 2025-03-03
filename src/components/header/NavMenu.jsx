import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { t } = useTranslation();
  
  return (
    <div
      className={clsx(sidebarMenu
          ? "sidebar-menu"
          : `main-menu ${menuWhiteClass ? menuWhiteClass : ""}`)}
    >
      <nav>
        <ul>
          <li>
             <Link to={"/home-fashion-three"}>
              {t("Inicio")}
           </Link>

          </li>
          
          <li>
          <Link to={"/shop-grid-right-sidebar"}>
              {t("Recargas")}
          </Link>
          </li> 
          <li>
            <Link to={"/shop-grid-paquet"}>
              {t("Paquetes")}
            </Link>
          </li>
          <li>
            <Link to={"/about"}>
              {t("Sobre Nosotros")}
            </Link>
         </li>  
          <li>
          <Link to={"/contact"}>
              {t("Contactanos")}
          </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

NavMenu.propTypes = {
  menuWhiteClass: PropTypes.string,
  sidebarMenu: PropTypes.bool,
};

export default NavMenu;
