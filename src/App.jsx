import React, { Suspense, lazy, useEffect } from 'react';
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { clearUser, loadUserFromStorage } from './store/slices/userSlice';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
// import useRealtimeUserData from "./hooks/useRealtimeUserData";


import AdminRoutes from "./routes/AdminRoutes";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";

//Pruebas



// Home pages
const HomeFashionThree = lazy(() => import("./pages/home/HomeFashionThree.jsx"));

// Shop pages
const ShopGridRightSidebar = lazy(() => import("./pages/shop/ShopGridRightSidebar.jsx"));
const ShopGridPaquet = lazy(() => import("./pages/shop/ShopGridPaquet.jsx"));

// Product pages
const Product = lazy(() => import("./pages/shop-product/Product.jsx"));

// Other pages
const About = lazy(() => import("./pages/other/About.jsx"));
const MyContacts = lazy(() => import("./pages/other/MyContacts.jsx"));
const MyAccount = lazy(() => import("./pages/other/MyAccount.jsx"));
const Wallet = lazy(() => import("./pages/other/Wallet.jsx"));
// const Login = lazy(() => import("./pages/other/Login.jsx"));
const Contact = lazy(() => import("./pages/other/Contact.jsx"));
const Cart = lazy(() => import("./pages/other/Cart.jsx"));
const Wishlist = lazy(() => import("./pages/other/Wishlist.jsx"));
const Compare = lazy(() => import("./pages/other/Compare.jsx"));
const Checkout = lazy(() => import("./pages/other/Checkout.jsx"));
const NotFound = lazy(() => import("./pages/other/NotFound.jsx"));
const RecargarSaldo = lazy(() => import("./pages/other/RecargarSaldo.jsx"));
const HistorialRecargas = lazy(() => import("./pages/other/HistorialRecargas.jsx"))
const Agentes = lazy(() => import("./pages/other/Agentes.jsx"))
const Loginmui = lazy(() => import("./pages/other/loginmui.jsx"))
const InicioAgente = lazy(() => import("./pages/home/InicioAgente.jsx"))
const SaldoRecarga = lazy(() => import("./pages/other/SaldoRecarga.jsx"))
const LandingPage = lazy(() => import("./pages/landing/LandingPage.jsx"))

//Pages Admin
const Notifications = lazy(() => import("./pages/admin/Notifications.jsx"));
const Purchases = lazy(() => import("./pages/admin/Purchases.jsx"));
// const Dashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const Users = lazy(() => import("./pages/admin/Users.jsx"));

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Carga usuario de storage
    dispatch(loadUserFromStorage());
    // 2. Si no hay token después de cargar, limpia Redux (logout)
    if (!localStorage.getItem('token')) {
      dispatch(clearUser());
    }
  }, [dispatch]);

  // useRealtimeUserData(5000); // 🔁 actualiza cada 5 segundos

  return (
    <Router>
      <ScrollToTop>
        {/* Aquí el container de notificaciones */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <Suspense
          fallback={
            <div className="flone-preloader-wrapper">
              <div className="flone-preloader">
                <span></span>
                <span></span>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Redirigir raíz al login */}
            <Route path="/" element={<LandingPage />} />

            {/* Home page */}
            <Route path="/home-fashion-three" element={<HomeFashionThree />} />

            {/* Shop pages */}
            <Route path="/shop-grid-right-sidebar" element={<ShopGridRightSidebar />} />
            <Route path="/shop-grid-paquet" element={<ShopGridPaquet />} />

            {/* Product detail */}
            <Route path="/product/:id" element={<Product />} />

            {/* Other pages */}
            {/* <Route path="/about" element={<About />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/wallet" element={<Wallet />} />
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/cart" element={<Cart />} /> */}
            <Route path="/saldo-recarga" element={<SaldoRecarga />} />
            <Route path="/mycontacts" element={<MyContacts />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            {/* <Route path="/recargar-saldo" element={<RecargarSaldo />} /> */}
            {/* <Route path="/home-fashion-agent" element={<InicioAgente />} /> */}
            <Route path="/historial-recargas" element={<HistorialRecargas />} />
            {/* <Route path="/agent-mipages" element={<Agentes />} /> */}
            <Route path="/landing" element={<LandingPage />} />
            <Route
              path="/loginmui"
              element={
                <PublicOnlyRoute>
                  <Loginmui />
                </PublicOnlyRoute>
              }
            />


            <Route element={<AdminRoutes />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="users" element={<Users />} />
              </Route>
            </Route>

            {/* Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ScrollToTop>
    </Router>
  );
};

export default App;
