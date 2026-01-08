import React, { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./landing.css";
import planes from "../../utils/planes";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Platform from "./components/Platform";
import Features from "./components/Features";
import Plans from "./components/Plans";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ScrollTopButton from "./components/ScrollTopButton";

const PATH_TO_SECTION = {
  "/": "home",
  "/platform": "platform",
  "/features": "features",
  "/services": "services",
  "/contact-landing": "contact",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const offsetTop = target.offsetTop - 61;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }, []);

  // ✅ Cuando cambia la URL, hace scroll a la sección correspondiente
  useEffect(() => {
    const sectionId = PATH_TO_SECTION[location.pathname];
    if (!sectionId) return;

    // pequeño delay para asegurar que el DOM ya renderizó
    const t = setTimeout(() => scrollToSection(sectionId), 0);
    return () => clearTimeout(t);
  }, [location.pathname, scrollToSection]);

  return (
    <div className="landing-root">
      {/* ✅ Ahora el navbar cambia la URL, pero seguimos en la misma landing */}
      <Navbar
        onNavClick={(path) => navigate(path)}
        onLogin={() => navigate("/login-register")}
      />

      <main>
        <section id="home">
          <Hero onStart={() => navigate("/login-register")} />
        </section>

        <section id="platform">
          <Platform />
        </section>

        <section id="features">
          <Features />
        </section>

        <section id="services">
          <Plans planes={planes} />
        </section>

        <section id="contact">
          <Contact />
        </section>
      </main>

      <Footer />
      <ScrollTopButton />
    </div>
  );
};

export default LandingPage;
