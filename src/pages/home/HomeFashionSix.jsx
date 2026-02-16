// src/pages/home/HomeFashionSix.jsx
import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import SEO from "../../components/seo";
import HeroSliderFourteen from "../../wrappers/hero-slider/HeroSliderFourteen";
import SectionTitleWithText from "../../components/section-title/SectionTitleWithText";
import Catalogo from "../shop/Catalogo";
import BlogFeatured from "../../wrappers/blog-featured/BlogFeatured";
import TiendaNoDisponible from "../other/TiendaNoDisponible";

const DEFAULTS = {
  coverImage: "/assets/img/post/1.png",
  logoImage: "/assets/img/logo/logo.png",
  storeName: "MiTiendaEnLineaMX",
  phone: "+52 55 1234 5678",
  email: "contacto@mitiendaenlineamx.com.mx",
  titulo_1: "¡Conócenos!",
  descripcion: "Tu tienda en línea fácil, rápida y flexible.",
};

export default function HomeFashionSix() {
  const { storeSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [resp, setResp] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get(
        `https://mitiendaenlineamx.com.mx/api/public/tienda/${storeSlug}/sitio`,
      )
      .then(({ data }) => {
        if (alive) setResp(data);
      })
      .catch(() => {
        if (alive) setResp(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [storeSlug]);

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;

  // Si la tienda está vencida/no disponible → pantalla de bloqueo
  if (resp && resp.ok === false && resp.expired) {
    return <TiendaNoDisponible />;
  }

  const store = resp?.store || {};
  const sitio = resp?.sitio || null;

  // Hay datos reales si al menos uno de estos campos existe
  const hasConfig = Boolean(
    sitio &&
    (sitio.logo || sitio.img_portada || sitio.titulo_1 || sitio.descripcion),
  );

  const coverImage = sitio?.img_portada || DEFAULTS.coverImage;
  const logoImage = sitio?.logo || DEFAULTS.logoImage;
  const storeName = store?.name || DEFAULTS.storeName;
  const phone = store?.phone || DEFAULTS.phone;
  const email = store?.email || DEFAULTS.email;

  const titulo1 = sitio?.titulo_1 || DEFAULTS.titulo_1;
  const descripcion = sitio?.descripcion || DEFAULTS.descripcion;

  return (
    <Fragment>
      <SEO titleTemplate={storeName} description={descripcion} />

      {/* 👇 Solo se renderiza si hay datos reales */}
      <HeroSliderFourteen
        visible={hasConfig}
        coverImage={coverImage}
        logoImage={logoImage}
        storeName={storeName}
        phone={phone}
        email={email}
      />

      {/* Siempre muestra el catálogo */}
      <Catalogo
        key={storeSlug}
        storeSlug={storeSlug}
        storeName={storeName}
        storePhone={phone}
      />

      <BlogFeatured />
    </Fragment>
  );
}
