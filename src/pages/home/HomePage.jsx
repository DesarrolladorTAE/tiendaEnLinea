import React from "react";
import { useNavigate } from "react-router-dom";

import Hero from "./components/Hero";
import Platform from "./components/Platform";
import Features from "./components/Features";
import Plans from "./components/Plans";
import Contact from "./components/Contact";

import planes from "../../utils/planes";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Hero
        onStart={() => navigate("/login-register")}
        onDemo={() => navigate("/contact-landing")}
      />

      <Platform preview />

      <Features preview />

      <Plans planes={planes} preview />

      <Contact preview />
    </>
  );
}