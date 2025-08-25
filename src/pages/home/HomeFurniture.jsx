// src/pages/home/HomeFurniture.jsx
import React, { Fragment, useEffect, useState } from "react";
/* LOGICA NUEVA */
import { useParams } from "react-router-dom";
import axios from "axios";

import HeroSliderTwo from "../../wrappers/hero-slider/HeroSliderTwo";
import TabProductTwo from "../../wrappers/product/TabProductTwo";
import FeatureIconTwo from "../../wrappers/feature-icon/FeatureIconTwo";
import BlogFeatured from "../../wrappers/blog-featured/BlogFeatured";
import TiendaNoDisponible from "../other/TiendaNoDisponible";
import Catalogo from "../shop/Catalogo";

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
      .get(`https://mitiendaenlineamx.com.mx/api/public/tienda/${storeSlug}/sitio`)
      .then(({ data }) => {
        if (!alive) return;
        setResp(data);
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

  const titulo1 =
    sitio?.titulo_1 ?? "Explora nuestras colecciones";
  const descripcion =
    sitio?.descripcion ?? "Descubre piezas pensadas para inspirarte cada día.";

  // ✅ Mostrar hero/sections SOLO si hay logo Y portada
  const hasHero = Boolean(sitio?.logo && sitio?.img_portada);

  // Redes
  const socials = {
    facebook: sitio?.facebook || "",
    instagram: sitio?.instagram || "",
    twitter: sitio?.twitter || "",
    tiktok: sitio?.tiktok || "",
  };

  const storeName = store?.name || DEFAULTS.storeName;

  // Galería para BlogFeatured (cuando sí hay hero)
  const imagesFromNumbered = [];
  if (sitio) {
    for (let i = 1; i <= 50; i++) {
      const k = `imagen_${i}`;
      if (sitio[k]) imagesFromNumbered.push({ src: sitio[k], alt: `${storeName} ${i}` });
    }
  }
  const imagesFromArray = Array.isArray(sitio?.carrusel)
    ? sitio.carrusel
        .filter(Boolean)
        .map((src, idx) =>
          typeof src === "string" ? { src, alt: `${storeName} ${idx + 1}` } : src
        )
    : [];
  const bannerImages = [...imagesFromNumbered, ...imagesFromArray];

  // 🔒 Si NO hay hero, devolvemos SOLO el catálogo
  if (!hasHero) {
    return (
      <Fragment>
        <Catalogo key={storeSlug} />
      </Fragment>
    );
  }

  // 🌟 Con hero completo (logo + portada), render normal
  return (
    <Fragment>
      <HeroSliderTwo
        coverImage={sitio.img_portada}
        logoImage={sitio.logo}
        storeName={store.name}
      />

      <TabProductTwo
        spaceBottomClass="pb-100"
        spaceTopClass="pt-80"
        category="furniture"
        title={titulo1}
        description={descripcion}
      />

      <Catalogo key={storeSlug} />

      <BlogFeatured
        storeName={storeName}
        images={bannerImages.map((x, i) => ({
          src: x.src,
          title: x.alt || `Imagen ${i + 1}`,
        }))}
      />

      <FeatureIconTwo
        spaceTopClass="pt-100"
        spaceBottomClass="pb-60"
        storeName={store?.name || DEFAULTS.storeName}
        phone={store?.phone || DEFAULTS.phone}
        email={store?.email || DEFAULTS.email}
        socials={socials}
        subtitle="Respuestas claras, soporte cercano y promociones antes que nadie."
      />
    </Fragment>
  );
};

export default HomeFurniture;
