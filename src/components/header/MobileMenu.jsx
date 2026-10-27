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
    navigate("/iniciar-sesion");
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
              <li><Link to="/inicio" onClick={closeMobileMenu}>Inicio</Link></li>
              <li><Link to="/recargas" onClick={closeMobileMenu}>Recargas</Link></li>
              <li><Link to="/ventas/paquetes" onClick={closeMobileMenu}>Paquetes</Link></li>
              <li><Link to="/contactos" onClick={closeMobileMenu}>Contactos</Link></li>
              <li><Link to="/ventas" onClick={closeMobileMenu}>Compras</Link></li>
              <li><Link to="/tokens" onClick={closeMobileMenu}>Tokens</Link></li>
              <li><Link to="/favoritos" onClick={closeMobileMenu}>Favoritos ({wishlistItems?.length || 0})</Link></li>
              <li><Link to="/comparar" onClick={closeMobileMenu}>Comparar ({compareItems?.length || 0})</Link></li>
              <li><Link to="/cart" onClick={closeMobileMenu}>Carrito ({cartItems?.length || 0})</Link></li>
              <li><Link to="/recargar-saldo" onClick={closeMobileMenu}>Recargar Saldo</Link></li>
              {user ? (
                <>
                  <li><Link to="/mi-cuenta" onClick={closeMobileMenu}>Mi Cuenta</Link></li>
                  <li><Link to="/monedero" onClick={closeMobileMenu}>Tarjetas</Link></li>
                  {user.role === "superadmin" && (
                    <li><Link to="/admin/dashboard" onClick={closeMobileMenu}>Administración</Link></li>
                  )}
                  <li><Link to="/" onClick={handleLogout}>Cerrar Sesión</Link></li>
                </>
              ) : (
                <li><Link to="/iniciar-sesion" onClick={closeMobileMenu}>Iniciar Sesión</Link></li>
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
