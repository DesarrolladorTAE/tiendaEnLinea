import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useScrollReveal from "../hooks/useScrollReveal";
import "../styles/Plans.css";

const API_URL = "https://mitiendaenlineamx.com.mx/api";

const DURACIONES = {
  monthly: {
    label: "Mensual",
    shortLabel: "Mensual",
    description: "Plan mensual",
  },

  semiannual: {
    label: "Semestral",
    shortLabel: "6 meses",
    description: "Plan semestral",
  },

  annual: {
    label: "Anual",
    shortLabel: "12 meses",
    description: "Plan anual",
  },
};

const formatMoney = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "$0";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const Plans = () => {
  const [planes, setPlanes] = useState([]);
  const [activeTab, setActiveTab] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useScrollReveal();

  /*
  |--------------------------------------------------------------------------
  | Navbar transparente mientras estamos en esta página
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.body.classList.add("plans-page-active");

    return () => {
      document.body.classList.remove(
        "plans-page-active"
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Obtener planes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/public/plans`
        );

        const data =
          response?.data?.data ?? [];

        console.log("PLANES API:", data);

        setPlanes(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar los planes:",
          error
        );

        setError(
          "No fue posible cargar los planes en este momento."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Omitimos completamente el plan demo ID 1
  |--------------------------------------------------------------------------
  */

  const planesFiltrados = useMemo(() => {
    return [...planes]
      .filter((plan) => Number(plan.id) !== 1)
      .sort(
        (a, b) =>
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
      );
  }, [planes]);

  /*
  |--------------------------------------------------------------------------
  | Precio
  |--------------------------------------------------------------------------
  */

  const getPrice = (plan) => {
    if (!plan?.prices) {
      return null;
    }

    return plan.prices[activeTab] ?? null;
  };

  /*
  |--------------------------------------------------------------------------
  | Iconos características
  |--------------------------------------------------------------------------
  */

  const renderFeatureIcon = (status) => {
    switch (status) {
      case "included":
      case "limited":
        return (
          <span className="plan-feature-status plan-feature-status-success">
            <i className="bi bi-check-lg" />
          </span>
        );

      case "optional":
        return (
          <span className="plan-feature-status plan-feature-status-optional">
            <i className="bi bi-plus-lg" />
          </span>
        );

      case "not_included":
      default:
        return (
          <span className="plan-feature-status plan-feature-status-disabled">
            <i className="bi bi-x-lg" />
          </span>
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Texto extra
  |--------------------------------------------------------------------------
  */

  const getFeatureExtra = (feature) => {
    if (!feature) {
      return null;
    }

    if (feature.label) {
      return feature.label;
    }

    if (
      feature.status === "limited" &&
      feature.value
    ) {
      if (
        feature.value === "unlimited" ||
        feature.value === "-1"
      ) {
        return "Ilimitado";
      }

      return feature.value;
    }

    if (feature.status === "optional") {
      return "Opcional";
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | WhatsApp
  |--------------------------------------------------------------------------
  */

  const getWhatsAppUrl = (
    plan,
    price
  ) => {
    const planName =
      plan.display_name ||
      plan.name ||
      "Plan";

    const period =
      DURACIONES[activeTab]?.label ||
      activeTab;

    const priceText = price
      ? formatMoney(price.price)
      : "Consultar";

    const message = [
      "Hola, estoy interesado en uno de sus planes.",
      "",
      `Plan: ${planName}`,
      `Periodo: ${period}`,
      `Precio: ${priceText}`,
    ].join("\n");

    return `https://wa.me/527442188925?text=${encodeURIComponent(
      message
    )}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Scroll hacia los planes
  |--------------------------------------------------------------------------
  */

  const goToPlans = () => {
    document
      .getElementById("planes-listado")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <main className="plans-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="plans-hero">
        <div className="plans-hero__background">
          <div className="plans-hero__grid" />

          <div className="plans-hero__glow plans-hero__glow--one" />

          <div className="plans-hero__glow plans-hero__glow--two" />
        </div>

        <div className="plans-hero__container">

          <div className="plans-hero__content">

            <div className="plans-hero__eyebrow">
              <span className="plans-hero__eyebrow-dot" />

              Planes flexibles para tu negocio
            </div>

            <h1 className="plans-hero__title">
              Un plan para cada etapa de
              <span> tu negocio.</span>
            </h1>

            <p className="plans-hero__description">
              Elige las herramientas que necesitas hoy
              y escala cuando tu negocio lo requiera.
              Todos nuestros planes están diseñados
              para ayudarte a vender, administrar y
              crecer desde una sola plataforma.
            </p>

            <div className="plans-hero__actions">
              <button
                type="button"
                className="plans-hero__button plans-hero__button--primary"
                onClick={goToPlans}
              >
                Ver planes

                <i className="bi bi-arrow-down" />
              </button>

              <a
                href="https://wa.me/527442188925"
                target="_blank"
                rel="noopener noreferrer"
                className="plans-hero__button plans-hero__button--secondary"
              >
                <i className="bi bi-whatsapp" />

                Hablar con nosotros
              </a>
            </div>

            <ul className="plans-hero__benefits">
              <li>
                <span>
                  <i className="bi bi-check-lg" />
                </span>

                Sin costos ocultos
              </li>

              <li>
                <span>
                  <i className="bi bi-check-lg" />
                </span>

                Planes escalables
              </li>

              <li>
                <span>
                  <i className="bi bi-check-lg" />
                </span>

                Soporte especializado
              </li>
            </ul>

          </div>

          {/* VISUAL */}

          <div className="plans-hero__visual">

            <div className="plans-hero-card plans-hero-card--main">

              <div className="plans-hero-card__icon">
                <i className="bi bi-stars" />
              </div>

              <span>Planes diseñados para crecer</span>

              <strong>
                Todo lo que tu negocio necesita
              </strong>

              <p>
                Administra ventas, inventarios,
                clientes, facturación y mucho más
                desde una misma plataforma.
              </p>

              <div className="plans-hero-card__modules">

                <div>
                  <i className="bi bi-bag-check" />
                  <span>Ventas</span>
                </div>

                <div>
                  <i className="bi bi-box-seam" />
                  <span>Inventario</span>
                </div>

                <div>
                  <i className="bi bi-people" />
                  <span>Clientes</span>
                </div>

                <div>
                  <i className="bi bi-receipt" />
                  <span>Facturación</span>
                </div>

              </div>

            </div>

            <div className="plans-hero-floating plans-hero-floating--one">
              <i className="bi bi-check-circle-fill" />

              <div>
                <small>Flexible</small>
                <strong>Crece a tu ritmo</strong>
              </div>
            </div>

            <div className="plans-hero-floating plans-hero-floating--two">
              <i className="bi bi-lightning-charge-fill" />

              <div>
                <small>Todo incluido</small>
                <strong>Listo para usar</strong>
              </div>
            </div>

          </div>

        </div>

        <button
          type="button"
          className="plans-hero__scroll"
          onClick={goToPlans}
          aria-label="Ver planes"
        >
          <span />
        </button>
      </section>


      {/* =====================================================
          PLANES
      ===================================================== */}

      <section
        className="plans-section"
        id="planes-listado"
      >
        <div className="container">

          <div className="plans-header">

            <span className="plans-header-badge">
              <i className="bi bi-stars" />

              Elige tu plan
            </span>

            <h2>
              Planes pensados para crecer contigo
            </h2>

            <p>
              Compara las opciones disponibles y
              selecciona el periodo que mejor se
              adapte a las necesidades de tu negocio.
            </p>

          </div>

          {/* =================================================
              PERIODOS
          ================================================= */}

          <div className="plans-tabs-wrapper">
            <div
              className="plans-tabs"
              role="tablist"
            >
              {Object.entries(
                DURACIONES
              ).map(
                ([key, duration]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={
                      activeTab === key
                    }
                    className={`plans-tab ${
                      activeTab === key
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveTab(key)
                    }
                  >
                    {duration.label}
                  </button>
                )
              )}
            </div>
          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="plans-state">
              <div className="plans-loader" />

              <strong>
                Cargando planes
              </strong>

              <span>
                Estamos preparando las opciones
                disponibles para ti.
              </span>
            </div>
          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="plans-state plans-state--error">
              <i className="bi bi-exclamation-circle" />

              <strong>
                No pudimos cargar los planes
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}


          {/* =================================================
              CARDS
          ================================================= */}

          {!loading &&
            !error &&
            planesFiltrados.length > 0 && (
              <div className="plans-grid">

                {planesFiltrados.map(
                  (plan) => {
                    const price =
                      getPrice(plan);

                    const planName =
                      plan.display_name ||
                      plan.name;

                    const featured =
                      Boolean(
                        plan.is_featured
                      );

                    return (
                      <article
                        key={plan.id}
                        className={`plan-card ${
                          featured
                            ? "plan-card-featured"
                            : ""
                        }`}
                      >

                        {/* RECOMENDADO */}

                        {featured && (
                          <div className="plan-recommended">
                            <i className="bi bi-stars" />

                            Recomendado
                          </div>
                        )}


                        {/* HEADER CARD */}

                        <div className="plan-card__header">

                          {plan.badge && (
                            <span className="plan-card__badge">
                              {plan.badge}
                            </span>
                          )}

                          <div className="plan-card__identity">

                            {plan.icon && (
                              <div className="plan-icon">
                                <i
                                  className={
                                    plan.icon.startsWith(
                                      "bi "
                                    )
                                      ? plan.icon
                                      : `bi ${plan.icon}`
                                  }
                                />
                              </div>
                            )}

                            <div>
                              <h3>
                                {planName}
                              </h3>

                              {plan.subtitle && (
                                <p>
                                  {
                                    plan.subtitle
                                  }
                                </p>
                              )}
                            </div>

                          </div>

                          {plan.description && (
                            <p className="plan-card__description">
                              {plan.description}
                            </p>
                          )}


                          {/* PRECIO */}

                          <div className="plan-price">

                            {price ? (
                              <>
                                {price.regular_price &&
                                  Number(
                                    price.regular_price
                                  ) >
                                    Number(
                                      price.price
                                    ) && (
                                    <span className="plan-price__regular">
                                      {formatMoney(
                                        price.regular_price
                                      )}
                                    </span>
                                  )}

                                <div className="plan-price__main">

                                  <strong>
                                    {formatMoney(
                                      price.price
                                    )}
                                  </strong>

                                  <span>
                                    MXN
                                  </span>

                                </div>

                                <p>
                                  {price.label ||
                                    DURACIONES[
                                      activeTab
                                    ]
                                      ?.description}
                                </p>

                                {price.saving_label && (
                                  <div className="plan-price__saving">
                                    <i className="bi bi-tag-fill" />

                                    {
                                      price.saving_label
                                    }
                                  </div>
                                )}

                                {price.paid_months &&
                                  Number(
                                    price.months
                                  ) >
                                    Number(
                                      price.paid_months
                                    ) && (
                                    <div className="plan-price__promotion">
                                      <i className="bi bi-gift-fill" />

                                      Pagas{" "}
                                      {
                                        price.paid_months
                                      }{" "}
                                      y recibes{" "}
                                      {
                                        price.months
                                      }{" "}
                                      meses
                                    </div>
                                  )}
                              </>
                            ) : (
                              <div className="plan-price__unavailable">
                                <strong>
                                  Consultar
                                </strong>

                                <span>
                                  Este periodo no
                                  está disponible.
                                </span>
                              </div>
                            )}

                          </div>

                          {Number(
                            plan.trial_days
                          ) > 0 && (
                            <div className="plan-trial">
                              <i className="bi bi-lightning-charge-fill" />

                              {
                                plan.trial_days
                              }{" "}
                              días de prueba
                            </div>
                          )}

                        </div>


                        {/* =============================================
                            CATEGORÍAS / ACORDEÓN
                        ============================================= */}

                        <div className="plan-card__features">

                          <div className="plan-card__features-title">
                            <span>
                              Características
                            </span>

                            <small>
                              Toca una sección
                              para ver los detalles
                            </small>
                          </div>

                          <div className="plan-categories">

                            {plan.categories?.map(
                              (category) => {

                                const includedCount =
                                  category.features?.filter(
                                    (feature) =>
                                      feature.status ===
                                        "included" ||
                                      feature.status ===
                                        "limited"
                                  ).length ?? 0;

                                const total =
                                  category.features
                                    ?.length ?? 0;

                                return (
                                  <details
                                    key={
                                      category.id
                                    }
                                    className="plan-category"
                                  >

                                    <summary className="plan-category__summary">

                                      <div className="plan-category__identity">

                                        <div className="plan-category__icon">
                                          {category.icon ? (
                                            <i
                                              className={
                                                category.icon
                                              }
                                            />
                                          ) : (
                                            <i className="bi bi-grid" />
                                          )}
                                        </div>

                                        <div>
                                          <strong>
                                            {
                                              category.name
                                            }
                                          </strong>

                                          <span>
                                            {
                                              includedCount
                                            }{" "}
                                            de {total}{" "}
                                            incluidas
                                          </span>
                                        </div>

                                      </div>

                                      <span className="plan-category__arrow">
                                        <i className="bi bi-chevron-down" />
                                      </span>

                                    </summary>


                                    <div className="plan-category__content">

                                      {category.features?.map(
                                        (
                                          feature
                                        ) => {

                                          const extra =
                                            getFeatureExtra(
                                              feature
                                            );

                                          const disabled =
                                            feature.status ===
                                            "not_included";

                                          return (
                                            <div
                                              key={
                                                feature.id
                                              }
                                              className={`plan-feature ${
                                                disabled
                                                  ? "plan-feature--disabled"
                                                  : ""
                                              }`}
                                            >

                                              {renderFeatureIcon(
                                                feature.status
                                              )}

                                              <div className="plan-feature__content">

                                                <div className="plan-feature__row">
                                                  <span>
                                                    {
                                                      feature.name
                                                    }
                                                  </span>

                                                  {extra && (
                                                    <strong>
                                                      {
                                                        extra
                                                      }
                                                    </strong>
                                                  )}
                                                </div>

                                                {feature.note &&
                                                  !disabled && (
                                                    <small>
                                                      {
                                                        feature.note
                                                      }
                                                    </small>
                                                  )}

                                              </div>

                                            </div>
                                          );
                                        }
                                      )}

                                    </div>

                                  </details>
                                );
                              }
                            )}

                          </div>
                        </div>


                        {/* =============================================
                            COMPLEMENTOS
                        ============================================= */}

                        {plan.addons?.length >
                          0 && (
                          <div className="plan-addons">

                            <div className="plan-addons__title">
                              <i className="bi bi-puzzle-fill" />

                              <span>
                                Complementos
                              </span>
                            </div>

                            <div className="plan-addons__list">

                              {plan.addons.map(
                                (addon) => (
                                  <div
                                    key={
                                      addon.id
                                    }
                                    className="plan-addon"
                                  >

                                    <span
                                      className={`plan-feature-status ${
                                        addon.status ===
                                        "included"
                                          ? "plan-feature-status-success"
                                          : "plan-feature-status-optional"
                                      }`}
                                    >
                                      <i
                                        className={
                                          addon.status ===
                                          "included"
                                            ? "bi bi-check-lg"
                                            : "bi bi-plus-lg"
                                        }
                                      />
                                    </span>

                                    <div>
                                      <span>
                                        {
                                          addon.name
                                        }
                                      </span>

                                      {addon.status ===
                                      "included" ? (
                                        <strong>
                                          Incluido
                                        </strong>
                                      ) : addon.price !==
                                        null ? (
                                        <strong>
                                          +
                                          {formatMoney(
                                            addon.price
                                          )}
                                        </strong>
                                      ) : (
                                        <strong>
                                          Disponible
                                        </strong>
                                      )}
                                    </div>

                                  </div>
                                )
                              )}

                            </div>

                          </div>
                        )}


                        {/* CTA */}

                        <div className="plan-card__footer">

                          <a
                            href={
                              plan.button_url ||
                              getWhatsAppUrl(
                                plan,
                                price
                              )
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`plan-card__button ${
                              featured
                                ? "plan-card__button--featured"
                                : ""
                            }`}
                          >
                            {plan.button_url ? (
                              <i className="bi bi-arrow-right" />
                            ) : (
                              <i className="bi bi-whatsapp" />
                            )}

                            {plan.button_text ||
                              "Más información"}
                          </a>

                          <span className="plan-card__footer-note">
                            <i className="bi bi-shield-check" />

                            Sin cargos ocultos
                          </span>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </div>
      </section>

    </main>
  );
};

export default Plans;