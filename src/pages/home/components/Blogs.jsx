import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "../styles/Blogs.css";

const API_BASE_URL =
  "https://api.tecnologiasadministrativas.com/api/public/v1";

const SYSTEM_SLUG = "mi-tienda-en-linea-mx";
const BLOG_SLUG = "blog-mi-tienda";

const POSTS_PER_PAGE = 12;

/* =========================================================
   HELPERS
========================================================= */

const normalizePosts = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const normalizeBlog = (payload) => {
  return payload?.data ?? payload ?? null;
};

const getMeta = (payload) => {
  return (
    payload?.meta ??
    payload?.data?.meta ??
    {}
  );
};

const getCoverUrl = (post) => {
  if (!post) {
    return "";
  }

  if (typeof post.cover === "string") {
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

const getCategoryName = (post) => {
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
    ""
  );
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

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

/* =========================================================
   COMPONENT
========================================================= */

const Blogs = () => {
  const [blog, setBlog] = useState(null);
  const [posts, setPosts] = useState([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [activeSearch, setActiveSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      lastPage: 1,
      total: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     API
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    const loadBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "per_page",
          String(POSTS_PER_PAGE)
        );

        params.set(
          "order",
          "latest"
        );

        params.set(
          "page",
          String(page)
        );

        if (activeSearch) {
          params.set(
            "search",
            activeSearch
          );
        }

        const [
          blogResponse,
          postsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}`,
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
            `${API_BASE_URL}/${SYSTEM_SLUG}/blogs/${BLOG_SLUG}/posts?${params.toString()}`,
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

        if (!blogResponse.ok) {
          if (
            blogResponse.status ===
            404
          ) {
            throw new Error(
              "El blog de Mi Tienda no está disponible."
            );
          }

          if (
            blogResponse.status ===
            429
          ) {
            throw new Error(
              "Se alcanzó temporalmente el límite de consultas. Intenta nuevamente en unos momentos."
            );
          }

          throw new Error(
            "No fue posible cargar la información del blog."
          );
        }

        if (!postsResponse.ok) {
          if (
            postsResponse.status ===
            429
          ) {
            throw new Error(
              "Se alcanzó temporalmente el límite de consultas. Intenta nuevamente en unos momentos."
            );
          }

          throw new Error(
            "No fue posible cargar las publicaciones."
          );
        }

        const blogJson =
          await blogResponse.json();

        const postsJson =
          await postsResponse.json();

        const normalizedPosts =
          normalizePosts(postsJson);

        const meta =
          getMeta(postsJson);

        setBlog(
          normalizeBlog(blogJson)
        );

        setPosts(
          normalizedPosts
        );

        setPagination({
          currentPage:
            Number(
              meta?.current_page ??
                page
            ) || 1,

          lastPage:
            Number(
              meta?.last_page ??
                1
            ) || 1,

          total:
            Number(
              meta?.total ??
                normalizedPosts.length
            ) || 0,
        });
      } catch (requestError) {
        if (
          requestError?.name ===
          "AbortError"
        ) {
          return;
        }

        setError(
          requestError?.message ||
            "Ocurrió un error al cargar el blog."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    };

    loadBlog();

    return () => {
      controller.abort();
    };
  }, [activeSearch, page]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);

    setActiveSearch(
      searchInput.trim()
    );
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const totalLabel = useMemo(() => {
    const total =
      pagination.total;

    if (total === 1) {
      return "1 publicación";
    }

    return `${total} publicaciones`;
  }, [pagination.total]);

  const heroDescription =
    blog?.description ||
    "Consejos, ideas y herramientas para vender por internet, administrar tu negocio y aprovechar mejor tu tienda en línea.";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="blogs-page">
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="blogs-hero">
        <div
          className="blogs-hero__background"
          aria-hidden="true"
        >
          <div className="blogs-hero__grid" />

          <div className="blogs-hero__glow blogs-hero__glow--one" />

          <div className="blogs-hero__glow blogs-hero__glow--two" />

          <div className="blogs-hero__shape blogs-hero__shape--one" />

          <div className="blogs-hero__shape blogs-hero__shape--two" />
        </div>

        <div className="blogs-hero__container">
          <div className="blogs-hero__content">
           <div className="blogs-hero__eyebrow">
     <span className="blogs-hero__eyebrow-dot" />

       <span>
       Blogs Mi Tienda
       </span>

            </div>

            <h1 className="blogs-hero__title">
              Ideas para vender más
              <span>
                {" "}
                y hacer crecer tu negocio
              </span>
            </h1>

            <p className="blogs-hero__description">
              {heroDescription}
            </p>

            <form
              className="blogs-search"
              onSubmit={handleSearch}
            >
              <div className="blogs-search__field">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="blogs-search__icon"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="m20 20-3.5-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  placeholder="Buscar artículos, consejos o estrategias"
                  aria-label="Buscar publicaciones"
                />

                {searchInput && (
                  <button
                    type="button"
                    className="blogs-search__clear"
                    onClick={
                      handleClearSearch
                    }
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="blogs-search__button"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="m20 20-3.5-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <span>Buscar</span>
              </button>
            </form>

            {activeSearch && (
              <div className="blogs-search-result">
                <span>
                  Resultados para:
                  <strong>
                    {" "}
                    “{activeSearch}”
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={
                    handleClearSearch
                  }
                >
                  Mostrar todas
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          POSTS
      =================================================== */}

      <section className="blogs-posts">
        <div className="blogs-posts__container">
          <header className="blogs-posts__header">
            <div>
              <span className="blogs-posts__eyebrow">
                Contenido para tu negocio
              </span>

              <h2>
                Últimas publicaciones
              </h2>
            </div>

            {!loading &&
              !error && (
                <span className="blogs-posts__count">
                  {totalLabel}
                </span>
              )}
          </header>

          {/* ===============================================
              LOADING
          =============================================== */}

          {loading && (
            <div className="blogs-loading">
              <div className="blogs-loading__spinner" />

              <strong>
                Cargando publicaciones
              </strong>

              <span>
                Estamos preparando el
                contenido para ti.
              </span>
            </div>
          )}

          {/* ===============================================
              ERROR
          =============================================== */}

          {!loading &&
            error && (
              <div className="blogs-state">
                <div className="blogs-state__icon">
                  !
                </div>

                <span className="blogs-state__label">
                  Blog
                </span>

                <h3>
                  No pudimos cargar las
                  publicaciones
                </h3>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

          {/* ===============================================
              EMPTY
          =============================================== */}

          {!loading &&
            !error &&
            posts.length === 0 && (
              <div className="blogs-state">
                <div className="blogs-state__icon blogs-state__icon--search">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                    <path
                      d="m20 20-3.5-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <span className="blogs-state__label">
                  Sin resultados
                </span>

                <h3>
                  No encontramos
                  publicaciones
                </h3>

                <p>
                  {activeSearch
                    ? `No hay publicaciones que coincidan con “${activeSearch}”.`
                    : "Todavía no hay publicaciones disponibles en el blog."}
                </p>

                {activeSearch && (
                  <button
                    type="button"
                    onClick={
                      handleClearSearch
                    }
                  >
                    Ver todas las
                    publicaciones
                  </button>
                )}
              </div>
            )}

          {/* ===============================================
              GRID
          =============================================== */}

          {!loading &&
            !error &&
            posts.length > 0 && (
              <>
                <div className="blogs-grid">
                  {posts.map(
                    (post) => {
                      const coverUrl =
                        getCoverUrl(
                          post
                        );

                      const categoryName =
                        getCategoryName(
                          post
                        );

                      const authorName =
                        getAuthorName(
                          post
                        );

                      const date =
                        formatDate(
                          post?.published_at
                        );

                      return (
                        <article
                          key={
                            post?.id ||
                            post?.slug
                          }
                          className="blog-card"
                        >
                          <Link
                            to={`/blogs/${post.slug}`}
                            className="blog-card__image"
                            aria-label={`Leer ${post.title}`}
                          >
                            {coverUrl ? (
                              <img
                                src={
                                  coverUrl
                                }
                                alt={getCoverAlt(
                                  post
                                )}
                                loading="lazy"
                              />
                            ) : (
                              <div className="blog-card__placeholder">
                                <img
                                  src="/assets/logoc.png"
                                  alt=""
                                  aria-hidden="true"
                                />

                                <span>
                                  Mi Tienda
                                  en Línea
                                </span>
                              </div>
                            )}

                            <span className="blog-card__image-overlay" />
                          </Link>

                          <div className="blog-card__body">
                            <div className="blog-card__meta">
                              {categoryName && (
                                <span className="blog-card__category">
                                  {
                                    categoryName
                                  }
                                </span>
                              )}

                              {date && (
                                <time
                                  dateTime={
                                    post.published_at
                                  }
                                >
                                  {date}
                                </time>
                              )}
                            </div>

                            <h3>
                              <Link
                                to={`/blogs/${post.slug}`}
                              >
                                {
                                  post.title
                                }
                              </Link>
                            </h3>

                            {post?.excerpt && (
                              <p className="blog-card__excerpt">
                                {cleanText(
                                  post.excerpt
                                )}
                              </p>
                            )}

                            <footer className="blog-card__footer">
                              {authorName ? (
                                <span className="blog-card__author">
                                  Por{" "}
                                  {
                                    authorName
                                  }
                                </span>
                              ) : (
                                <span />
                              )}

                              <Link
                                to={`/blogs/${post.slug}`}
                                className="blog-card__link"
                              >
                                <span>
                                  Leer
                                  artículo
                                </span>

                                <svg
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M5 12h14M13 6l6 6-6 6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Link>
                            </footer>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                {/* =========================================
                    PAGINATION
                ========================================= */}

                {pagination.lastPage >
                  1 && (
                  <div className="blogs-pagination">
                    <button
                      type="button"
                      disabled={
                        pagination.currentPage <=
                        1
                      }
                      onClick={() =>
                        setPage(
                          Math.max(
                            1,
                            pagination.currentPage -
                              1
                          )
                        )
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M19 12H5m6 6-6-6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      Anterior
                    </button>

                    <span>
                      Página{" "}
                      <strong>
                        {
                          pagination.currentPage
                        }
                      </strong>{" "}
                      de{" "}
                      <strong>
                        {
                          pagination.lastPage
                        }
                      </strong>
                    </span>

                    <button
                      type="button"
                      disabled={
                        pagination.currentPage >=
                        pagination.lastPage
                      }
                      onClick={() =>
                        setPage(
                          Math.min(
                            pagination.lastPage,
                            pagination.currentPage +
                              1
                          )
                        )
                      }
                    >
                      Siguiente

                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      </section>
    </main>
  );
};

export default Blogs;