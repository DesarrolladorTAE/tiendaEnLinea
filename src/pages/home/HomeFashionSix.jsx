// src/pages/home/HomeFashionSix.jsx

import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import SEO from "../../components/seo";
import HeroSliderFourteen from "../../wrappers/hero-slider/HeroSliderFourteen";
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

export default function HomeFashionSix({
  storeSlug: propStoreSlug = null,
  storeId = null,
}) {
  const { storeSlug: routeStoreSlug } = useParams();

  // ✅ Prioridad:
  // 1. slug recibido desde PersonalizacionSitio
  // 2. slug recibido directamente desde /tienda/:storeSlug
  const storeSlug = propStoreSlug || routeStoreSlug;

  const [loading, setLoading] = useState(true);
  const [resp, setResp] = useState(null);

  useEffect(() => {
    let alive = true;

    // ✅ Evitamos peticiones con undefined
    if (!storeSlug) {
      setResp(null);
      setLoading(false);

      return () => {
        alive = false;
      };
    }

    setLoading(true);
    setResp(null);

    axios
      .get(
        `https://mitiendaenlineamx.com.mx/api/public/tienda/${encodeURIComponent(
          storeSlug,
        )}/sitio`,
      )
      .then(({ data }) => {
        if (!alive) return;

        setResp(data);
      })
      .catch((error) => {
        if (!alive) return;

        console.error(
          "Error cargando configuración de la tienda:",
          error,
        );

        setResp(null);
      })
      .finally(() => {
        if (!alive) return;

        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [storeSlug]);

  if (loading) {
    return <div style={{ padding: 16 }}>Cargando…</div>;
  }

  // ✅ Si no tenemos slug, no continuar
  if (!storeSlug) {
    return <TiendaNoDisponible />;
  }

  // ✅ Si API indica tienda vencida/no disponible
  if (resp && resp.ok === false && resp.expired) {
    return <TiendaNoDisponible />;
  }

  const store = resp?.store || {};
  const sitio = resp?.sitio || null;

  const hasConfig = Boolean(
    sitio &&
      (
        sitio.logo ||
        sitio.img_portada ||
        sitio.titulo_1 ||
        sitio.descripcion
      ),
  );

  const coverImage =
    sitio?.img_portada ||
    DEFAULTS.coverImage;

  const logoImage =
    sitio?.logo ||
    DEFAULTS.logoImage;

  const storeName =
    store?.name ||
    DEFAULTS.storeName;

  const phone =
    store?.phone ||
    DEFAULTS.phone;

  const email =
    store?.email ||
    DEFAULTS.email;

  const titulo1 =
    sitio?.titulo_1 ||
    DEFAULTS.titulo_1;

  const descripcion =
    sitio?.descripcion ||
    DEFAULTS.descripcion;

  return (
    <Fragment>
      <SEO
        titleTemplate={storeName}
        description={descripcion}
      />

      <HeroSliderFourteen
        visible={hasConfig}
        coverImage={coverImage}
        logoImage={logoImage}
        storeName={storeName}
        phone={phone}
        email={email}
      />

      <Catalogo
        key={storeSlug}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
        storePhone={phone}
      />

      <BlogFeatured
        storeName={storeName}
      />
    </Fragment>
  );
}