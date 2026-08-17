import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import "../styles/BlogDetail.css";

const API_BASE_URL =
  "https://api.tecnologiasadministrativas.com/api/public/v1";

const SYSTEM_SLUG =
  "mi-tienda-en-linea-mx";

const BLOG_SLUG =
  "blog-mi-tienda";

/* =========================================================
   HELPERS
========================================================= */

const normalizePost = (payload) => {
  return payload?.data ?? payload ?? null;
};

const normalizePosts = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.data?.data
    )
  ) {
    return payload.data.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const cleanText = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
};

const getCoverUrl = (post) => {
  if (!post) {
    return "";
  }

  if (
    typeof post.cover ===
    "string"
  ) {
    return post.cover;
  }

  return (
    post?.cover?.url ||
    post?.cover?.file_url ||
    post?.cover?.path ||
    post?.cover_url ||
    post?.image_url ||
    post?.image ||
    ""
  );
};

const getCoverAlt = (post) => {
  return (
    post?.cover?.alt_text ||
    post?.cover?.alt ||
    post?.title ||
    "Publicación de Mi Tienda en Línea"
  );
};

const getCategoryName = (
  post
) => {
  return (
    post?.category?.name ||
    post?.category_name ||
    ""
  );
};

const getAuthorName = (post) => {
  return (
    post?.author?.name ||
    post?.author_name ||
    "Mi Tienda en Línea MX"
  );
};

const getAdImageUrl = (
  image
) => {
  if (!image) {
    return "";
  }

  if (
    typeof image === "string"
  ) {
    return image;
  }

  return (
    image?.url ||
    image?.file_url ||
    image?.path ||
    image?.media?.url ||
    image?.media?.file_url ||
    image?.media?.path ||
    ""
  );
};

const getAdImageAlt = (
  image,
  ad
) => {
  return (
    image?.alt_text ||
    image?.alt ||
    image?.media?.alt_text ||
    ad?.title ||
    "Anuncio"
  );
};

/* =========================================================
   AD CARD
========================================================= */

const BlogAdCard = ({ ad }) => {
  const images = useMemo(
    () =>
      Array.isArray(ad?.images)
        ? ad.images.filter((image) =>
            Boolean(getAdImageUrl(image))
          )
        : [],
    [ad]
  );

  const [activeImage, setActiveImage] =
    useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [ad?.id]);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setActiveImage((current) =>
        current >= images.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [images.length]);

  return (
    <article className="blog-detail-ad">
      <div className="blog-detail-ad__label">
        <span />
        Anuncio
      </div>

      {images.length > 0 ? (
        <div className="blog-detail-ad__media">
          {images.map((image, index) => (
            <img
              key={
                image?.id ||
                `${ad?.id}-image-${index}`
              }
              src={getAdImageUrl(image)}
              alt={getAdImageAlt(image, ad)}
              className={[
                "blog-detail-ad__slide",
                index === activeImage
                  ? "blog-detail-ad__slide--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      ) : (
        <div className="blog-detail-ad__placeholder">
          <div className="blog-detail-ad__placeholder-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M6 8h12l-1 11H7L6 8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              <path
                d="M9 8V6a3 3 0 0 1 6 0v2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span>
            Mi Tienda en Línea
          </span>
        </div>
      )}

      <div className="blog-detail-ad__content">
        {ad?.title && (
          <h3>{ad.title}</h3>
        )}

        {ad?.description && (
          <p>
            {cleanText(
              ad.description
            )}
          </p>
        )}

        {ad?.link_url && (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-detail-ad__button"
          >
            <span>
              {ad?.link_text ||
                "Conocer más"}
            </span>

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M7 17 17 7M9 7h8v8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>

      {images.length > 1 && (
        <div className="blog-detail-ad__dots">
          {images.map(
            (image, index) => (
              <button
                key={
                  image?.id ||
                  `${ad?.id}-dot-${index}`
                }
                type="button"
                className={[
                  "blog-detail-ad__dot",
                  index === activeImage
                    ? "blog-detail-ad__dot--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setActiveImage(
                    index
                  )
                }
                aria-label={`Mostrar imagen ${
                  index + 1
                }`}
              />
            )
          )}
        </div>
      )}
    </article>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const BlogDetail = () => {
  const { postSlug } =
    useParams();

  const [
    post,
    setPost,
  ] = useState(null);

  const [
    recentPosts,
    setRecentPosts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     API
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    const loadPost = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          detailResponse,
          recentResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}/posts/${postSlug}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              signal:
                controller.signal,
            }
          ),

          fetch(
            `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}/posts?per_page=4&order=latest`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              signal:
                controller.signal,
            }
          ),
        ]);

        if (
          !detailResponse.ok
        ) {
          if (
            detailResponse.status ===
            404
          ) {
            throw new Error(
              "La publicación solicitada no está disponible."
            );
          }

          if (
            detailResponse.status ===
            429
          ) {
            throw new Error(
              "Se alcanzó temporalmente el límite de consultas. Intenta nuevamente en unos momentos."
            );
          }

          throw new Error(
            "No fue posible cargar la publicación."
          );
        }

        const detailJson =
          await detailResponse.json();

        const currentPost =
          normalizePost(
            detailJson
          );

        let normalizedRecent =
          [];

        if (
          recentResponse.ok
        ) {
          const recentJson =
            await recentResponse.json();

          normalizedRecent =
            normalizePosts(
              recentJson
            )
              .filter(
                (item) =>
                  item?.slug !==
                  postSlug
              )
              .slice(0, 3);
        }

        setPost(
          currentPost
        );

        setRecentPosts(
          normalizedRecent
        );
      } catch (requestError) {
        if (
          requestError?.name ===
          "AbortError"
        ) {
          return;
        }

        setError(
          requestError?.message ||
            "Ocurrió un error al cargar la publicación."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    };

    if (postSlug) {
      loadPost();
    }

    return () => {
      controller.abort();
    };
  }, [postSlug]);

  /* =======================================================
     SEO BÁSICO
  ======================================================= */

  useEffect(() => {
    if (!post) {
      return;
    }

    const previousTitle =
      document.title;

    const title =
      post?.seo_title ||
      post?.title;

    if (title) {
      document.title = `${title} | Mi Tienda en Línea MX`;
    }

    return () => {
      document.title =
        previousTitle;
    };
  }, [post]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const coverUrl =
    getCoverUrl(post);

  const categoryName =
    getCategoryName(post);

  const authorName =
    getAuthorName(post);

  const publishedDate =
    formatDate(
      post?.published_at
    );

  const ads = useMemo(() => {
    if (
      !Array.isArray(post?.ads)
    ) {
      return [];
    }

    return post.ads
      .filter(
        (ad) =>
          !ad?.status ||
          ad.status === "active"
      )
      .sort(
        (a, b) =>
          Number(
            a?.sort_order ?? 0
          ) -
          Number(
            b?.sort_order ?? 0
          )
      );
  }, [post]);

  const tags = useMemo(
    () =>
      Array.isArray(post?.tags)
        ? post.tags
        : [],
    [post]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="blog-detail-page">
        <div className="blog-detail-loading">
          <div className="blog-detail-loading__spinner" />

          <strong>
            Cargando publicación
          </strong>

          <span>
            Estamos preparando el
            contenido.
          </span>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !post) {
    return (
      <main className="blog-detail-page">
        <section className="blog-detail-error">
          <div className="blog-detail-error__icon">
            !
          </div>

          <span>
            Blog Mi Tienda
          </span>

          <h1>
            Publicación no
            disponible
          </h1>

          <p>
            {error ||
              "No fue posible encontrar esta publicación."}
          </p>

          <Link
            to="/blogs"
            className="blog-detail-error__button"
          >
            Regresar a blogs
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="blog-detail-page">
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="blog-detail-hero">
        <div
          className="blog-detail-hero__background"
          aria-hidden="true"
        >
          <div className="blog-detail-hero__grid" />

          <div className="blog-detail-hero__glow blog-detail-hero__glow--one" />

          <div className="blog-detail-hero__glow blog-detail-hero__glow--two" />

          <div className="blog-detail-hero__circle" />
        </div>

        <div className="blog-detail-hero__container">
          <Link
            to="/blogs"
            className="blog-detail-back"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M19 12H5m6-6-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>
              Regresar a blogs
            </span>
          </Link>

          <div className="blog-detail-hero__layout">
            <div className="blog-detail-hero__content">
              {categoryName && (
                <span className="blog-detail-category">
                  {categoryName}
                </span>
              )}

              <h1>
                {post.title}
              </h1>

              {post?.excerpt && (
                <p className="blog-detail-hero__excerpt">
                  {cleanText(
                    post.excerpt
                  )}
                </p>
              )}

              <div className="blog-detail-meta">
                <div className="blog-detail-meta__author">
                  <span className="blog-detail-meta__avatar">
                    {authorName
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span>
                    {authorName}
                  </span>
                </div>

                {publishedDate && (
                  <time
                    dateTime={
                      post.published_at
                    }
                  >
                    {publishedDate}
                  </time>
                )}
              </div>
            </div>

            <div className="blog-detail-hero__media">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={getCoverAlt(
                    post
                  )}
                />
              ) : (
                <div className="blog-detail-hero__placeholder">
                  <img
                    src="/assets/logoc.png"
                    alt="Mi Tienda en Línea MX"
                  />

                  <span>
                    Mi Tienda en Línea
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ARTICLE
      =================================================== */}

      <section className="blog-detail-body">
        <div className="blog-detail-body__container">
          <article className="blog-detail-article">
            {coverUrl && (
              <div className="blog-detail-article__cover">
                <img
                  src={coverUrl}
                  alt={getCoverAlt(
                    post
                  )}
                />
              </div>
            )}

            <div
              className="blog-detail-content"
              dangerouslySetInnerHTML={{
                __html:
                  post?.content || "",
              }}
            />

            {tags.length > 0 && (
              <footer className="blog-detail-tags">
                <span className="blog-detail-tags__title">
                  Etiquetas
                </span>

                <div className="blog-detail-tags__list">
                  {tags.map(
                    (tag) => (
                      <span
                        key={
                          tag?.id ||
                          tag?.slug ||
                          tag?.name
                        }
                      >
                        #
                        {tag?.name ||
                          tag?.slug}
                      </span>
                    )
                  )}
                </div>
              </footer>
            )}
          </article>

          {/* ===============================================
              SIDEBAR
          =============================================== */}

          <aside className="blog-detail-sidebar">
            {/* =============================================
                ADS
            ============================================= */}

            {ads.map((ad) => (
              <BlogAdCard
                key={ad?.id}
                ad={ad}
              />
            ))}

            {/* =============================================
                RECENT POSTS
            ============================================= */}

            {recentPosts.length >
              0 && (
              <section className="blog-detail-recent">
                <div className="blog-detail-recent__heading">
                  <span />

                  <h2>
                    Publicaciones
                    recientes
                  </h2>
                </div>

                <div className="blog-detail-recent__list">
                  {recentPosts.map(
                    (
                      recentPost
                    ) => {
                      const image =
                        getCoverUrl(
                          recentPost
                        );

                      return (
                        <Link
                          key={
                            recentPost?.id ||
                            recentPost?.slug
                          }
                          to={`/blogs/${recentPost.slug}`}
                          className="blog-detail-recent__item"
                        >
                          <div className="blog-detail-recent__image">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={getCoverAlt(
                                  recentPost
                                )}
                              />
                            ) : (
                              <div className="blog-detail-recent__placeholder">
                                M
                              </div>
                            )}
                          </div>

                          <div className="blog-detail-recent__content">
                            <h3>
                              {
                                recentPost.title
                              }
                            </h3>

                            {recentPost?.published_at && (
                              <time
                                dateTime={
                                  recentPost.published_at
                                }
                              >
                                {formatDate(
                                  recentPost.published_at
                                )}
                              </time>
                            )}
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default BlogDetail;