import React from "react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import clsx from "clsx";
import Logo from "../../components/header/Logo";
import NavMenu from "../../components/header/NavMenu";
import IconGroup from "../../components/header/IconGroup";
import MobileMenu from "../../components/header/MobileMenu";
import HeaderTop from "../../components/header/HeaderTop";

const HeaderOne = ({
  layout,
  top,
  borderStyle,
  headerPaddingClass,
  headerPositionClass,
  headerBgClass
}) => {
  const [scroll, setScroll] = useState(0);
  const [headerTop, setHeaderTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector(".sticky-bar");
    setHeaderTop(header.offsetTop);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScroll = () => {
    setScroll(window.scrollY);
  };

  return (
    <header className={clsx("header-area clearfix", headerBgClass, headerPositionClass)}>
      <div
        className={clsx(
          "header-top-area", 
          headerPaddingClass, 
          top === "visible" ? "d-none d-lg-block" : "d-none", 
          borderStyle === "fluid-border" && "border-none" 
        )}
      >
        <div className={layout === "container-fluid" ? layout : "container"}>
          {/* header top */}
          <HeaderTop borderStyle={borderStyle} />
        </div>
      </div>

      <div
        className={clsx(
          headerPaddingClass, 
          "sticky-bar header-res-padding clearfix", 
          scroll > headerTop && "stick"
        )}
      >
        <div className={layout === "container-fluid" ? layout : "container"}>
          <div className="row">
            <div className="col-xl-2 col-lg-2 col-md-6 col-4">
              {/* header logo */}
              <Logo imageUrl="/assets/img/logo/logo2.png" logoClass="logo" />
            </div>
            <div className="col-xl-8 col-lg-8 d-none d-lg-block">
              {/* Nav menu */}
              <NavMenu />
            </div>
            <div className="col-xl-2 col-lg-2 col-md-6 col-8">
              {/* Icon group */}
              <IconGroup />
            </div>
          </div>
        </div>
        {/* mobile menu */}
        <MobileMenu />
      </div>
    </header>
  );
};

HeaderOne.propTypes = {
  borderStyle: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  layout: PropTypes.string,
  top: PropTypes.string
};

export default HeaderOne;


// import React, { useState } from "react";
// import PropTypes from "prop-types";
// import {
//   AppBar,
//   Toolbar,
//   IconButton,
//   Drawer,
//   Box,
//   Container,
//   Divider,
//   Typography,
//   Link as MuiLink
// } from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu";
// import NavMenu from "../../components/header/NavMenu";
// import IconGroup from "../../components/header/IconGroup";
// import { Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { Button } from "@mui/material";
// import AccountCircleIcon from "@mui/icons-material/AccountCircle";
// import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
// import FlashOnIcon from "@mui/icons-material/FlashOn";

// const HeaderOne = ({
//   layout,
//   top,
//   borderStyle,
//   headerPaddingClass,
//   headerPositionClass,
//   headerBgClass
// }) => {
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const toggleDrawer = () => setDrawerOpen(prev => !prev);

//   const currency = useSelector((state) => state.currency);
//   const user = useSelector((state) => state.user.user);

//   const saldo = Number(user?.saldo) || 0;
//   const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
//   const isBajoSaldo = saldo < 100;

//   return (
//     <>
//       {/* AppBar completamente fijo y menos ancho */}
//       <AppBar
//         position="fixed"
//         sx={{
//           backgroundColor: "#00B4F0",
//           color: "#fff",
//           zIndex: 1201,
//           boxShadow: 2,
//           transition: "all 0.3s ease"
//         }}
//       >
//         <Container maxWidth="lg">
//           <Toolbar
//             sx={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               minHeight: { xs: 80, md: 100 },
//               px: { xs: 2, md: 4 },
//             }}
//           >
//             {/* IZQUIERDA: Hamburguesa */}
//             <IconButton
//               edge="start"
//               color="inherit"
//               aria-label="menu"
//               onClick={toggleDrawer}
//               sx={{ fontSize: 34 }}
//             >
//               <MenuIcon fontSize="inherit" />
//             </IconButton>

//             {/* CENTRO: Logo */}
//             <Box sx={{ flexGrow: 1, textAlign: "center" }}>
//               <Link to="/home-fashion-three">
//                 <Box
//                   component="img"
//                   src="/assets/img/logo/logo.png"
//                   alt="Logo"
//                   sx={{ height: 48, opacity: 0.95 }}
//                 />
//               </Link>
//             </Box>

//             {/* DERECHA: Info de usuario */}
//             {user && (
//               <Box sx={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 0.5 }}>
//                 {/* 💰 Saldo */}
//                 <Typography
//                   variant="body2"
//                   sx={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 0.5,
//                     fontWeight: 500,
//                     color: "#fff"
//                   }}
//                 >
//                   <MonetizationOnIcon sx={{ fontSize: 18 }} />
//                   <span>Saldo:</span>
//                   <Box
//                     component="span"
//                     sx={{
//                       fontWeight: 700,
//                       color: isBajoSaldo ? "#ff5252" : "#b9f6ca"
//                     }}
//                   >
//                     {currency.currencySymbol + saldoConvertido}
//                   </Box>
//                 </Typography>

//                 {/* 🔋 Botón recarga */}
//                 {isBajoSaldo && (
//                   <Button
//                     component={Link}
//                     to="/recargar-saldo"
//                     size="small"
//                     variant="contained"
//                     startIcon={<FlashOnIcon />}
//                     sx={{
//                       fontWeight: 600,
//                       backgroundColor: "#9c27b0",
//                       textTransform: "none",
//                       fontSize: 12,
//                       lineHeight: 1,
//                       minHeight: 28,
//                       px: 1.5,
//                       ":hover": { backgroundColor: "#7b1fa2" }
//                     }}
//                   >
//                     Recarga ahora
//                   </Button>
//                 )}

//                 {/* 👤 Bienvenida */}
//                 <Typography
//                   variant="caption"
//                   sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, color: "#fff" }}
//                 >
//                   <AccountCircleIcon sx={{ fontSize: 16 }} />
//                   Bienvenido,{" "}
//                   <Box component="span" sx={{ fontWeight: "bold" }}>
//                     {user.name} {user.apellidos}
//                   </Box>
//                 </Typography>
//               </Box>
//             )}
//           </Toolbar>

//         </Container>
//       </AppBar>

//       {/* Contenido necesita margen para no quedar debajo del header */}
//       <Box sx={{ mt: { xs: 10, md: 12 } }} />

//       {/* Drawer lateral izquierdo */}
//       <Drawer
//         anchor="left"
//         open={drawerOpen}
//         onClose={toggleDrawer}
//         variant="temporary"
//         ModalProps={{
//           keepMounted: true,
//           disableScrollLock: false
//         }}
//         sx={{
//           zIndex: (theme) => theme.zIndex.drawer + 1300,
//           "& .MuiDrawer-paper": {
//             width: { xs: '100%', sm: 280 },
//             boxShadow: 5,
//             backgroundColor: "#fff"
//           }
//         }}
//       >
//         <Box sx={{ position: "relative", flexGrow: 1, overflowY: "auto" }}>
//           {/* 🔺 Botón de cerrar (solo en mobile) */}
//           <IconButton
//             onClick={toggleDrawer}
//             sx={{
//               position: "absolute",
//               top: 8,
//               right: 8,
//               zIndex: 1,
//               display: { xs: "inline-flex", sm: "none" }
//             }}
//           >
//             <MenuIcon sx={{ transform: "rotate(45deg)" }} />
//           </IconButton>

//           {/* Logo */}
//           <Box sx={{ display: "flex", justifyContent: "center", mb: 1, mt: 4 }}>
//             <Link to="/home-fashion-three" onClick={toggleDrawer}>
//               <Box
//                 component="img"
//                 src="/assets/img/logo/logo.png"
//                 alt="Logo"
//                 sx={{ height: 40, opacity: 0.8 }}
//               />
//             </Link>
//           </Box>

//           <Divider sx={{ mb: 2 }} />

//           <Typography
//             variant="subtitle2"
//             sx={{ fontWeight: "bold", color: "text.secondary", px: 2, mb: 1 }}
//           >
//             Navegación
//           </Typography>
//           <NavMenu sidebarMenu onItemClick={toggleDrawer} />

//           <Divider sx={{ my: 2 }} />

//           <Typography
//             variant="subtitle2"
//             sx={{ fontWeight: "bold", color: "text.secondary", px: 2, mb: 1 }}
//           >
//             Acciones
//           </Typography>
//           <Box sx={{ px: 1 }}>
//             <IconGroup onItemClick={toggleDrawer} />
//           </Box>
//         </Box>
//       </Drawer>


//     </>
//   );
// };

// HeaderOne.propTypes = {
//   borderStyle: PropTypes.string,
//   headerPaddingClass: PropTypes.string,
//   headerPositionClass: PropTypes.string,
//   layout: PropTypes.string,
//   top: PropTypes.string
// };

// export default HeaderOne;
