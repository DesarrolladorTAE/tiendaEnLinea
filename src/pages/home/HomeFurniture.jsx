// src/pages/home/HomeFurniture.jsx
import React, { Fragment, useEffect, useState } from "react";
/* LOGICA NUEVA */
import { useParams } from "react-router-dom";
import axios from "axios";
/* FIN LOGICA NUEVA */

import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import HeroSliderTwo from "../../wrappers/hero-slider/HeroSliderTwo";
import BannerTwo from "../../wrappers/banner/BannerTwo";
import TabProductTwo from "../../wrappers/product/TabProductTwo";
import CountDownOne from "../../wrappers/countdown/CountDownOne";
import FeatureIconTwo from "../../wrappers/feature-icon/FeatureIconTwo";
import BlogFeatured from "../../wrappers/blog-featured/BlogFeatured";
/* LOGICA NUEVA (opcional si ya existe) */
import TiendaNoDisponible from "../other/TiendaNoDisponible";
/* FIN LOGICA NUEVA */

// --- LOGICA NUEVA: valores por defecto para el hero ---
const DEFAULTS = {
  coverImage: "/assets/img/post/1.png",
  logoImage: "/assets/img/logo/logo.png",
  storeName: "MiTiendaEnLineaMX",
  phone: "+52 55 1234 5678",
  email: "contacto@mitiendaenlineamx.com.mx",
  titulo_1: "¡Conócenos!",
  descripcion: "Tu tienda en línea fácil, rápida y flexible.",
};

const HomeFurniture = () => {
  /* --- LOGICA NUEVA --- */
  const { storeSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [resp, setResp] = useState(null);
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get(
        `https://mitiendaenlineamx.com.mx/api/public/tienda/${storeSlug}/sitio`
      )
      .then(({ data }) => {
        if (!alive) return;
        setResp(data);
        // plan_id desde la respuesta (ajusta si tu API lo expone en otra ruta/prop)
        const p = data?.store?.plan_id ?? null;
        setPlanId(p);
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
  if (resp && resp.ok === false && resp.expired) return <TiendaNoDisponible />;

  const store = resp?.store || {};
  const sitio = resp?.sitio || null;
  const titulo1 = resp?.sitio?.titulo_1 ?? "Explora nuestras colecciones";
  const descripcion =
    resp?.sitio?.descripcion ??
    "Descubre piezas pensadas para inspirarte cada día.";

  // hay configuración real si alguno existe
  const hasConfig = Boolean(
    sitio &&
      (sitio.logo || sitio.img_portada || sitio.titulo_1 || sitio.descripcion)
  );

  const coverImage = sitio?.img_portada || DEFAULTS.coverImage;
  const logoImage = sitio?.logo || DEFAULTS.logoImage;
  const storeName = store?.name || DEFAULTS.storeName;
  /* --- FIN LOGICA NUEVA --- */

  return (
    <Fragment>
      {/* <SEO
        titleTemplate="Furniture Home"
        description="Furniture home of flone react minimalist eCommerce template."
      />
      <LayoutOne headerTop="visible"> */}
      {/* hero slider (se muestra si hay config real; si prefieres siempre, quita la condición) */}
      {hasConfig && (
        <HeroSliderTwo
          coverImage={sitio?.img_portada}
          logoImage={sitio?.logo}
          storeName={store?.name}
        />
      )}
      {!hasConfig && <HeroSliderTwo />}

      {/* catálogo inmediatamente después del hero */}
      <TabProductTwo
        spaceBottomClass="pb-100"
        spaceTopClass="pt-80"
        category="furniture"
        title={titulo1}
        description={descripcion}
      />

      {/* Las siguientes vistas se conservan y solo aparecen si plan_id === 3 */}
      {planId === 3 && (
        <>
          <BannerTwo spaceTopClass="pt-80" spaceBottomClass="pb-60" />

          <CountDownOne
            spaceTopClass="pt-115"
            spaceBottomClass="pb-115"
            bgImg="/assets/img/bg/bg-1.jpg"
            dateTime="November 13, 2023 12:12:00"
          />

          <FeatureIconTwo spaceTopClass="pt-100" spaceBottomClass="pb-60" />

          <BlogFeatured spaceBottomClass="pb-55" />
        </>
      )}
    </Fragment>
  );
};

export default HomeFurniture;
