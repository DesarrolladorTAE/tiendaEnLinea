import React from "react";
import PropTypes from "prop-types";
import { Helmet, HelmetProvider } from "react-helmet-async";

const SEO = ({
  title = "MITIENDAENLINEAMX",
  titleTemplate = null, // puede ser "%s | MiTiendaEnLineaMX" o null
  description = "Bienvenidos!"
}) => {
  const finalTitle = titleTemplate && titleTemplate.includes("%s")
    ? titleTemplate.replace("%s", title)
    : titleTemplate
    ? `${title} | ${titleTemplate}`
    : title;

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{finalTitle}</title>
        <meta name="description" content={description} />
      </Helmet>
    </HelmetProvider>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  titleTemplate: PropTypes.string,
  description: PropTypes.string,
};

export default SEO;
