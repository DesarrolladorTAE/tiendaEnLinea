import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { logoutUser } from "../../api";
import { clearUser, setNotificaciones } from "../../store/slices/userSlice";
import AnimatedModal from "../AnimatedModal";
import axios from "../../axiosConfig";


const IconGroup = ({ iconWhiteClass }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showByeModal, setShowByeModal] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notifRef = useRef();

  const { user, notificaciones = [] } = useSelector((state) => state.user);
  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);

  const isAgent = user?.role === "agent";

  const handleLogout = async (e) => {
    e.preventDefault();
    const posToken = localStorage.getItem('POS_TOKEN');
    const userToken = localStorage.getItem('token');

    try {
      await logoutUser();
    } catch (error) {
      // ignorar errores del logout
    }

    localStorage.removeItem("POS_TOKEN");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(clearUser());
    setShowByeModal(true);
    setTimeout(() => {
      setShowByeModal(false);
      navigate("/loginmui", { replace: true });
    }, 3000);
  };

  return (
    <>
      <div className={clsx("header-right-wrap", iconWhiteClass)}>
        <div className="same-style mobile-off-canvas d-block d-lg-none">
          <button className="mobile-aside-button" onClick={() => {
            const offcanvasMobileMenu = document.querySelector("#offcanvas-mobile-menu");
            offcanvasMobileMenu.classList.add("active");
          }}>
            <i className="pe-7s-menu" />
          </button>
        </div>

        <div className="d-none d-lg-flex align-items-center gap-3">
          {!isAgent && (
            <>
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
                  <span className="count-style">
                    {notificaciones.length > 9 ? "9+" : notificaciones.length || "0"}
                  </span>
                </button>
                {openNotifications && (
                  <div className="notification-dropdown">
                    <div className="header-noti">
                      <span className="titulo">Mis Notificaciones</span>
                      <button className="btn-vaciar" onClick={async () => {
                        await axios.delete("/mis-notificaciones/vaciar");
                        dispatch(setNotificaciones([]));
                      }}>
                        <i className="pe-7s-trash" style={{ fontSize: "18px" }}></i>
                      </button>
                    </div>

                    <div className="notification-list-scroll">
                      {notificaciones.length ? (
                        notificaciones.slice(0, 5).map((msg) => (
                          <div key={msg.id} className="notification-card">
                            <button
                              className="btn-vaciar"
                              style={{ position: "absolute", top: "4px", right: "6px", fontSize: "16px" }}
                              onClick={async () => {
                                await axios.delete(`/mis-notificaciones/${msg.id}`);
                                dispatch(setNotificaciones(prev => prev.filter(n => n.id !== msg.id)));
                              }}
                            >
                              ❌
                            </button>
                            <p className="mensaje">{msg.mensaje}</p>
                            <p className="fecha">{new Date(msg.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="sin-notificaciones">Aún no tienes notificaciones 💤</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="same-style header-wallet">
                <Link to={"/saldo-recarga"}>
                  <i className="pe-7s-wallet" />
                </Link>
              </div>
            </>
          )}

          <div className="same-style account-setting">
            <button className="account-setting-active" onClick={e => e.currentTarget.nextSibling.classList.toggle("active")}>
              <i className="pe-7s-user-female" />
            </button>
            <div className="account-dropdown">
              <ul>
                {!isAgent && (
                  <>
                    <li><Link to={"/my-account"}>Mi Cuenta</Link></li>
                    <li><Link to={"/agent-mipages"}>Agentes</Link></li>
                    {user?.role === "superadmin" && (
                      <li><Link to={"/admin/dashboard"}>Administración</Link></li>
                    )}
                  </>
                )}
                <li><Link to="/" onClick={handleLogout}>Cerrar Sesión</Link></li>
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
