import React, { useEffect } from "react";
import SEO from "../seo";
import { asStorefrontObject, getStorefrontBrand, storefrontAssetUrl } from "../../utils/storefrontBranding";

export default function StorefrontMetadata({ payload, product }) {
  const site = asStorefrontObject(payload?.sitio || payload?.site);
  const identity = asStorefrontObject(site.identity);
  const hero = asStorefrontObject(site.hero);
  const brand = getStorefrontBrand(payload);
  const title = product ? `${product.name} | ${brand.name}` : brand.name;
  const description = String(product?.shortDescription || product?.fullDescription || identity.description || site.descripcion || hero.subtitle || `Explora los productos de ${brand.name}.`).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  let images = product?.image || [];
  if (typeof images === "string") { try { images = JSON.parse(images); } catch { images = [images]; } }
  const image = (product && storefrontAssetUrl(Array.isArray(images) ? images[0] : images)) || brand.logo;
  const canonical = new URL(window.location.pathname, window.location.origin);
  const branch = new URLSearchParams(window.location.search).get("branch");
  if (branch) canonical.searchParams.set("branch", branch);

  useEffect(() => {
    if (!brand.logo) return undefined;
    const originals = [...document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')];
    const saved = originals.map((link) => ({ link, href: link.getAttribute("href"), type: link.getAttribute("type") }));
    const created = originals.length ? [] : [document.createElement("link")];
    created.forEach((link) => { link.rel = "icon"; document.head.appendChild(link); });
    [...originals, ...created].forEach((link) => { link.href = brand.logo; link.removeAttribute("type"); });
    return () => {
      created.forEach((link) => link.remove());
      saved.forEach(({ link, href, type }) => {
        if (href === null) link.removeAttribute("href"); else link.setAttribute("href", href);
        if (type === null) link.removeAttribute("type"); else link.setAttribute("type", type);
      });
    };
  }, [brand.logo]);

  return <SEO title={title} description={description} canonicalUrl={canonical.href} openGraph={{ title, description, url: canonical.href, siteName: brand.name, type: "website", image: image ? { url: image, alt: product?.name || `Logo de ${brand.name}` } : null }} />;
}
