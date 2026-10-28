import React, { Suspense, lazy, useEffect, useState } from "react";
import ViewReady from './components/loading/ViewReady';
import InstallPWAButton from './components/pwa/InstallPWAButton';
import AppLoading from './components/loading/AppLoading';
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
import SEO from "./components/seo";
import { LEGACY_ROUTES } from "./utils/publicSeo.mjs";
import { MARKETING_PAGES } from "./content/marketing.mjs";

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
const Integraciones = lazy(() => import("./pages/other/Integraciones.jsx"));
const PublicPackages = lazy(() => import("./pages/other/PublicPackages.jsx"));
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
  const isLoginRoute = location.pathname === "/iniciar-sesion";

  // Cierra sesión y oculta el modal
  const handleLogout = () => {
    setShowTermsModal(false);
    dispatch(clearUser());
    navigate("/iniciar-sesion");
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
      <SEO />
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
      <ViewReady key={location.key}><Suspense fallback={<AppLoading />}>
        <Routes>
          {Object.entries(LEGACY_ROUTES).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={{ pathname: to, search: location.search, hash: location.hash }} replace />} />)}
          <Route path="/" element={<LandingPage />} />
          {Object.keys(MARKETING_PAGES).filter(path => path !== "/").map(path => <Route key={path} path={path} element={<LandingPage />} />)}
          <Route path="/paquetes" element={<PublicPackages />} />
          <Route path="/paquetes/companias/:companySlug" element={<PublicPackages />} />
          <Route path="/paquetes/recargas/:airtimeSlug" element={<PublicPackages />} />
          <Route path="/paquetes/:slug" element={<PublicPackages />} />
          <Route path="/inicio" element={<HomeFashionThree />} />
          <Route
            path="/recargas"
            element={<ShopGridRightSidebar />}
          />
          <Route path="/ventas/paquetes" element={<ShopGridPaquet />} />
          <Route path="/product/:id" element={<Product />} />
          {/* <Route path="/contact" element={<Contact />} /> */}
          <Route path="/mi-cuenta" element={<MyAccount />} />
          <Route path="/monedero" element={<Wallet />} />
          <Route path="/recargar-saldo" element={<SaldoRecarga />} />
          <Route path="/contactos" element={<MyContacts />} />
          <Route path="/favoritos" element={<Wishlist />} />
          <Route path="/comparar" element={<Compare />} />
          <Route path="/ventas" element={<HistorialRecargas />} />
          <Route path="/tokens" element={<Integraciones />} />
          <Route path="/agentes" element={<Agentes />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/terminos-condiciones" element={<LegalTerms />} />
          <Route
            path="/iniciar-sesion"
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
      </Suspense></ViewReady>
      {!MARKETING_PAGES[location.pathname] && !location.pathname.startsWith("/paquetes") && <InstallPWAButton floating />}
    </ScrollToTop>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
