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
           <Link to={"/home-fashion-three"}>
              {t("home")}
           </Link>

          <li>
          <Link to={"/shop-grid-right-sidebar"}>
              {t("shop")}
          </Link>
          </li> 
          <li>
            <Link to={"/login"}>
              {t("collection")}
            </Link>
          </li>
          <li>
            <Link to={"/"}>
              {t("pages")}
              {sidebarMenu ? (
                <span>
                  <i className="fa fa-angle-right"></i>
                </span>
              ) : (
                <i className="fa fa-angle-down" />
              )}
            </Link>
            <ul className="submenu">
              <li>
                <Link to={"/cart"}>
                  {t("cart")}
                </Link>
              </li>
              <li>
                <Link to={"/checkout"}>
                  {t("checkout")}
                </Link>
              </li>
              <li>
                <Link to={"/wishlist"}>
                  {t("wishlist")}
                </Link>
              </li>
              <li>
                <Link to={"/compare"}>
                  {t("compare")}
                </Link>
              </li>
              <li>
                <Link to={"/my-account"}>
                  {t("my_account")}
                </Link>
              </li>
              <li>
                <Link to={"/login-register"}>
                  {t("login_register")}
                </Link>
              </li>
              <li>
                <Link to={"/about"}>
                  {t("about_us")}
                </Link>
              </li>
              <li>
                <Link to={"/contact"}>
                  {t("contact_us")}
                </Link>
              </li>
              <li>
                <Link to={"/not-found"}>
                  {t("404_page")}
                </Link>
              </li>
            </ul>
          </li>
          <li>
          <Link to={"/contact"}>
              {t("contact_us")}
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
