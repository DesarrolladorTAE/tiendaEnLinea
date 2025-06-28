import React, { Suspense, lazy, useEffect, useState } from "react";
import ScrollToTop from "./helpers/scroll-top";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearUser,
  loadUserFromStorage,
  setUser,
} from "./store/slices/userSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import TermsModal from "./components/modals/TermsModal";
import AdminRoutes from "./routes/AdminRoutes";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import axios from "../src/axiosConfig.js";

// Home pages
const HomeFashionThree = lazy(() =>
  import("./pages/home/HomeFashionThree.jsx")
);

// Shop pages
const ShopGridRightSidebar = lazy(() =>
  import("./pages/shop/ShopGridRightSidebar.jsx")
);
const ShopGridPaquet = lazy(() => import("./pages/shop/ShopGridPaquet.jsx"));

// Product pages
const Product = lazy(() => import("./pages/shop-product/Product.jsx"));

// Other pages
const About = lazy(() => import("./pages/other/About.jsx"));
const MyContacts = lazy(() => import("./pages/other/MyContacts.jsx"));
const MyAccount = lazy(() => import("./pages/other/MyAccount.jsx"));
const Wallet = lazy(() => import("./pages/other/Wallet.jsx"));
const Contact = lazy(() => import("./pages/other/Contact.jsx"));
const Cart = lazy(() => import("./pages/other/Cart.jsx"));
const Wishlist = lazy(() => import("./pages/other/Wishlist.jsx"));
const Compare = lazy(() => import("./pages/other/Compare.jsx"));
const Checkout = lazy(() => import("./pages/other/Checkout.jsx"));
const NotFound = lazy(() => import("./pages/other/NotFound.jsx"));
const RecargarSaldo = lazy(() => import("./pages/other/RecargarSaldo.jsx"));
const HistorialRecargas = lazy(() =>
  import("./pages/other/HistorialRecargas.jsx")
);
const Agentes = lazy(() => import("./pages/other/Agentes.jsx"));
const Loginmui = lazy(() => import("./pages/other/loginmui.jsx"));
const InicioAgente = lazy(() => import("./pages/home/InicioAgente.jsx"));
const SaldoRecarga = lazy(() => import("./pages/other/SaldoRecarga.jsx"));
const LegalTerms = lazy(() => import("./pages/other/LegalTerms.jsx"));
const LandingPage = lazy(() => import("./pages/landing/LandingPage.jsx"));

//Pages Admin
const Notifications = lazy(() => import("./pages/admin/Notifications.jsx"));
const Purchases = lazy(() => import("./pages/admin/Purchases.jsx"));
const Users = lazy(() => import("./pages/admin/Users.jsx"));

const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user.user);
  const token = useSelector((state) => state.user.token);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Detecta si estamos en la ruta de login
  const isLoginRoute = location.pathname === "/loginmui";

  // Cierra sesión y oculta el modal
  const handleLogout = () => {
    setShowTermsModal(false);
    dispatch(clearUser());
    navigate("/loginmui");
  };

  // Carga usuario al iniciar
  useEffect(() => {
    dispatch(loadUserFromStorage());
    if (!localStorage.getItem("token")) {
      dispatch(clearUser());
    }
  }, [dispatch]);

  // Muestra el modal solo si hay usuario y no ha aceptado términos
  useEffect(() => {
    if (user && !user.terminos) {
      setShowTermsModal(true);
    } else {
      setShowTermsModal(false);
    }
  }, [user]);

  // Acepta términos
  const aceptarTerminos = async () => {
    try {
      await axios.post(
        "/users/accept-terms",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUser = { ...user, terminos: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch(setUser({ user: updatedUser, token }));
      setShowTermsModal(false);
    } catch (error) {
      console.error("Error al aceptar términos", error);
    }
  };

  return (
    <ScrollToTop>
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
      {/* Solo renderiza el modal si hay usuario y NO estamos en la ruta de login */}
      {user && !isLoginRoute && (
        <TermsModal
          open={showTermsModal}
          onClose={handleLogout}
          onAccept={aceptarTerminos}
        />
      )}
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/home-fashion-three" element={<HomeFashionThree />} />
          <Route
            path="/shop-grid-right-sidebar"
            element={<ShopGridRightSidebar />}
          />
          <Route path="/shop-grid-paquet" element={<ShopGridPaquet />} />
          <Route path="/product/:id" element={<Product />} />
          {/* <Route path="/contact" element={<Contact />} /> */}
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/saldo-recarga" element={<SaldoRecarga />} />
          <Route path="/mycontacts" element={<MyContacts />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/historial-recargas" element={<HistorialRecargas />} />
          <Route path="/agent-mipages" element={<Agentes />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/terminos-condiciones" element={<LegalTerms />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ScrollToTop>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;