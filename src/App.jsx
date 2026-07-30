import React, { Suspense, lazy } from "react";
import ScrollToTop from "./helpers/scroll-top";
import {
  useLocation,
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import { Container } from "@mui/material";
import WhatsappButton from "./components/WhatsappButton";
import { Toaster } from "react-hot-toast";
import GtmPageViewTracker from "./components/tracking/GtmPageViewTracker.jsx";

// home pages

const HomeFashionSix = lazy(() => import("./pages/home/HomeFashionSix.jsx"));
const HomeFurniture = lazy(() => import("./pages/home/HomeFurniture.jsx"));

const LandingPage = lazy(() => import("./pages/home/LandingPage.jsx"));
const Hero = lazy(() => import("./pages/home/components/Hero"));
const Platform = lazy(() => import("./pages/home/components/Platform"));
const Features = lazy(() => import("./pages/home/components/Features"));
const Plans = lazy(() => import("./pages/home/components/Plans"));
const Contacts = lazy(() => import("./pages/home/components/Contact"));

const LoginRegister = lazy(() => import("./pages/other/LoginRegister.jsx"));
const Renovar = lazy(() => import("./pages/other/Renovar.jsx"));
const Terminos = lazy(() => import("./pages/other/TerminosCondiciones.jsx"));

const NotFound = lazy(() => import("./pages/other/NotFound.jsx"));
const AdminPanel = lazy(() => import("./pages/superadmin/HomeSuperAdmin.jsx"));
const PublicInvoicePage = lazy(
  () => import("./pages/facturacion/PublicInvoicePage.jsx"),
);
const POSWrapper = lazy(() => import("./wrappers/POSWrapper"));
const PersonalizacionSitio = lazy(
  () => import("./pages/other/PersnalizacionSitio.jsx"),
);

const App = () => {
  return (
    <Router>
      {/* // Evento page view de GTM */}
      <GtmPageViewTracker />
      <ScrollToTop>
        <Toaster position="top-right" reverseOrder={false} />
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
            <Route path="/platform" element={<LandingPage />} />
            <Route path="/features" element={<LandingPage />} />
            <Route path="/services" element={<LandingPage />} />
            <Route path="/contact-landing" element={<LandingPage />} />

            {/* Homepages */}
            <Route path={"/home-fashion-six"} element={<HomeFashionSix />} />

            <Route path={"/home-furniture"} element={<HomeFurniture />} />
            
            {/* Other pages */}

            <Route path={"/login-register"} element={<LoginRegister />} />


            <Route path="/renovar" element={<Renovar />} />
            <Route path="/terminos-y-condiciones" element={<Terminos />} />

            {/* <Route path="/panel" element={<AdminPanel />} /> */}

            <Route path="*" element={<NotFound />} />

            <Route
              path="/tienda/:storeSlug"
              element={<PersonalizacionSitio />}
            />

            {AdminRoutes}
            {SuperAdminRoutes}

            <Route
              path="/prueba/pos"
              element={
                <Container maxWidth="xl">
                  <POSWrapper />
                </Container>
              }
            />
            <Route
              path="/facturacion-publica/:token"
              element={<PublicInvoicePage />}
            />
          </Routes>
        </Suspense>
      </ScrollToTop>
      <WhatsappButton />
    </Router>
  );
};

export default App;
