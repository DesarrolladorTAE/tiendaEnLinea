import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SEO from "../../components/seo";
import { MARKETING_PAGES } from "../../content/marketing.mjs";
import { renderMarketing } from "../../utils/marketingHtml.mjs";
import { mountMarketing } from "../../utils/marketingRuntime.mjs";

export default function LandingPage() {
  const { pathname } = useLocation();
  const route = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const page = MARKETING_PAGES[route] || MARKETING_PAGES["/"];
  const root = useRef(null);
  useEffect(() => {
    return mountMarketing(root.current?.querySelector("[data-marketing]"));
  }, [route]);
  return <>
    <SEO titleTemplate={page.title.replace(/ \| TeLoRecargo$/, "")} description={page.description} canonical={route} image={page.image} noindex={false} />
    <Helmet><link rel="stylesheet" href="/marketing.css" /></Helmet>
    {/* Contenido propio del sitio, compartido con el HTML público del build. */}
    <div ref={root} dangerouslySetInnerHTML={{ __html: renderMarketing(MARKETING_PAGES[route] ? route : "/") }} />
  </>;
}
