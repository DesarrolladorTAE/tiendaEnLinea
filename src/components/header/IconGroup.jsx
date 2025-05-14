import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import MenuCart from "./sub-components/MenuCart";
import { logoutUser } from "../../api";
import { clearUser } from '../../store/slices/userSlice';
import AnimatedModal from "../AnimatedModal";
import { ColorModeContext } from "../../context/ThemeContext";
import { Brightness4, Brightness7 } from "@mui/icons-material";

const IconGroup = ({ iconWhiteClass }) => {
  const { toggleColorMode, modoOscuro } = useContext(ColorModeContext);
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
  const { user } = useSelector((state) => state.user);

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
      await logoutUser(); // puedes usar una sola ruta backend si ambos usan Sanctum

      // Limpiar ambos posibles tokens
      localStorage.removeItem("POS_TOKEN");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(clearUser());

      // Mostrar despedida y redirigir
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/loginmui", { replace: true });
      }, 3000);
    } catch (error) {
      // También limpiar en caso de error
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


  return (
    <>
      <div className={clsx("header-right-wrap", iconWhiteClass)}>
        {/* 📱 SOLO VISIBLE EN MÓVIL */}
        <div className="same-style mobile-off-canvas d-block d-lg-none">
          <button className="mobile-aside-button" onClick={triggerMobileMenu}>
            <i className="pe-7s-menu" />
          </button>
        </div>

        {/* 🖥️ SOLO VISIBLE EN ESCRITORIO */}
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
          {/* <div className="same-style theme-toggle">
            <button onClick={toggleColorMode} title="Cambiar modo">
              {modoOscuro ? <Brightness7 /> : <Brightness4 />}
            </button>
          </div> */}
          {/* <div className="same-style cart-wrap">
            <button className="icon-cart" onClick={e => handleClick(e)}>
              <i className="pe-7s-shopbag" />
              <span className="count-style">{cartItems?.length || 0}</span>
            </button>
            <MenuCart />
          </div> */}
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


// import React, { useState } from "react";
// import PropTypes from "prop-types";
// import { useNavigate, Link as RouterLink } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import {
//   Box,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   Typography
// } from "@mui/material";
// import {
//   Search,
//   Compare,
//   Favorite,
//   ShoppingBag,
//   People,
//   AccountBalanceWallet,
//   Person,
//   ExitToApp,
//   AdminPanelSettings
// } from "@mui/icons-material";
// import { logoutUser } from "../../api";
// import { clearUser } from "../../store/slices/userSlice";
// import AnimatedModal from "../AnimatedModal";

// const IconGroup = ({ onItemClick }) => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [showByeModal, setShowByeModal] = useState(false);

//   const { compareItems } = useSelector((state) => state.compare);
//   const { wishlistItems } = useSelector((state) => state.wishlist);
//   const { cartItems } = useSelector((state) => state.cart);
//   const { user } = useSelector((state) => state.user);

//   const handleLogout = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       dispatch(clearUser());
//       navigate("/login");
//       return;
//     }

//     try {
//       await logoutUser();
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       dispatch(clearUser());
//       setShowByeModal(true);
//       setTimeout(() => {
//         setShowByeModal(false);
//         navigate("/login");
//       }, 3000);
//     } catch (error) {
//       dispatch(clearUser());
//       setShowByeModal(true);
//       setTimeout(() => {
//         setShowByeModal(false);
//         navigate("/login");
//       }, 3000);
//     }
//   };

//   return (
//     <Box>
//       <List>
//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/compare" onClick={onItemClick}>
//             <ListItemIcon><Compare /></ListItemIcon>
//             <ListItemText primary={`Comparar (${compareItems?.length || 0})`} />
//           </ListItemButton>
//         </ListItem>

//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/wishlist" onClick={onItemClick}>
//             <ListItemIcon><Favorite /></ListItemIcon>
//             <ListItemText primary={`Favoritos (${wishlistItems?.length || 0})`} />
//           </ListItemButton>
//         </ListItem>

//         {/* <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/cart" onClick={onItemClick}>
//             <ListItemIcon><ShoppingBag /></ListItemIcon>
//             <ListItemText primary={`Carrito (${cartItems?.length || 0})`} />
//           </ListItemButton>
//         </ListItem> */}

//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/mycontacts" onClick={onItemClick}>
//             <ListItemIcon><People /></ListItemIcon>
//             <ListItemText primary="Mis Contactos" />
//           </ListItemButton>
//         </ListItem>

//         {/* <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/recargar-saldo" onClick={onItemClick}>
//             <ListItemIcon><AccountBalanceWallet /></ListItemIcon>
//             <ListItemText primary="Recargar Saldo" />
//           </ListItemButton>
//         </ListItem> */}
//       </List>

//       <Divider sx={{ my: 2 }} />

//       {/* Opciones de cuenta */}
//       <Typography variant="subtitle1" sx={{ pl: 2, mb: 1 }}>
//         Cuenta
//       </Typography>

//       <List>
//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/my-account" onClick={onItemClick}>
//             <ListItemIcon><Person /></ListItemIcon>
//             <ListItemText primary="Mi Cuenta" />
//           </ListItemButton>
//         </ListItem>

//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/wallet" onClick={onItemClick}>
//             <ListItemIcon><AccountBalanceWallet /></ListItemIcon>
//             <ListItemText primary="Tarjetas" />
//           </ListItemButton>
//         </ListItem>

//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="/historial-recargas" onClick={onItemClick}>
//             <ListItemIcon><ShoppingBag /></ListItemIcon>
//             <ListItemText primary="Mis Compras" />
//           </ListItemButton>
//         </ListItem>
// {/*
//         <ListItem disablePadding>
//           <ListItemButton component={RouterLink} to="*" onClick={onItemClick}>
//             <ListItemIcon><Search /></ListItemIcon>
//             <ListItemText primary="Librerías" />
//           </ListItemButton>
//         </ListItem> */}

//         {user?.role === "superadmin" && (
//           <ListItem disablePadding>
//             <ListItemButton component={RouterLink} to="/admin/dashboard" onClick={onItemClick}>
//               <ListItemIcon><AdminPanelSettings /></ListItemIcon>
//               <ListItemText primary="Administración" />
//             </ListItemButton>
//           </ListItem>
//         )}

//         <ListItem disablePadding>
//           <ListItemButton onClick={handleLogout}>
//             <ListItemIcon><ExitToApp /></ListItemIcon>
//             <ListItemText primary="Cerrar Sesión" />
//           </ListItemButton>
//         </ListItem>
//       </List>

//       <AnimatedModal
//         isOpen={showByeModal}
//         onRequestClose={() => setShowByeModal(false)}
//         message="¡Hasta luego! Esperamos verte pronto 😊"
//         tipo="bye"
//       />
//     </Box>
//   );
// };

// IconGroup.propTypes = {
//   onItemClick: PropTypes.func,
// };

// export default IconGroup;
