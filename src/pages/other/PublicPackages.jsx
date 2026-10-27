import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Alert, CircularProgress } from "@mui/material";
import SEO from "../../components/seo";
import { DEFAULT_ORIGIN, fetchPublicCarriers, fetchCarrierProducts, fetchPublicPackages, money, packageDescription } from "../../utils/publicSeo.mjs";
import { marketingHeader, marketingFooter } from "../../utils/marketingHtml.mjs";
import { mountMarketing } from "../../utils/marketingRuntime.mjs";
import { mountCatalog } from "../../utils/catalogRuntime.mjs";

function CarrierLabel({ name, logo }) {
  return <div className="carrier-identity">{logo && <img data-carrier-logo className="carrier-logo" src={logo} alt={`Logo de ${name}`} width="96" height="56" loading="lazy" decoding="async" referrerPolicy="no-referrer" />}<span className="carrier">{name}</span></div>;
}
function ProductCard({ product, kind }) {
  return <article className="package-card" data-package={`${product.name} ${product.description}`}>
    <div className="package-card-top"><span className="package-kind">{kind === "paquetes" ? "PAQUETE" : "RECARGA"}</span><span className="package-card-dot" /></div>
    <h2>{product.name}</h2><div className="price">{money(product.price)}<span className="currency">MXN</span></div><div className="package-card-rule" />
    <div className="validity"><span>Vigencia</span><strong>{product.validity || "Consulta con tu proveedor"}</strong></div><p className="summary">{product.description || "Consulta los beneficios con tu proveedor."}</p>
    <div className="card-actions">{kind === "paquetes" ? <a className="btn package-card-action" href={product.path}>Ver ficha completa <span aria-hidden="true">↗</span></a> : <p className="airtime-note">Solicita este monto en tu punto de recarga.</p>}</div>
  </article>;
}
function Directory({ carriers }) {
  return <>
    <section className="hero directory-hero"><div className="shell"><span className="eyebrow">ELIGE TU COMPAÑÍA</span><h1>Tu conexión empieza aquí.</h1><p>Primero elige una compañía. Después consulta sus montos o paquetes y abre la ficha del paquete que quieras compartir.</p><label className="carrier-search-label">Buscar compañía<input className="search" type="search" data-carrier-search placeholder="Telcel, BAIT, Movistar…" /></label><span className="directory-count" data-carrier-count role="status">{carriers.length} compañías disponibles</span></div></section>
    <div className="shell carrier-directory">{[["recargas","Recargas de tiempo aire"],["paquetes","Paquetes"]].map(([kind,title]) => <section className="carrier-section" key={kind} aria-labelledby={`heading-${kind}`}>
      <div className="carrier-section-head"><div><span className="eyebrow">{kind === "paquetes" ? "INTERNET Y MÁS" : "SALDO PARA TU LÍNEA"}</span><h2 id={`heading-${kind}`}>{title}</h2></div><div className="carrier-controls"><button type="button" data-carousel-prev aria-label="Compañías anteriores" aria-controls={`track-${kind}`}>←</button><button type="button" data-carousel-next aria-label="Siguientes compañías" aria-controls={`track-${kind}`}>→</button></div></div>
      <div className="carrier-track" data-carrier-track id={`track-${kind}`}>{carriers.filter(item=>item.kind===kind).map(item => <a className="carrier-tile" key={item.path} href={item.path} data-carrier-open data-kind={kind} data-slug={item.slug} data-name={item.name} aria-label={`Ver ${kind} de ${item.name}`}>
        {item.logo && <img data-carrier-logo src={item.logo} alt={item.name} width="160" height="96" loading="lazy" decoding="async" referrerPolicy="no-referrer" />}<span className="carrier-fallback" hidden={Boolean(item.logo)}>{item.name}</span><span className="carrier-tile-arrow" aria-hidden="true">↗</span>
      </a>)}</div><p className="carrier-swipe-note">Desliza o selecciona un logo para ver las opciones de esa compañía.</p>
    </section>)}<p className="carrier-no-results" data-carrier-empty hidden>No encontramos esa compañía. Intenta con otro nombre.</p></div>
    <dialog className="catalog-dialog" data-carrier-dialog aria-labelledby="carrier-dialog-title"><div className="catalog-dialog-head"><div><span className="eyebrow" data-dialog-kind>COMPAÑÍA</span><h2 id="carrier-dialog-title">Opciones de la compañía</h2></div><button className="catalog-dialog-close" type="button" data-dialog-close aria-label="Cerrar opciones">×</button></div><div className="catalog-dialog-body" data-carrier-dialog-content /><div className="catalog-dialog-foot"><a href="/paquetes/" data-company-page>Ver compañía en una página completa ↗</a></div></dialog>
  </>;
}
function LocationDialog({ carrier }) {
  return <dialog className="catalog-dialog location-dialog" data-location-dialog aria-labelledby="location-dialog-title"><div className="catalog-dialog-head"><h2 id="location-dialog-title">Encuentra un punto de recarga</h2><button className="catalog-dialog-close" type="button" data-dialog-close aria-label="Cerrar ubicación">×</button></div><div className="catalog-dialog-body"><p>Por ahora no contamos con un directorio público de negocios afiliados a TeLoRecargo.</p><p>La búsqueda de Maps muestra establecimientos de tu zona. Antes de visitarlos, confirma que ofrezcan este paquete y que trabajen con TeLoRecargo.</p><a className="btn" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`recargas ${carrier} cerca de mí`)}`} target="_blank" rel="noopener noreferrer">Buscar puntos de recarga en Maps ↗</a><a className="btn secondary" href="/contacto">Consultar con TeLoRecargo</a></div></dialog>;
}

export default function PublicPackages() {
  const { slug, companySlug, airtimeSlug } = useParams();
  const [carriers,setCarriers] = useState([]);
  const [products,setProducts] = useState([]);
  const [company,setCompany] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const root = useRef(null);
  useEffect(() => mountMarketing(root.current),[]);
  useEffect(() => mountCatalog(root.current, import.meta.env.DEV ? {loadCompany:async (kind,name) => {
    const carrier = carriers.find(item=>item.kind===kind && item.slug===name);
    if (!carrier) throw new Error('Compañía no disponible.');
    return {carrier,data:await fetchCarrierProducts(carrier)};
  }} : {}),[loading,slug,companySlug,airtimeSlug,carriers]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setProducts([]); setCompany(null);
    const get = async url => {
      const response = await fetch(url,{credentials:"omit",cache:"no-cache",headers:{Accept:"application/json"}});
      if (!response.ok) throw new Error();
      return response.json();
    };
    const load = async () => {
      try {
        if (slug) {
          const values = import.meta.env.DEV ? await fetchPublicPackages() : (await get('/catalogo-paquetes.json')).data;
          if (active) setProducts(values);
        } else if (companySlug || airtimeSlug) {
          const name = companySlug || airtimeSlug;
          const kind = companySlug ? 'paquetes' : 'recargas';
          let payload;
          if (import.meta.env.DEV) {
            const directory = await fetchPublicCarriers();
            const carrier = directory.find(item=>item.kind===kind && item.slug===name);
            if (!carrier) throw new Error();
            payload = {carrier,data:await fetchCarrierProducts(carrier)};
          } else payload = await get(`/catalogo-companias.json?${new URLSearchParams({tipo:kind,compania:name})}`);
          if (active) { setCompany(payload.carrier); setProducts(payload.data); }
        } else {
          const values = import.meta.env.DEV ? await fetchPublicCarriers() : (await get('/catalogo-companias.json')).data;
          if (active) setCarriers(values);
        }
      } catch { if (active) setError('No se pudo cargar el catálogo. Vuelve a intentarlo más tarde.'); }
      finally { if (active) setLoading(false); }
    };
    load(); return () => { active=false; };
  },[slug,companySlug,airtimeSlug]);
  const id = slug?.match(/-([0-9]+)$/)?.[1];
  const product = slug ? products.find(item=>item.id===id) : null;
  const title = product ? `${product.name} · ${product.carrier}` : company ? `${company.kind === 'paquetes' ? 'Paquetes' : 'Recargas'} de ${company.name}` : 'Compañías de recargas y paquetes';
  const canonical = product?.path || company?.path || '/paquetes/';
  const shareUrl = product ? new URL(product.path,import.meta.env.VITE_SITE_URL || DEFAULT_ORIGIN).href : '';
  return <>
    <SEO titleTemplate={title} description={product ? packageDescription(product) : 'Selecciona una compañía, consulta sus opciones y abre la ficha completa de cada paquete para compartirla.'} canonical={canonical} image={product?.image} noindex={Boolean(error || (slug && !loading && !product))} />
    <Helmet><link rel="stylesheet" href="/seo-catalog.css" /><link rel="stylesheet" href="/marketing.css" /></Helmet>
    <div className="m-site m-packages" data-marketing id="arriba" ref={root}>
      <div dangerouslySetInnerHTML={{__html:marketingHeader('/paquetes/')}} />
      <main id="contenido">
        {loading && <div className="shell catalog-loading"><CircularProgress aria-label="Cargando catálogo" /></div>}
        {error && <div className="shell catalog-loading"><Alert severity="error">{error}</Alert></div>}
        {!loading && !error && (product ? <>
          <section className="hero"><div className="shell"><a className="catalog-back" href="/paquetes/">← Volver a compañías</a><CarrierLabel name={product.carrier} logo={product.logo} /><h1>{product.name}</h1><p>Conoce lo que incluye y pídelo con tu proveedor más cercano.</p></div></section>
          <div className="shell detail-grid"><section className="detail-panel"><h2>Todo lo que incluye</h2><p className="description">{product.description}</p><div className="fact"><span>Vigencia</span><strong>{product.validity || 'Consulta con tu proveedor'}</strong></div><div className="fact"><span>Compañía</span><strong>{product.carrier}</strong></div><div className="fact"><span>Precio del catálogo</span><strong>{money(product.price)} MXN</strong></div><p className="note">Confirma precio, cobertura y disponibilidad con tu proveedor antes de solicitarlo.</p></section>
          <aside className="detail-aside"><span className="eyebrow">TU PRÓXIMO PAQUETE</span><div className="price">{money(product.price)} <span className="currency">MXN</span></div><h2>Pídelo en un punto de recarga</h2><p>Muestra esta ficha y confirma el precio y la disponibilidad con el negocio.</p><button className="btn" type="button" data-location-open>Ubicar un punto de recarga ↗</button><a className="btn secondary" href={`https://wa.me/?text=${encodeURIComponent(`${product.name} · ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a><button className="btn secondary" data-share={shareUrl} data-title={product.name}>Compartir enlace</button><p className="share-status" data-share-status role="status" /></aside></div><LocationDialog carrier={product.carrier} />
        </> : company ? <>
          <section className="hero company-hero"><div className="shell"><a className="catalog-back" href="/paquetes/">← Volver a compañías</a><CarrierLabel name={company.name} logo={company.logo} /><h1>{title}</h1><p>{company.kind === 'paquetes' ? 'Elige un paquete para ver todos sus beneficios y compartir la ficha completa.' : 'Consulta los montos y solicita tu recarga en un punto de venta.'}</p></div></section>
          <section className="shell company-options"><div className="toolbar"><span data-result-count role="status">{products.length} opciones disponibles</span><input className="search" type="search" data-package-search aria-label="Buscar una opción" placeholder="Busca un monto o beneficio…" /></div><div className="grid">{products.map(item=><ProductCard product={item} kind={company.kind} key={item.id} />)}</div>{!products.length && <p className="note">No hay opciones disponibles por el momento.</p>}</section>
        </> : slug ? <div className="shell catalog-loading"><Alert severity="info">Este paquete no está disponible.</Alert></div> : <Directory carriers={carriers} />)}
      </main><div dangerouslySetInnerHTML={{__html:marketingFooter()}} />
    </div>
  </>;
}
