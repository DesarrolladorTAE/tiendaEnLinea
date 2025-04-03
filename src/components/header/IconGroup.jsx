import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { logoutUser } from "../../api";
import { clearUser } from '../../store/slices/userSlice';
import AnimatedModal from "../AnimatedModal"; // Asegúrate de tener esta ruta bien

const IconGroup = ({ iconWhiteClass }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showByeModal, setShowByeModal] = useState(false);

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

      // Mostrar modal de despedida antes de redirigir
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/login");
      }, 3000);
    } catch (error) {
      dispatch(clearUser());
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/login");
      }, 3000);
    }
  };

  return (
    <>
      <div className={clsx("header-right-wrap", iconWhiteClass)}>
        {/* Iconos de cabecera */}
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
              {compareItems?.length || 0}
            </span>
          </Link>
        </div>
        <div className="same-style header-wishlist">
          <Link to={"/wishlist"}>
            <i className="pe-7s-like" />
            <span className="count-style">
              {wishlistItems?.length || 0}
            </span>
          </Link>
        </div>
        <div className="same-style cart-wrap d-none d-lg-block">
          <button className="icon-cart" onClick={e => handleClick(e)}>
            <i className="pe-7s-shopbag" />
            <span className="count-style">
              {cartItems?.length || 0}
            </span>
          </button>
          <MenuCart />
        </div>
        <div className="same-style cart-wrap d-block d-lg-none">
          <Link className="icon-cart" to={"/cart"}>
            <i className="pe-7s-shopbag" />
            <span className="count-style">
              {cartItems?.length || 0}
            </span>
          </Link>
        </div>
        <div className="same-style mobile-off-canvas d-block d-lg-none">
          <button className="mobile-aside-button" onClick={triggerMobileMenu}>
            <i className="pe-7s-menu" />
          </button>
        </div>
        <div className="same-style header-contacts">
          <Link to={"/mycontacts"}>
            <i className="pe-7s-users" />
          </Link>
        </div>
        <div className="same-style header-wallet">
          <Link to={"/recargar-saldo"}>
            <i className="pe-7s-wallet" />
          </Link>
        </div>
        <div className="same-style account-setting d-none d-lg-block">
          <button className="account-setting-active" onClick={e => handleClick(e)}>
            <i className="pe-7s-user-female" />
          </button>
          <div className="account-dropdown">
            <ul>
              <li><Link to={"/my-account"}>Mi Cuenta</Link></li>
              <li><Link to={"/wallet"}>Tarjetas</Link></li>
              <li><Link to={"*"}>Mis Compras</Link></li>
              <li><Link to={"*"}>Librerías</Link></li>
              <li>
                <Link to="/" onClick={handleLogout}>Cerrar Sesión</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de despedida */}
      <AnimatedModal
        isOpen={showByeModal}
        onRequestClose={() => setShowByeModal(false)}
        message="¡Hasta luego! Esperamos verte pronto 😊"
        tipo="bye"
      />
    </>
  );
};

IconGroup.propTypes = {
  iconWhiteClass: PropTypes.string,
};

export default IconGroup;
