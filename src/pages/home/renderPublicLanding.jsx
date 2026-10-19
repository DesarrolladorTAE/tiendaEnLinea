import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import PlatformPage from "./PlatformPage";
import FeaturesPage from "./FeaturesPage";
import PlansPage from "./PlansPage";
import ContactPage from "./ContactPage";
import Blogs from "./components/Blogs";
import { LANDING_PAGES } from "./publicSeoConfig.mjs";

function PublicAccessSummary() {
  return <main className="container" style={{ maxWidth: 760, padding: "48px 24px" }}>
    <h1>Iniciar sesión y crear cuenta</h1>
    <p>{LANDING_PAGES["/login-register"].description}</p>
    <p>Los formularios de acceso y registro se habilitan al cargar la aplicación.</p>
    <nav><a href="/">Inicio</a> · <a href="/services">Consultar planes</a> · <a href="/contact">Contacto</a></nav>
    <noscript>Activa JavaScript en tu navegador para iniciar sesión o crear tu cuenta.</noscript>
  </main>;
}

// Build-time rendering only. No authenticated providers or administrative routes.
export function renderPublicLanding(pathname) {
  return renderToString(<StaticRouter location={pathname}><Routes>
    <Route element={<LandingPage />}>
      <Route index element={<HomePage />} />
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/services" element={<PlansPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/blogs" element={<Blogs />} />
    </Route>
    <Route path="/login-register" element={<PublicAccessSummary />} />
  </Routes></StaticRouter>);
}
