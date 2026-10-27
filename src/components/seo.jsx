import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { DEFAULT_DESCRIPTION, DEFAULT_ORIGIN, ROUTE_TITLES, ROUTE_DESCRIPTIONS } from "../utils/publicSeo.mjs";
import { MARKETING_PAGES } from "../content/marketing.mjs";

const SEO = ({ 
    title = "TeLoRecargo",
    titleTemplate,
    description,
    image = "/og/te-lo-recargo.png",
    canonical,
    noindex,
}) => {
    const { pathname } = useLocation();
    const origin = (import.meta.env.VITE_SITE_URL || DEFAULT_ORIGIN).replace(/\/$/, "");
    const routeTitle = titleTemplate || ROUTE_TITLES[pathname] || "TeLoRecargo";
    const pageTitle = routeTitle === title ? title : `${routeTitle} | ${title}`;
    const url = new URL(canonical || pathname, origin).href;
    const imageUrl = new URL(image, origin).href;
    const pageDescription = description || ROUTE_DESCRIPTIONS[pathname] || DEFAULT_DESCRIPTION;
    const isPublic = Boolean(MARKETING_PAGES[pathname.replace(/\/$/, "") || "/"]) || pathname === "/terminos-condiciones" || /^\/paquetes(?:\/|$)/.test(pathname);
    return (
            <Helmet>
                <html lang="es-MX" />
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta name="robots" content={(noindex ?? !isPublic) ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
                <link rel="canonical" href={url} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="TeLoRecargo" />
                <meta property="og:locale" content="es_MX" />
                <meta property="og:url" content={url} />
                <meta property="og:image" content={imageUrl} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={pageTitle} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={imageUrl} />
            </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    titleTemplate: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    canonical: PropTypes.string,
    noindex: PropTypes.bool,
};

export default SEO;
