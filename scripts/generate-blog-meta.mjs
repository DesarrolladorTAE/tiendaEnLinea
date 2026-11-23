import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL =
  "https://api.tecnologiasadministrativas.com/api/public/v1";

const SYSTEM_SLUG =
  "mi-tienda-en-linea-mx";

const BLOG_SLUG =
  "blog-mi-tienda";

const SITE_NAME =
  "Mi Tienda en Línea MX";

const BLOG_ROUTE =
  "blogs";

const DIST_DIRECTORY =
  path.resolve(
    process.cwd(),
    "dist"
  );

const DIST_INDEX =
  path.join(
    DIST_DIRECTORY,
    "index.html"
  );

const PER_PAGE = 50;

/* =========================================================
   HTTP
========================================================= */

const requestJson = (
  url,
  redirects = 0
) => {
  return new Promise(
    (resolve, reject) => {
      const request =
        https.get(
          url,
          {
            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "MTELMX-Blog-SEO-Generator/1.0",
            },
          },
          (response) => {
            const statusCode =
              response.statusCode ||
              0;

            /*
             * Redirecciones.
             */
            if (
              statusCode >= 300 &&
              statusCode < 400 &&
              response.headers
                .location
            ) {
              response.resume();

              if (
                redirects >= 5
              ) {
                reject(
                  new Error(
                    `Demasiadas redirecciones al consultar ${url}`
                  )
                );

                return;
              }

              const redirectUrl =
                new URL(
                  response.headers
                    .location,
                  url
                ).toString();

              resolve(
                requestJson(
                  redirectUrl,
                  redirects + 1
                )
              );

              return;
            }

            let body = "";

            response.setEncoding(
              "utf8"
            );

            response.on(
              "data",
              (chunk) => {
                body += chunk;
              }
            );

            response.on(
              "end",
              () => {
                if (
                  statusCode < 200 ||
                  statusCode >= 300
                ) {
                  reject(
                    new Error(
                      `La API respondió ${statusCode} al consultar ${url}`
                    )
                  );

                  return;
                }

                try {
                  resolve(
                    JSON.parse(
                      body
                    )
                  );
                } catch {
                  reject(
                    new Error(
                      `La API no devolvió JSON válido: ${url}`
                    )
                  );
                }
              }
            );
          }
        );

      request.on(
        "error",
        reject
      );

      request.setTimeout(
        20000,
        () => {
          request.destroy(
            new Error(
              `Tiempo de espera agotado al consultar ${url}`
            )
          );
        }
      );
    }
  );
};

/* =========================================================
   HELPERS
========================================================= */

const escapeHtml = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

const cleanText = (
  value
) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
};

const safeSlug = (
  value
) => {
  const slug =
    String(
      value ?? ""
    ).trim();

  if (
    !slug ||
    !/^[a-zA-Z0-9_-]+$/.test(
      slug
    )
  ) {
    throw new Error(
      `Slug inválido: ${slug}`
    );
  }

  return slug;
};

const normalizeList = (
  payload
) => {
  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.data?.data
    )
  ) {
    return payload.data.data;
  }

  if (
    Array.isArray(
      payload
    )
  ) {
    return payload;
  }

  return [];
};

const normalizeDetail = (
  payload
) => {
  return (
    payload?.data ??
    payload ??
    null
  );
};

const getLastPage = (
  payload
) => {
  const candidates = [
    payload?.meta
      ?.last_page,

    payload?.data?.meta
      ?.last_page,

    payload?.last_page,

    payload?.data
      ?.last_page,
  ];

  for (
    const candidate of
    candidates
  ) {
    const value =
      Number(candidate);

    if (
      Number.isFinite(
        value
      ) &&
      value > 0
    ) {
      return value;
    }
  }

  return null;
};

const jsonLd = (
  value
) => {
  if (!value) {
    return "";
  }

  /*
   * Evita que un valor dentro del JSON
   * pueda cerrar accidentalmente
   * la etiqueta <script>.
   */
  return JSON.stringify(
    value
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
};

/* =========================================================
   REMOVE EXISTING SEO FROM TEMPLATE
========================================================= */

const removeExistingSeo = (
  html
) => {
  let output = html;

  /*
   * Title base de Vite.
   */
  output = output.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
    ""
  );

  /*
   * SEO estándar.
   */
  output = output.replace(
    /<meta\b[^>]*name=["'](?:description|keywords|robots|twitter:[^"']+)["'][^>]*>\s*/gi,
    ""
  );

  /*
   * Open Graph.
   */
  output = output.replace(
    /<meta\b[^>]*property=["'](?:og:[^"']+|article:[^"']+)["'][^>]*>\s*/gi,
    ""
  );

  /*
   * Canonical.
   */
  output = output.replace(
    /<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi,
    ""
  );

  output = output.replace(
    /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>\s*/gi,
    ""
  );

  /*
   * JSON-LD previo.
   */
  output = output.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    ""
  );

  return output;
};

/* =========================================================
   BUILD META TAGS
========================================================= */

const buildMetaTags = (
  post
) => {
  const seo =
    post?.seo || {};

  const og =
    post?.open_graph || {};

  const structuredData =
    post?.structured_data ||
    null;

  const title =
    seo?.title ||
    post?.title ||
    SITE_NAME;

  const browserTitle =
    `${title} | ${SITE_NAME}`;

  const description =
    cleanText(
      seo?.description ||
        post?.excerpt ||
        ""
    );

  const canonicalUrl =
    seo?.canonical_url ||
    post?.url ||
    og?.url ||
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

  const robots =
    `${
      seo?.robots_index ===
      false
        ? "noindex"
        : "index"
    }, ${
      seo?.robots_follow ===
      false
        ? "nofollow"
        : "follow"
    }`;

  const ogTitle =
    og?.title ||
    title;

  const ogDescription =
    cleanText(
      og?.description ||
        description
    );

  const ogUrl =
    og?.url ||
    canonicalUrl;

  const ogType =
    og?.type ||
    "article";

  const image =
    typeof og?.image ===
    "string"
      ? {
          url: og.image,
        }
      : og?.image ||
        null;

  const ogImage =
    image?.url ||
    "";

  const ogImageAlt =
    image?.alt_text ||
    image?.title ||
    ogTitle;

  const lines = [
    `    <title>${escapeHtml(
      browserTitle
    )}</title>`,

    `    <meta name="description" content="${escapeHtml(
      description
    )}">`,

    `    <meta name="robots" content="${escapeHtml(
      robots
    )}">`,
  ];

  if (keywords) {
    lines.push(
      `    <meta name="keywords" content="${escapeHtml(
        keywords
      )}">`
    );
  }

  if (canonicalUrl) {
    lines.push(
      `    <link rel="canonical" href="${escapeHtml(
        canonicalUrl
      )}">`
    );
  }

  lines.push(
    "",
    "    <!-- Blog Open Graph -->",

    `    <meta property="og:type" content="${escapeHtml(
      ogType
    )}">`,

    `    <meta property="og:site_name" content="${escapeHtml(
      SITE_NAME
    )}">`,

    `    <meta property="og:locale" content="es_MX">`,

    `    <meta property="og:title" content="${escapeHtml(
      ogTitle
    )}">`,

    `    <meta property="og:description" content="${escapeHtml(
      ogDescription
    )}">`
  );

  if (ogUrl) {
    lines.push(
      `    <meta property="og:url" content="${escapeHtml(
        ogUrl
      )}">`
    );
  }

  if (ogImage) {
    lines.push(
      `    <meta property="og:image" content="${escapeHtml(
        ogImage
      )}">`,

      `    <meta property="og:image:url" content="${escapeHtml(
        ogImage
      )}">`,

      `    <meta property="og:image:secure_url" content="${escapeHtml(
        ogImage
      )}">`
    );

    if (
      image?.width
    ) {
      lines.push(
        `    <meta property="og:image:width" content="${Number(
          image.width
        )}">`
      );
    }

    if (
      image?.height
    ) {
      lines.push(
        `    <meta property="og:image:height" content="${Number(
          image.height
        )}">`
      );
    }

    if (
      ogImageAlt
    ) {
      lines.push(
        `    <meta property="og:image:alt" content="${escapeHtml(
          ogImageAlt
        )}">`
      );
    }
  }

  /*
   * Fechas Open Graph Article.
   */
  if (
    post?.published_at
  ) {
    lines.push(
      `    <meta property="article:published_time" content="${escapeHtml(
        post.published_at
      )}">`
    );
  }

  if (
    post?.updated_at
  ) {
    lines.push(
      `    <meta property="article:modified_time" content="${escapeHtml(
        post.updated_at
      )}">`
    );
  }

  /*
   * Twitter.
   */
  lines.push(
    "",
    "    <!-- Twitter Card -->",

    `    <meta name="twitter:card" content="${
      ogImage
        ? "summary_large_image"
        : "summary"
    }">`,

    `    <meta name="twitter:title" content="${escapeHtml(
      ogTitle
    )}">`,

    `    <meta name="twitter:description" content="${escapeHtml(
      ogDescription
    )}">`
  );

  if (ogImage) {
    lines.push(
      `    <meta name="twitter:image" content="${escapeHtml(
        ogImage
      )}">`
    );

    if (
      ogImageAlt
    ) {
      lines.push(
        `    <meta name="twitter:image:alt" content="${escapeHtml(
          ogImageAlt
        )}">`
      );
    }
  }

  /*
   * Schema.org.
   */
  if (
    structuredData
  ) {
    lines.push(
      "",
      "    <!-- Structured Data -->",
      '    <script type="application/ld+json">',
      `      ${jsonLd(
        structuredData
      )}`,
      "    </script>"
    );
  }

  return lines.join(
    "\n"
  );
};

/* =========================================================
   INJECT META
========================================================= */

const injectMetaTags = (
  template,
  metaTags
) => {
  const cleaned =
    removeExistingSeo(
      template
    );

  if (
    !/<\/head>/i.test(
      cleaned
    )
  ) {
    throw new Error(
      "dist/index.html no contiene </head>."
    );
  }

  return cleaned.replace(
    /<\/head>/i,
    `${metaTags}\n</head>`
  );
};

/* =========================================================
   FETCH POSTS
========================================================= */

const fetchAllPosts =
  async () => {
    const posts = [];

    let page = 1;

    while (true) {
      const url =
        `${API_BASE_URL}/${SYSTEM_SLUG}` +
        `/blogs/${BLOG_SLUG}` +
        `/posts` +
        `?per_page=${PER_PAGE}` +
        `&order=latest` +
        `&page=${page}`;

      console.log(
        `Consultando publicaciones, página ${page}...`
      );

      const payload =
        await requestJson(
          url
        );

      const current =
        normalizeList(
          payload
        );

      posts.push(
        ...current
      );

      const lastPage =
        getLastPage(
          payload
        );

      if (
        lastPage !== null
      ) {
        if (
          page >= lastPage
        ) {
          break;
        }
      } else if (
        current.length <
        PER_PAGE
      ) {
        break;
      }

      page += 1;

      if (
        page > 100
      ) {
        throw new Error(
          "Se detuvo la paginación por seguridad."
        );
      }
    }

    /*
     * Evita duplicados.
     */
    return Array.from(
      new Map(
        posts
          .filter(
            (post) =>
              post?.slug
          )
          .map(
            (post) => [
              post.slug,
              post,
            ]
          )
      ).values()
    );
  };

/* =========================================================
   FETCH DETAIL
========================================================= */

const fetchPostDetail =
  async (slug) => {
    const encodedSlug =
      encodeURIComponent(
        slug
      );

    const url =
      `${API_BASE_URL}/${SYSTEM_SLUG}` +
      `/blogs/${BLOG_SLUG}` +
      `/posts/${encodedSlug}`;

    const payload =
      await requestJson(
        url
      );

    return normalizeDetail(
      payload
    );
  };

/* =========================================================
   GENERATE FILE
========================================================= */

const generatePostHtml =
  async (
    template,
    summary
  ) => {
    const slug =
      safeSlug(
        summary.slug
      );

    console.log(
      `Generando SEO: /blogs/${slug}`
    );

    const post =
      await fetchPostDetail(
        slug
      );

    if (!post) {
      throw new Error(
        `No fue posible cargar el detalle de ${slug}`
      );
    }

    const metaTags =
      buildMetaTags(
        post
      );

    const html =
      injectMetaTags(
        template,
        metaTags
      );

    const outputDirectory =
      path.join(
        DIST_DIRECTORY,
        BLOG_ROUTE,
        slug
      );

    const outputFile =
      path.join(
        outputDirectory,
        "index.html"
      );

    await fs.mkdir(
      outputDirectory,
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      outputFile,
      html,
      "utf8"
    );

    console.log(
      `OK: ${path.relative(
        process.cwd(),
        outputFile
      )}`
    );
  };

/* =========================================================
   MAIN
========================================================= */

const main =
  async () => {
    console.log(
      ""
    );

    console.log(
      "============================================"
    );

    console.log(
      " Mi Tienda en Línea MX - Blog SEO Generator"
    );

    console.log(
      "============================================"
    );

    console.log(
      ""
    );

    /*
     * Comprobar build Vite.
     */
    try {
      await fs.access(
        DIST_INDEX
      );
    } catch {
      throw new Error(
        "No existe dist/index.html. Ejecuta primero: npm run build"
      );
    }

    const template =
      await fs.readFile(
        DIST_INDEX,
        "utf8"
      );

    const posts =
      await fetchAllPosts();

    if (
      posts.length === 0
    ) {
      console.log(
        "No existen publicaciones públicas. No se generaron archivos."
      );

      return;
    }

    console.log(
      ""
    );

    console.log(
      `Publicaciones encontradas: ${posts.length}`
    );

    console.log(
      ""
    );

    /*
     * Se generan secuencialmente para no
     * saturar la API pública.
     */
    let generated = 0;

    for (
      const post of posts
    ) {
      await generatePostHtml(
        template,
        post
      );

      generated += 1;
    }

    console.log(
      ""
    );

    console.log(
      "============================================"
    );

    console.log(
      ` Generación terminada: ${generated} publicación(es)`
    );

    console.log(
      "============================================"
    );

    console.log(
      ""
    );
  };

/* =========================================================
   RUN
========================================================= */

main().catch(
  (error) => {
    console.error(
      ""
    );

    console.error(
      "ERROR AL GENERAR SEO DE BLOGS"
    );

    console.error(
      error?.message ||
        error
    );

    console.error(
      ""
    );

    process.exitCode = 1;
  }
);