import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { t } = useTranslation();
  
  return (
    <div
    className={clsx(
      sidebarMenu ? "sidebar-menu" : "main-menu",
      !sidebarMenu && menuWhiteClass
    )}
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
            <Link to={"/mycontacts"}>
              {t("Contactos")}
            </Link>
         </li>  
          <li>
          <Link to={"/historial-recargas"}>
              {t("Compras")}
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

// import React from "react";
// import PropTypes from "prop-types";
// import { Link } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import clsx from "clsx";

// const NavMenu = ({ menuWhiteClass, sidebarMenu, onItemClick }) => {
//   const { t } = useTranslation();

//   return (
//     <div className={clsx(sidebarMenu ? "sidebar-menu" : `main-menu ${menuWhiteClass || ""}`)}>
//       <nav>
//         <ul>
//           <li>
//             <Link to="/home-fashion-three" onClick={onItemClick}>
//               {t("Inicio")}
//             </Link>
//           </li>
//           <li>
//             <Link to="/shop-grid-right-sidebar" onClick={onItemClick}>
//               {t("Recargas")}
//             </Link>
//           </li>
//           <li>
//             <Link to="/shop-grid-paquet" onClick={onItemClick}>
//               {t("Paquetes")}
//             </Link>
//           </li>
//           {/* <li>
//             <Link to="/about" onClick={onItemClick}>
//               {t("Sobre Nosotros")}
//             </Link>
//           </li>
//           <li>
//             <Link to="/contact" onClick={onItemClick}>
//               {t("Contáctanos")}
//             </Link>
//           </li> */}
//         </ul>
//       </nav>
//     </div>
//   );
// };

// NavMenu.propTypes = {
//   menuWhiteClass: PropTypes.string,
//   sidebarMenu: PropTypes.bool,
//   onItemClick: PropTypes.func, // ✅ nuevo prop
// };

// export default NavMenu;
