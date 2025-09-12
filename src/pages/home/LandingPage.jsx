import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    const offsetTop = target.offsetTop - 61;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }, []);

  return (
    <div className="landing-root">
      <Navbar onNavClick={scrollToSection} onLogin={() => navigate("/login-register")} />

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
