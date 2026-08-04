import React, { Suspense, lazy } from "react";
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import { Container } from "@mui/material";
import WhatsappButton from "./components/WhatsappButton";
import SupportTicketButton from "./components/SupportTicketButton";
import { Toaster } from "react-hot-toast";
import GtmPageViewTracker from "./components/tracking/GtmPageViewTracker.jsx";

const HomeFashionSix = lazy(() => import("./pages/home/HomeFashionSix.jsx"));
const HomeFurniture = lazy(() => import("./pages/home/HomeFurniture.jsx"));

const LandingPage = lazy(() => import("./pages/home/LandingPage.jsx"));
const HomePage = lazy(() => import("./pages/home/HomePage.jsx"));
const PlatformPage = lazy(() => import("./pages/home/PlatformPage.jsx"));
const FeaturesPage = lazy(() => import("./pages/home/FeaturesPage.jsx"));
const PlansPage = lazy(() => import("./pages/home/PlansPage.jsx"));
const ContactPage = lazy(() => import("./pages/home/ContactPage.jsx"));

const LoginRegister = lazy(() => import("./pages/other/LoginRegister.jsx"));
const Renovar = lazy(() => import("./pages/other/Renovar.jsx"));
const Terminos = lazy(() => import("./pages/other/TerminosCondiciones.jsx"));
const NotFound = lazy(() => import("./pages/other/NotFound.jsx"));

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
      <GtmPageViewTracker />

      <ScrollToTop>
        <Toaster position="top-right" reverseOrder={false} />

        <Suspense
          fallback={
            <div className="flone-preloader-wrapper">
              <div className="flone-preloader">
                <span />
                <span />
              </div>
            </div>
          }
        >
          <Routes>
            <Route element={<LandingPage />}>
              <Route index element={<HomePage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/services" element={<PlansPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            <Route
              path="/home-fashion-six"
              element={<HomeFashionSix />}
            />

            <Route
              path="/home-furniture"
              element={<HomeFurniture />}
            />

            <Route
              path="/login-register"
              element={<LoginRegister />}
            />

            <Route path="/renovar" element={<Renovar />} />

            <Route
              path="/terminos-y-condiciones"
              element={<Terminos />}
            />

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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ScrollToTop>

      <SupportTicketButton />
      <WhatsappButton />
    </Router>
  );
};

export default App;