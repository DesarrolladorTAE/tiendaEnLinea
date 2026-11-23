import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { FaHeart } from "react-icons/fa";
import { ImCart } from "react-icons/im";
import { FaShuffle } from "react-icons/fa6";
import { TfiSearch } from "react-icons/tfi";
import { RiAccountPinBoxFill } from "react-icons/ri";

const IconGroup = ({ iconWhiteClass }) => {
  const handleClick = (e) => {
    e.currentTarget.nextSibling.classList.toggle("active");
  };

  const triggerMobileMenu = () => {
    const offcanvasMobileMenu = document.querySelector(
      "#offcanvas-mobile-menu"
    );
    offcanvasMobileMenu.classList.add("active");
  };
  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);

  return (
    <div className={clsx("header-right-wrap", iconWhiteClass)}>
      <div className="same-style header-search d-none d-lg-block">
        <button className="search-active" onClick={(e) => handleClick(e)}>
          <TfiSearch style={{ fontSize: "24px" }} />
        </button>
        <div className="search-content">
          <form action="#">
            <input type="text" placeholder="Search" />
            <button className="button-search">
              <i className="pe-7s-search" />
            </button>
          </form>
        </div>
      </div>
      <div className="same-style account-setting d-none d-lg-block">
        <button
          className="account-setting-active"
          onClick={(e) => handleClick(e)}
        >
          <RiAccountPinBoxFill style={{ fontSize: "28px" }} />
        </button>
        <div className="account-dropdown">
          <ul>
            <li>
              <Link to={"/login-register"}>Login</Link>
            </li>
            <li>
              <Link to={"/login-register"}>Register</Link>
            </li>
            <li>
              <Link to={"/my-account"}>my account</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="same-style mobile-off-canvas d-block d-lg-none">
        <button
          className="mobile-aside-button"
          onClick={() => triggerMobileMenu()}
        >
          <i className="pe-7s-menu" />
        </button>
      </div>
    </div>
  );
};

IconGroup.propTypes = {
  iconWhiteClass: PropTypes.string,
};

export default IconGroup;
