import React from "react";
import PropTypes from "prop-types";
import {
  Helmet,
  HelmetProvider,
} from "react-helmet-async";

const SEO = ({
  title = "MITIENDAENLINEAMX",
  titleTemplate = null,
  description = "Bienvenidos!",
  keywords = "",
  canonicalUrl = "",
  robotsIndex = true,
  robotsFollow = true,
  openGraph = null,
  structuredData = null,
}) => {
  /* =======================================================
     TITLE
  ======================================================= */

  const finalTitle =
    titleTemplate &&
    titleTemplate.includes("%s")
      ? titleTemplate.replace(
          "%s",
          title
        )
      : titleTemplate
      ? `${title} | ${titleTemplate}`
      : title;

  /* =======================================================
     ROBOTS
  ======================================================= */

  const robots = [
    robotsIndex
      ? "index"
      : "noindex",
    robotsFollow
      ? "follow"
      : "nofollow",
  ].join(", ");

  /* =======================================================
     OPEN GRAPH
  ======================================================= */

  const ogTitle =
    openGraph?.title ||
    finalTitle;

  const ogDescription =
    openGraph?.description ||
    description;

  const ogUrl =
    openGraph?.url ||
    canonicalUrl;

  const ogType =
    openGraph?.type ||
    "website";

  /* =======================================================
     OPEN GRAPH IMAGE
  ======================================================= */

  const ogImageData =
    openGraph?.image ||
    null;

  const ogImage =
    typeof ogImageData ===
    "string"
      ? ogImageData
      : ogImageData?.url ||
        ogImageData?.media?.url ||
        "";

  const ogImageAlt =
    typeof ogImageData ===
    "object"
      ? ogImageData?.alt_text ||
        ogImageData?.alt ||
        ogImageData?.title ||
        ogTitle
      : ogTitle;

  const ogImageWidth =
    typeof ogImageData ===
    "object"
      ? ogImageData?.width ||
        null
      : null;

  const ogImageHeight =
    typeof ogImageData ===
    "object"
      ? ogImageData?.height ||
        null
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <HelmetProvider>
      <Helmet>
        {/* ===============================================
            BASE SEO
        =============================================== */}

        <meta
          charSet="utf-8"
        />

        <title>
          {finalTitle}
        </title>

        {description && (
          <meta
            name="description"
            content={
              description
            }
          />
        )}

        {keywords && (
          <meta
            name="keywords"
            content={
              keywords
            }
          />
        )}

        <meta
          name="robots"
          content={
            robots
          }
        />

        {canonicalUrl && (
          <link
            rel="canonical"
            href={
              canonicalUrl
            }
          />
        )}

        {/* ===============================================
            OPEN GRAPH
        =============================================== */}

        <meta
          property="og:type"
          content={
            ogType
          }
        />

        <meta
          property="og:site_name"
          content="Mi Tienda en Línea MX"
        />

        <meta
          property="og:locale"
          content="es_MX"
        />

        {ogTitle && (
          <meta
            property="og:title"
            content={
              ogTitle
            }
          />
        )}

        {ogDescription && (
          <meta
            property="og:description"
            content={
              ogDescription
            }
          />
        )}

        {ogUrl && (
          <meta
            property="og:url"
            content={
              ogUrl
            }
          />
        )}

        {/* ===============================================
            OPEN GRAPH IMAGE

            IMPORTANTE:
            Cada meta es hijo directo de Helmet.
            No utilizar Fragment aquí.
        =============================================== */}

        {ogImage && (
          <meta
            property="og:image"
            content={
              ogImage
            }
          />
        )}

        {ogImage && (
          <meta
            property="og:image:url"
            content={
              ogImage
            }
          />
        )}

        {ogImage && (
          <meta
            property="og:image:secure_url"
            content={
              ogImage
            }
          />
        )}

        {ogImage &&
          ogImageWidth && (
            <meta
              property="og:image:width"
              content={String(
                ogImageWidth
              )}
            />
          )}

        {ogImage &&
          ogImageHeight && (
            <meta
              property="og:image:height"
              content={String(
                ogImageHeight
              )}
            />
          )}

        {ogImage &&
          ogImageAlt && (
            <meta
              property="og:image:alt"
              content={
                ogImageAlt
              }
            />
          )}

        {/* ===============================================
            TWITTER
        =============================================== */}

        <meta
          name="twitter:card"
          content={
            ogImage
              ? "summary_large_image"
              : "summary"
          }
        />

        {ogTitle && (
          <meta
            name="twitter:title"
            content={
              ogTitle
            }
          />
        )}

        {ogDescription && (
          <meta
            name="twitter:description"
            content={
              ogDescription
            }
          />
        )}

        {ogImage && (
          <meta
            name="twitter:image"
            content={
              ogImage
            }
          />
        )}

        {ogImage &&
          ogImageAlt && (
            <meta
              name="twitter:image:alt"
              content={
                ogImageAlt
              }
            />
          )}

        {/* ===============================================
            STRUCTURED DATA
        =============================================== */}

        {structuredData && (
          <script
            type="application/ld+json"
          >
            {JSON.stringify(
              structuredData
            )}
          </script>
        )}
      </Helmet>
    </HelmetProvider>
  );
};

SEO.propTypes = {
  title:
    PropTypes.string,

  titleTemplate:
    PropTypes.string,

  description:
    PropTypes.string,

  keywords:
    PropTypes.string,

  canonicalUrl:
    PropTypes.string,

  robotsIndex:
    PropTypes.bool,

  robotsFollow:
    PropTypes.bool,

  openGraph:
    PropTypes.object,

  structuredData:
    PropTypes.object,
};

export default SEO;