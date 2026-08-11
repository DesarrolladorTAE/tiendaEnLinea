import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useScrollReveal from "../hooks/useScrollReveal";

import { appDownloadService } from "../../../services/public/appDownloadService";

import "../styles/AppDownloads.css";

const APP_SLUG = "mitienda-pos";

const platformConfig = {
  windows: {
    name: "Windows",
    icon: "bi-windows",
    eyebrow: "Aplicación de escritorio",
    title: "Trabaja desde tu computadora",
    description:
      "Instala la aplicación en equipos Windows para complementar la operación de tu punto de venta y trabajar desde una estación dedicada.",
    benefits: [
      "Ideal para punto de venta",
      "Compatible con impresión",
      "Instalación en computadora",
    ],
  },

  android: {
    name: "Android",
    icon: "bi-android2",
    eyebrow: "Aplicación móvil",
    title: "Lleva tu operación contigo",
    description:
      "Descarga la aplicación para dispositivos Android y accede a herramientas de operación desde equipos móviles compatibles.",
    benefits: [
      "Instalación en Android",
      "Operación desde dispositivos móviles",
      "Actualizaciones disponibles",
    ],
  },
};

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes);

  if (!numericBytes || numericBytes <= 0) {
    return null;
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(numericBytes) / Math.log(1024)),
    units.length - 1
  );

  const value =
    numericBytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const AppDownloads = () => {
  useScrollReveal();

  const [apps, setApps] = useState({
    windows: null,
    android: null,
  });

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({
    windows: false,
    android: false,
  });

  const loadLatestApps = useCallback(async () => {
    setLoading(true);

    const platforms = [
      "windows",
      "android",
    ];

    const results = await Promise.allSettled(
      platforms.map((platform) =>
        appDownloadService.getLatest({
          app_slug: APP_SLUG,
          platform,
        })
      )
    );

    const nextApps = {
      windows: null,
      android: null,
    };

    const nextErrors = {
      windows: false,
      android: false,
    };

    results.forEach((result, index) => {
      const platform = platforms[index];

      if (result.status === "fulfilled") {
        nextApps[platform] =
          result.value?.data?.data ?? null;
      } else {
        nextErrors[platform] = true;
      }
    });

    setApps(nextApps);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLatestApps();
  }, [loadLatestApps]);

  const availableCount = useMemo(
    () =>
      Object.values(apps).filter(Boolean)
        .length,
    [apps]
  );

  const handleDownload = (app) => {
    if (!app?.download_url) {
      return;
    }

    window.location.href = app.download_url;
  };

  return (
    <section
      className="app-downloads"
      aria-labelledby="app-downloads-title"
    >
      <div
        className="app-downloads__background"
        aria-hidden="true"
      >
        <span className="app-downloads__grid" />

        <span className="app-downloads__glow app-downloads__glow--one" />

        <span className="app-downloads__glow app-downloads__glow--two" />
      </div>

      <div className="app-downloads__container">
        <header className="app-downloads__header animate-on-scroll">
          <span className="app-downloads__eyebrow">
            <i
              className="bi bi-cloud-arrow-down-fill"
              aria-hidden="true"
            />
            Aplicaciones disponibles
          </span>

          <h2 id="app-downloads-title">
            Tu negocio también puede
            <span> acompañarte fuera del navegador</span>
          </h2>

          <p>
            Utiliza Mi Tienda en Línea MX desde
            la web y complementa tu operación
            instalando nuestras aplicaciones para
            Windows y Android.
          </p>
        </header>

        <div className="app-downloads__access animate-on-scroll">
          <div className="app-downloads__access-icon">
            <i className="bi bi-globe2" />
          </div>

          <div className="app-downloads__access-content">
            <span>
              Acceso web
            </span>

            <h3>
              Administra tu negocio desde cualquier
              navegador
            </h3>

            <p>
              Accede a la plataforma sin instalar
              software adicional y consulta tus
              operaciones desde computadora, tablet
              o teléfono.
            </p>
          </div>

          <div className="app-downloads__access-status">
            <span>
              <i className="bi bi-check-circle-fill" />
              Siempre disponible
            </span>
          </div>
        </div>

        <div className="app-downloads__heading animate-on-scroll">
          <span>
            Aplicaciones instalables
          </span>

          <h3>
            Elige la versión adecuada para tu equipo
          </h3>

          <p>
            Las versiones disponibles se obtienen
            directamente desde nuestro servidor para
            mostrar siempre la publicación activa más
            reciente.
          </p>
        </div>

        <div className="app-downloads__grid-apps">
          {Object.entries(platformConfig).map(
            ([platform, config]) => {
              const app = apps[platform];
              const hasError = errors[platform];

              return (
                <article
                  key={platform}
                  className={`app-download-card app-download-card--${platform} animate-on-scroll`}
                >
                  <div className="app-download-card__top">
                    <div className="app-download-card__icon">
                      <i
                        className={`bi ${config.icon}`}
                      />
                    </div>

                    <div className="app-download-card__platform">
                      <small>
                        {config.eyebrow}
                      </small>

                      <strong>
                        {config.name}
                      </strong>
                    </div>

                    {!loading && app && (
                      <span className="app-download-card__available">
                        <i className="bi bi-check-circle-fill" />
                        Disponible
                      </span>
                    )}
                  </div>

                  <div className="app-download-card__content">
                    <h3>
                      {config.title}
                    </h3>

                    <p>
                      {config.description}
                    </p>

                    <ul>
                      {config.benefits.map(
                        (benefit) => (
                          <li key={benefit}>
                            <i className="bi bi-check2" />

                            <span>
                              {benefit}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="app-download-card__version">
                    {loading ? (
                      <div className="app-download-card__loading">
                        <span className="app-download-card__spinner" />

                        <div>
                          <strong>
                            Buscando versión
                          </strong>

                          <small>
                            Consultando disponibilidad...
                          </small>
                        </div>
                      </div>
                    ) : app ? (
                      <>
                        <div className="app-download-card__version-main">
                          <span>
                            Última versión
                          </span>

                          <strong>
                            v{app.version}
                          </strong>
                        </div>

                        <div className="app-download-card__meta">
                          {app.release_date && (
                            <span>
                              <i className="bi bi-calendar3" />

                              {formatDate(
                                app.release_date
                              )}
                            </span>
                          )}

                          {app.file_size && (
                            <span>
                              <i className="bi bi-file-earmark-arrow-down" />

                              {formatFileSize(
                                app.file_size
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="app-download-card__unavailable">
                        <i className="bi bi-info-circle" />

                        <div>
                          <strong>
                            No disponible actualmente
                          </strong>

                          <small>
                            {hasError
                              ? "No pudimos consultar esta versión."
                              : "Todavía no existe una publicación activa para esta plataforma."}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>

                  {app?.notes && (
                    <div className="app-download-card__notes">
                      <span>
                        Novedades de esta versión
                      </span>

                      <p>
                        {app.notes}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="app-download-card__button"
                    disabled={!app || loading}
                    onClick={() =>
                      handleDownload(app)
                    }
                  >
                    <i className="bi bi-download" />

                    {loading
                      ? "Consultando..."
                      : app
                        ? `Descargar para ${config.name}`
                        : "No disponible"}
                  </button>

                  <span
                    className="app-download-card__decoration"
                    aria-hidden="true"
                  />
                </article>
              );
            }
          )}
        </div>

        <div className="app-downloads__footer animate-on-scroll">
          <div className="app-downloads__footer-icon">
            <i className="bi bi-arrow-repeat" />
          </div>

          <div className="app-downloads__footer-content">
            <span>
              Actualizaciones
            </span>

            <h3>
              Mantente siempre en la versión más
              reciente
            </h3>

            <p>
              Cuando nuestro equipo publica una nueva
              versión, este apartado se actualiza
              automáticamente con el instalador activo.
            </p>
          </div>

          <div className="app-downloads__footer-status">
            <strong>
              {loading
                ? "Consultando"
                : `${availableCount} ${
                    availableCount === 1
                      ? "aplicación disponible"
                      : "aplicaciones disponibles"
                  }`}
            </strong>

            <small>
              Windows y Android
            </small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloads;