import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { logoutUser } from "../../api";
import { clearUser } from '../../store/slices/userSlice';
import AnimatedModal from "../AnimatedModal";

const IconGroup = ({ iconWhiteClass }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showByeModal, setShowByeModal] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notifRef = useRef();

  const handleClick = e => {
    e.currentTarget.nextSibling.classList.toggle("active");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerMobileMenu = () => {
    const offcanvasMobileMenu = document.querySelector("#offcanvas-mobile-menu");
    offcanvasMobileMenu.classList.add("active");
  };

  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);
  const { user, notificaciones = [] } = useSelector((state) => state.user);

  const handleLogout = async (e) => {
    e.preventDefault();
    const posToken = localStorage.getItem('POS_TOKEN');
    const userToken = localStorage.getItem('token');
    const hasToken = posToken || userToken;

    if (!hasToken) {
      dispatch(clearUser());
      navigate("/loginmui", { replace: true });
      return;
    }

    try {
      await logoutUser();
      localStorage.removeItem("POS_TOKEN");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(clearUser());
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/loginmui", { replace: true });
      }, 3000);
    } catch (error) {
      localStorage.removeItem("POS_TOKEN");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(clearUser());
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/loginmui", { replace: true });
      }, 3000);
    }
  };

  const getNotificationLabel = () => {
    if (!notificaciones.length) return "0";
    if (notificaciones.length > 9) return "9+";
    return String(notificaciones.length);
  };

  return (
    <>
      <div className={clsx("header-right-wrap", iconWhiteClass)}>
        <div className="same-style mobile-off-canvas d-block d-lg-none">
          <button className="mobile-aside-button" onClick={triggerMobileMenu}>
            <i className="pe-7s-menu" />
          </button>
        </div>

        <div className="d-none d-lg-flex align-items-center gap-3">
          <div className="same-style header-compare">
            <Link to={"/compare"}>
              <i className="pe-7s-shuffle" />
              <span className="count-style">{compareItems?.length || 0}</span>
            </Link>
          </div>

          <div className="same-style header-wishlist">
            <Link to={"/wishlist"}>
              <i className="pe-7s-like" />
              <span className="count-style">{wishlistItems?.length || 0}</span>
            </Link>
          </div>

          <div className="same-style header-notification" ref={notifRef}>
            <button className="icon-notification" onClick={() => setOpenNotifications(!openNotifications)}>
              <i className="pe-7s-bell" />
              <span className="count-style">{getNotificationLabel()}</span>
            </button>
            {openNotifications && (
              <div className="notification-dropdown">
                <ul>
                  {notificaciones.length ? (
                    notificaciones.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))
                  ) : (
                    <li>Aún no tienes notificaciones 💤</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="same-style header-wallet">
            <Link to={"/saldo-recarga"}>
              <i className="pe-7s-wallet" />
            </Link>
          </div>

          <div className="same-style account-setting">
            <button className="account-setting-active" onClick={e => handleClick(e)}>
              <i className="pe-7s-user-female" />
            </button>
            <div className="account-dropdown">
              <ul>
                <li><Link to={"/my-account"}>Mi Cuenta</Link></li>
                <li><Link to={"/agent-mipages"}>Agentes</Link></li>
                <li><Link to={"/wallet"}>Tarjetas</Link></li>
                <li><Link to={"*"}>Librerías</Link></li>
                {user?.role === "superadmin" && (
                  <li><Link to={"/admin/dashboard"}>Administración</Link></li>
                )}
                <li>
                  <Link to="/" onClick={handleLogout}>Cerrar Sesión</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
