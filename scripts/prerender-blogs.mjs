import fs from "node:fs/promises";
import path from "node:path";

const API_BASE_URL =
  "https://api.tecnologiasadministrativas.com/api/public/v1";

const SYSTEM_SLUG = "mi-tienda-en-linea-mx";
const BLOG_SLUG = "blog-mi-tienda";

const SITE_NAME = "Mi Tienda en Línea MX";

const DIST_DIR = path.resolve(
  process.env.PRERENDER_DIST_DIR || "dist"
);

const LIST_URL =
  `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}/posts`;

const DETAIL_URL = (slug) =>
  `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}/posts/${encodeURIComponent(
    slug
  )}`;

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cleanText(value = "") {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeSlug(value = "") {
  const slug = String(value).trim();

  if (
    !slug ||
    !/^[a-zA-Z0-9_-]+$/.test(slug)
  ) {
    throw new Error(
      `Slug inválido: ${slug}`
    );
  }

  return slug;
}

function normalizePosts(payload) {
  if (
    Array.isArray(
      payload?.data?.data
    )
  ) {
    return payload.data.data;
  }

  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.posts?.data
    )
  ) {
    return payload.posts.data;
  }

  if (
    Array.isArray(
      payload?.posts
    )
  ) {
    return payload.posts;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function normalizePost(payload) {
  return (
    payload?.data ??
    payload ??
    null
  );
}

/* =========================================================
   HTTP
========================================================= */

async function fetchJson(url) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 20000);

  try {
    const response =
      await fetch(url, {
        method: "GET",
        headers: {
          Accept:
            "application/json",
          "User-Agent":
            "MTELMX-Blog-SEO-Prerender/1.0",
        },
        signal:
          controller.signal,
      });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} al consultar ${url}`
      );
    }

    return await response.json();
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        `Tiempo de espera agotado al consultar ${url}`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   POSTS
========================================================= */

async function getAllPosts() {
  const posts = [];
  const seen = new Set();

  for (
    let page = 1;
    page <= 100;
    page += 1
  ) {
    const url =
      new URL(LIST_URL);

    url.searchParams.set(
      "per_page",
      "50"
    );

    url.searchParams.set(
      "order",
      "latest"
    );

    url.searchParams.set(
      "page",
      String(page)
    );

    console.log(
      `Consultando publicaciones, página ${page}...`
    );

    const payload =
      await fetchJson(
        url.toString()
      );

    const pagePosts =
      normalizePosts(payload);

    if (!pagePosts.length) {
      break;
    }

    for (
      const post of pagePosts
    ) {
      if (!post?.slug) {
        continue;
      }

      const slug =
        safeSlug(post.slug);

      if (seen.has(slug)) {
        continue;
      }

      seen.add(slug);

      posts.push({
        ...post,
        slug,
      });
    }

    if (
      pagePosts.length < 50
    ) {
      break;
    }
  }

  return posts;
}

/* =========================================================
   REMOVE EXISTING SEO
========================================================= */

function stripManagedSeo(html) {
  let output = html;

  output =
    output.replace(
      /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
      ""
    );

  output =
    output.replace(
      /<meta\b[^>]*name=["'](?:description|keywords|robots|twitter:[^"']+)["'][^>]*>\s*/gi,
      ""
    );

  output =
    output.replace(
      /<meta\b[^>]*property=["'](?:og:[^"']+|article:[^"']+)["'][^>]*>\s*/gi,
      ""
    );

  output =
    output.replace(
      /<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi,
      ""
    );

  output =
    output.replace(
      /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>\s*/gi,
      ""
    );

  output =
    output.replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      ""
    );

  return output;
}

/* =========================================================
   SEO
========================================================= */

function buildSeoHtml(post) {
  const seo =
    post?.seo ?? {};

  const openGraph =
    post?.open_graph ?? {};

  const structuredData =
    post?.structured_data ??
    null;

  const title =
    seo?.title ||
    post?.title ||
    SITE_NAME;

  const description =
    cleanText(
      seo?.description ||
        post?.excerpt ||
        ""
    );

  const canonical =
    seo?.canonical_url ||
    post?.url ||
    openGraph?.url ||
    "";

  const keywords =
    Array.isArray(
      seo?.keywords
    )
      ? seo.keywords
          .filter(Boolean)
          .join(", ")
      : String(
          seo?.keywords ||
            ""
        ).trim();

  const robots = [
    seo?.robots_index === false
      ? "noindex"
      : "index",

    seo?.robots_follow === false
      ? "nofollow"
      : "follow",
  ].join(", ");

  const ogTitle =
    openGraph?.title ||
    title;

  const ogDescription =
    cleanText(
      openGraph?.description ||
        description
    );

  const ogUrl =
    openGraph?.url ||
    canonical;

  const ogType =
    openGraph?.type ||
    "article";

  const imageData =
    openGraph?.image ||
    post?.cover ||
    null;

  const ogImage =
    typeof imageData ===
    "string"
      ? imageData
      : imageData?.url ||
        "";

  const ogImageAlt =
    typeof imageData ===
    "object"
      ? imageData?.alt_text ||
        imageData?.alt ||
        imageData?.title ||
        ogTitle
      : ogTitle;

  const ogImageWidth =
    typeof imageData ===
    "object"
      ? imageData?.width ||
        null
      : null;

  const ogImageHeight =
    typeof imageData ===
    "object"
      ? imageData?.height ||
        null
      : null;

  const tags = [];

  tags.push(
    `<title>${escapeHtml(
      title
    )}</title>`
  );

  if (description) {
    tags.push(
      `<meta name="description" content="${escapeHtml(
        description
      )}">`
    );
  }

  if (keywords) {
    tags.push(
      `<meta name="keywords" content="${escapeHtml(
        keywords
      )}">`
    );
  }

  tags.push(
    `<meta name="robots" content="${escapeHtml(
      robots
    )}">`
  );

  if (canonical) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(
        canonical
      )}">`
    );
  }

  tags.push(
    `<meta property="og:type" content="${escapeHtml(
      ogType
    )}">`
  );

  tags.push(
    `<meta property="og:site_name" content="${escapeHtml(
      SITE_NAME
    )}">`
  );

  tags.push(
    `<meta property="og:locale" content="es_MX">`
  );

  tags.push(
    `<meta property="og:title" content="${escapeHtml(
      ogTitle
    )}">`
  );

  if (ogDescription) {
    tags.push(
      `<meta property="og:description" content="${escapeHtml(
        ogDescription
      )}">`
    );
  }

  if (ogUrl) {
    tags.push(
      `<meta property="og:url" content="${escapeHtml(
        ogUrl
      )}">`
    );
  }

  if (ogImage) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(
        ogImage
      )}">`
    );

    tags.push(
      `<meta property="og:image:url" content="${escapeHtml(
        ogImage
      )}">`
    );

    tags.push(
      `<meta property="og:image:secure_url" content="${escapeHtml(
        ogImage
      )}">`
    );

    if (ogImageWidth) {
      tags.push(
        `<meta property="og:image:width" content="${escapeHtml(
          ogImageWidth
        )}">`
      );
    }

    if (ogImageHeight) {
      tags.push(
        `<meta property="og:image:height" content="${escapeHtml(
          ogImageHeight
        )}">`
      );
    }

    if (ogImageAlt) {
      tags.push(
        `<meta property="og:image:alt" content="${escapeHtml(
          ogImageAlt
        )}">`
      );
    }
  }

  if (post?.published_at) {
    tags.push(
      `<meta property="article:published_time" content="${escapeHtml(
        post.published_at
      )}">`
    );
  }

  if (post?.updated_at) {
    tags.push(
      `<meta property="article:modified_time" content="${escapeHtml(
        post.updated_at
      )}">`
    );
  }

  tags.push(
    `<meta name="twitter:card" content="${
      ogImage
        ? "summary_large_image"
        : "summary"
    }">`
  );

  tags.push(
    `<meta name="twitter:title" content="${escapeHtml(
      ogTitle
    )}">`
  );

  if (ogDescription) {
    tags.push(
      `<meta name="twitter:description" content="${escapeHtml(
        ogDescription
      )}">`
    );
  }

  if (ogImage) {
    tags.push(
      `<meta name="twitter:image" content="${escapeHtml(
        ogImage
      )}">`
    );

    if (ogImageAlt) {
      tags.push(
        `<meta name="twitter:image:alt" content="${escapeHtml(
          ogImageAlt
        )}">`
      );
    }
  }

  if (structuredData) {
    const jsonLd =
      JSON.stringify(
        structuredData
      )
        .replace(
          /</g,
          "\\u003c"
        )
        .replace(
          />/g,
          "\\u003e"
        )
        .replace(
          /&/g,
          "\\u0026"
        );

    tags.push(
      `<script type="application/ld+json">${jsonLd}</script>`
    );
  }

  return tags.join(
    "\n    "
  );
}

/* =========================================================
   GENERATE
========================================================= */

async function prerenderPost(
  baseHtml,
  slug
) {
  const safePostSlug =
    safeSlug(slug);

  const payload =
    await fetchJson(
      DETAIL_URL(
        safePostSlug
      )
    );

  const post =
    normalizePost(payload);

  if (!post?.slug) {
    throw new Error(
      `La publicación ${safePostSlug} no devolvió un slug válido.`
    );
  }

  const responseSlug =
    safeSlug(post.slug);

  const cleanHtml =
    stripManagedSeo(
      baseHtml
    );

  if (
    !/<\/head>/i.test(
      cleanHtml
    )
  ) {
    throw new Error(
      "El archivo index.html no contiene </head>."
    );
  }

  const seoHtml =
    buildSeoHtml(post);

  const rendered =
    cleanHtml.replace(
      /<\/head>/i,
      `    ${seoHtml}\n  </head>`
    );

  const outputDirectory =
    path.join(
      DIST_DIR,
      "blogs",
      responseSlug
    );

  await fs.mkdir(
    outputDirectory,
    {
      recursive: true,
    }
  );

  const outputFile =
    path.join(
      outputDirectory,
      "index.html"
    );

  await fs.writeFile(
    outputFile,
    rendered,
    "utf8"
  );

  console.log(
    `✓ /blogs/${responseSlug}`
  );
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  const baseIndexPath =
    path.join(
      DIST_DIR,
      "index.html"
    );

  console.log("");
  console.log(
    "============================================"
  );
  console.log(
    " Mi Tienda en Línea MX - Blog Prerender"
  );
  console.log(
    "============================================"
  );
  console.log("");

  console.log(
    `Directorio de trabajo: ${DIST_DIR}`
  );

  try {
    await fs.access(
      baseIndexPath
    );
  } catch {
    throw new Error(
      `No existe ${baseIndexPath}.`
    );
  }

  const baseHtml =
    await fs.readFile(
      baseIndexPath,
      "utf8"
    );

  const posts =
    await getAllPosts();

  console.log("");
  console.log(
    `Publicaciones encontradas: ${posts.length}`
  );
  console.log("");

  if (
    posts.length === 0
  ) {
    console.log(
      "No hay publicaciones para generar."
    );

    return;
  }

  let generated = 0;

  for (
    const post of posts
  ) {
    await prerenderPost(
      baseHtml,
      post.slug
    );

    generated += 1;
  }

  console.log("");
  console.log(
    `Prerender terminado: ${generated} publicación(es).`
  );
  console.log("");
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "Error generando prerender de blogs:"
    );
    console.error(
      error?.message ||
        error
    );
    console.error("");

    process.exit(1);
  }
);