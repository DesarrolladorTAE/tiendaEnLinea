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
import LandingContactSection from "../../components/landing/LandingContactSection";
import LandingFooterSection from "../../components/landing/LandingFooterSection";

const LandingPage = () => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
        backgroundColor: '#fff',
        margin: 0,
        padding: 0,
      }}
    >
      <LandingNavbar />

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

      <Box id="contact">  
        <LandingContactSection/>
      </Box>

      <LandingFooterSection />
    </Box>
  );
};


export default LandingPage;
