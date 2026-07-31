import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./styles/index.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollTopButton from "./components/ScrollTopButton";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  const isHome = location.pathname === "/";

  return (
    <div
      className={[
        "landing-root",
        isHome ? "landing-root--home" : "landing-root--internal",
      ].join(" ")}
    >
      <Navbar
        scrolled={scrolled}
        transparent={isHome && !scrolled}
        currentPath={location.pathname}
        onNavigate={navigate}
        onLogin={() => navigate("/login-register")}
      />

      <main className="landing-main">
        <Outlet />
      </main>

      <Footer onNavigate={navigate} />

      <ScrollTopButton />
    </div>
  );
}