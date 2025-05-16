import React from "react";
import { Box } from "@mui/material";

// Secciones modulares
import LandingNavbar from "../../components/landing/LandingNavbar";
import LandingHeroSection from "../../components/landing/LandingHeroSection";
import LandingFeaturesSection from "../../components/landing/LandingFeaturesSection";
import LandingAboutSection from "../../components/landing/LandingAboutSection";
import LandingPricingSection from "../../components/landing/LandingPricingSection";
import LandingTestimonialsSection from "../../components/landing/LandingTestimonialsSection";
import LandingFAQSection from "../../components/landing/LandingFAQSection";
import LandingFooterSection from "../../components/landing/LandingFooterSection";

const LandingPage = () => {
  return (
    <Box sx={{ scrollBehavior: "smooth", backgroundColor: "#fff" }}>
      {/* Navbar fija */}
      <LandingNavbar />

      {/* Secciones principales */}
      <Box id="home">
        <LandingHeroSection />
      </Box>

      <Box id="features">
        <LandingFeaturesSection />
      </Box>

      <Box id="about">
        <LandingAboutSection />
      </Box>

      <Box id="pricing">
        <LandingPricingSection />
      </Box>

      <Box id="testimonials">
        <LandingTestimonialsSection />
      </Box>

      <Box id="faqs">
        <LandingFAQSection />
      </Box>

      {/* Footer */}
      <LandingFooterSection />
    </Box>
  );
};

export default LandingPage;
