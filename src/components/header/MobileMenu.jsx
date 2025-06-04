import React, { useEffect } from "react";
// import MobileMenuSearch from "./sub-components/MobileSearch";
// import MdddobileLangCurChange from "./sub-components/MobileLangCurrChange";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from '../../store/slices/userSlice';
import { logoutUser } from "../../api";

const MobileMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, wishlistItems, compareItems } = useSelector((state) => state);
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const menuExpandItems = document.querySelectorAll(".menu-expand");
    menuExpandItems.forEach(item => {
      item.addEventListener("click", e => {
        e.currentTarget.parentElement.classList.toggle("active");
      });
    });
  }, []);

  const closeMobileMenu = () => {
    document.getElementById("offcanvas-mobile-menu")?.classList.remove("active");
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logoutUser();
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(clearUser());
    navigate("/login");
    closeMobileMenu();
  };

  return (
    <div className="offcanvas-mobile-menu" id="offcanvas-mobile-menu">
      <button className="offcanvas-menu-close" onClick={closeMobileMenu}>
        <i className="pe-7s-close"></i>
      </button>
      <div className="offcanvas-wrapper">
        <div className="offcanvas-inner-content">

          {/* <MobileMenuSearch /> */}

          <nav className="offcanvas-navigation">
            <ul>
              <li><Link to="/home-fashion-three" onClick={closeMobileMenu}>Inicio</Link></li>
              <li><Link to="/shop-grid-right-sidebar" onClick={closeMobileMenu}>Recargas</Link></li>
              <li><Link to="/shop-grid-paquet" onClick={closeMobileMenu}>Paquetes</Link></li>
              <li><Link to="/mycontacts" onClick={closeMobileMenu}>Contactos</Link></li>
              <li><Link to="/historial-recargas" onClick={closeMobileMenu}>Compras</Link></li>
              <li><Link to="/wishlist" onClick={closeMobileMenu}>Favoritos ({wishlistItems?.length || 0})</Link></li>
              <li><Link to="/compare" onClick={closeMobileMenu}>Comparar ({compareItems?.length || 0})</Link></li>
              <li><Link to="/cart" onClick={closeMobileMenu}>Carrito ({cartItems?.length || 0})</Link></li>
              <li><Link to="/recargar-saldo" onClick={closeMobileMenu}>Recargar Saldo</Link></li>
              {user ? (
                <>
                  <li><Link to="/my-account" onClick={closeMobileMenu}>Mi Cuenta</Link></li>
                  <li><Link to="/wallet" onClick={closeMobileMenu}>Tarjetas</Link></li>
                  {user.role === "superadmin" && (
                    <li><Link to="/admin/dashboard" onClick={closeMobileMenu}>Administración</Link></li>
                  )}
                  <li><Link to="/" onClick={handleLogout}>Cerrar Sesión</Link></li>
                </>
              ) : (
                <li><Link to="/login-register" onClick={closeMobileMenu}>Iniciar Sesión</Link></li>
              )}
            </ul>
          </nav>

          {/* <MobileLangCurChange /> */}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
