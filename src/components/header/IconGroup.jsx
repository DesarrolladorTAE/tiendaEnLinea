import React from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { logoutUser } from "../../api"; // Importa la función de cierre de sesión
import { clearUser } from '../../store/slices/userSlice'; // Importa la acción para limpiar el usuario

const IconGroup = ({ iconWhiteClass }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = e => {
    e.currentTarget.nextSibling.classList.toggle("active");
  };

  const triggerMobileMenu = () => {
    const offcanvasMobileMenu = document.querySelector("#offcanvas-mobile-menu");
    offcanvasMobileMenu.classList.add("active");
  };

  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);

  const handleLogout = async (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(clearUser());
      navigate("/login");
      return;
    }
  
    try {
      await logoutUser();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(clearUser());
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error.response?.data || error.message);
      // Como fallback, limpiar y redirigir de todos modos
      dispatch(clearUser());
      navigate("/login");
    }
  };
  

  return (
    <div className={clsx("header-right-wrap", iconWhiteClass)}>
      <div className="same-style header-search d-none d-lg-block">
        <button className="search-active" onClick={e => handleClick(e)}>
          <i className="pe-7s-search" />
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
      <div className="same-style header-compare">
        <Link to={"/compare"}>
          <i className="pe-7s-shuffle" />
          <span className="count-style">
            {compareItems && compareItems.length ? compareItems.length : 0}
          </span>
        </Link>
      </div>
      <div className="same-style header-wishlist">
        <Link to={"/wishlist"}>
          <i className="pe-7s-like" />
          <span className="count-style">
            {wishlistItems && wishlistItems.length ? wishlistItems.length : 0}
          </span>
        </Link>
      </div>
      <div className="same-style cart-wrap d-none d-lg-block">
        <button className="icon-cart" onClick={e => handleClick(e)}>
          <i className="pe-7s-shopbag" />
          <span className="count-style">
            {cartItems && cartItems.length ? cartItems.length : 0}
          </span>
        </button>
        {/* menu cart */}
        <MenuCart />
      </div>
      <div className="same-style cart-wrap d-block d-lg-none">
        <Link className="icon-cart" to={"/cart"}>
          <i className="pe-7s-shopbag" />
          <span className="count-style">
            {cartItems && cartItems.length ? cartItems.length : 0}
          </span>
        </Link>
      </div>
      <div className="same-style mobile-off-canvas d-block d-lg-none">
        <button className="mobile-aside-button" onClick={() => triggerMobileMenu()}>
          <i className="pe-7s-menu" />
        </button>
      </div>
      {/* Nuevos iconos */}
      <div className="same-style header-contacts">
        <Link to={"/mycontacts"}>
          <i className="pe-7s-users" /> {/* Icono de Contactos */}
        </Link>
      </div>
      <div className="same-style header-wallet">
        <Link to={"/recargar-saldo"}>
          <i className="pe-7s-wallet" /> {/* Icono de Cartera Electrónica */}
        </Link>
      </div>
      <div className="same-style account-setting d-none d-lg-block">
        <button className="account-setting-active" onClick={e => handleClick(e)}>
          <i className="pe-7s-user-female" />
        </button>
        <div className="account-dropdown">
          <ul>
            <li>
              <Link to={"/my-account"}>Mi Cuenta</Link>
            </li>
            <li>
              <Link to={"/wallet"}>Tarjetas</Link>
            </li>
            <li>
              <Link to={"*"}>Mis Compras</Link>
            </li>
            <li>
              <Link to={"*"}>Librerias</Link>
            </li>
            <li>
              <Link to="/" onClick={handleLogout}>Cerrar Sesión</Link> {/* Enlace de cerrar sesión */}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

IconGroup.propTypes = {
  iconWhiteClass: PropTypes.string,
};



export default IconGroup;
