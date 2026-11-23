import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { LANDING_PAGES, landingMetadata, landingStructuredData, SITE_NAME, SITE_URL } from "../src/pages/home/publicSeoConfig.mjs";

const dist = path.resolve(process.env.PRERENDER_DIST_DIR || "dist");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const builtIndex = await fs.readFile(path.join(dist, "index.html"), "utf8");
const source = builtIndex.includes('data-landing-prerender="true"') ? await fs.readFile(path.join(dist, "spa.html"), "utf8") : builtIndex;
const manifest = JSON.parse(await fs.readFile(path.join(dist, ".vite/manifest.json"), "utf8"));
const shell = source.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '<title data-rh="true">Mi Tienda en Línea MX</title>');
await fs.writeFile(path.join(dist, "spa.html"), shell);

function pageStyles(route) {
  const entries = { "/": "HomePage", "/platform": "PlatformPage", "/features": "FeaturesPage", "/services": "PlansPage", "/contact": "ContactPage", "/blogs": "components/Blogs" };
  const keys = route === "/login-register" ? ["src/pages/other/LoginRegister.jsx"] : ["src/pages/home/LandingPage.jsx", `src/pages/home/${entries[route]}.jsx`];
  const css = new Set(); const seen = new Set();
  const collect = (key) => {
    if (seen.has(key)) return; seen.add(key);
    const chunk = manifest[key];
    if (!chunk) return;
    (chunk.css || []).forEach((file) => css.add(file));
    (chunk.imports || []).forEach(collect);
  };
  keys.forEach(collect);
  return [...css].filter((file) => !source.includes(`/${file}`)).map((file) => `<link rel="stylesheet" href="/${escape(file)}">`).join("\n");
}

function metadataTags(page) {
  const tags = { description: page.description, robots: "index, follow", "og:title": page.title,
    "og:description": page.description, "og:type": "website", "og:url": page.url, "og:site_name": SITE_NAME,
    "og:locale": "es_MX", "og:image": `${SITE_URL}/assets/logoc.png`, "og:image:alt": SITE_NAME,
    "twitter:card": "summary", "twitter:title": page.title, "twitter:description": page.description, "twitter:image": `${SITE_URL}/assets/logoc.png` };
  return `<title data-rh="true">${escape(page.title)}</title>\n<link data-rh="true" rel="canonical" href="${escape(page.url)}">\n` +
    Object.entries(tags).map(([key, value]) => `<meta data-rh="true" ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${escape(value)}">`).join("\n") +
    `\n<script data-rh="true" type="application/ld+json">${JSON.stringify(landingStructuredData(page)).replaceAll("<", "\\u003c")}</script>`;
}

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
try {
  const { renderPublicLanding } = await server.ssrLoadModule("/src/pages/home/renderPublicLanding.jsx");
  for (const route of Object.keys(LANDING_PAGES)) {
    const page = landingMetadata(route);
    let body = renderPublicLanding(route);
    if (!body.includes("<h1")) throw new Error(`Falta H1 en ${route}`);
    // The same visible copy is available before JavaScript starts scroll animations.
    body = body.replace(/class="([^"<>]*\banimate-on-scroll\b[^"<>]*)"/g, 'class="$1 visible"');
    // Contact/search handlers require React. Do not allow an unbound static form
    // to submit personal information through the browser's default GET action.
    body = body.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/g, '<form$1><fieldset disabled style="border:0;padding:0;margin:0;min-width:0">$2</fieldset><noscript>Active JavaScript para utilizar este formulario.</noscript></form>');
    const html = source.replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/i, "")
      .replace("</head>", `${metadataTags(page)}\n${pageStyles(route)}\n</head>`)
      .replace(/<div id="root"><\/div>/, () => `<div id="root" data-landing-prerender="true">${body}</div>`);
    const directory = route === "/" ? dist : path.join(dist, route.slice(1));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "index.html"), html);
    console.log(`Landing HTML: ${route}`);
  }
  const urls = Object.keys(LANDING_PAGES).map((route) => `<url><loc>${SITE_URL}${route}</loc></url>`).join("\n");
  await fs.writeFile(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
} finally { await server.close(); }
