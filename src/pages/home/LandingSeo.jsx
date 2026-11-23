import React from "react";
import SEO from "../../components/seo";
import { landingMetadata, landingStructuredData, SITE_NAME, SITE_URL } from "./publicSeoConfig.mjs";

export default function LandingSeo({ pathname }) {
  const page = landingMetadata(pathname);
  if (!page) return null; // Blog posts keep their existing article metadata.
  return <SEO title={page.title} description={page.description} canonicalUrl={page.url}
    openGraph={{ title: page.title, description: page.description, url: page.url, siteName: SITE_NAME, type: "website", image: { url: `${SITE_URL}/assets/logoc.png`, alt: SITE_NAME } }}
    structuredData={landingStructuredData(page)} />;
}
