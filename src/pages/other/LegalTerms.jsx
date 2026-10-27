import React, { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "../../components/seo";
import terminos from "../../utils/terminos";
import { marketingHeader, marketingFooter } from "../../utils/marketingHtml.mjs";
import { mountMarketing } from "../../utils/marketingRuntime.mjs";

export default function LegalTerms() {
  const root = useRef(null);
  useEffect(() => {
    return mountMarketing(root.current);
  }, []);
  return <>
    <SEO titleTemplate="Términos y condiciones" description="Consulta los términos y condiciones de uso de la plataforma TeLoRecargo." />
    <Helmet><link rel="stylesheet" href="/marketing.css" /></Helmet>
    <div className="m-site" data-marketing id="arriba" ref={root}>
      <div dangerouslySetInnerHTML={{ __html: marketingHeader('/terminos-condiciones') }} />
      <main id="contenido" className="m-container m-legal">
        <nav className="m-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><span>Términos y condiciones</span></nav>
        <h1>{terminos.titulo}</h1><p className="m-legal-subtitle">{terminos.subtitulo}</p>
        {terminos.secciones.map((section, index) => <section className="m-legal-section" key={index}>
          <h2>{section.titulo}</h2>
          {/<\/?[a-z][\s\S]*>/i.test(section.contenido)
            ? <div dangerouslySetInnerHTML={{ __html: section.contenido }} />
            : <p>{section.contenido}</p>}
        </section>)}
      </main>
      <div dangerouslySetInnerHTML={{ __html: marketingFooter() }} />
    </div>
  </>;
}
