import axios from "axios";

import {
  reportSupportIncident,
} from "../utils/supportIncidentReporter";

const axiosClient = axios.create({
  baseURL:
    "https://mitiendaenlineamx.com.mx/api/",
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("AUTH_TOKEN");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

axiosClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status ?? null;

    const data =
      error.response?.data;

    const skipAuthRedirect =
      error?.config?.__skipAuthRedirect ===
      true;

    const skipSupportIncident =
      error?.config?.__skipSupportIncident ===
      true;

    const rawUrl = String(
      error?.config?.url || ""
    );

    const requestPath =
      rawUrl.split("?")[0];

    const method = String(
      error?.config?.method || "GET"
    ).toUpperCase();

    const isAuthFlow =
      rawUrl.includes("/login-store") ||
      rawUrl.includes(
        "/registro/enviar-codigo"
      ) ||
      rawUrl.includes(
        "/registro/verificar"
      );

    const isSupportFlow =
      rawUrl.includes(
        "the-business-ticket/"
      );

    const mustRedirectToRenew =
      status === 403 &&
      data?.access_valid === false &&
      !skipAuthRedirect &&
      !isAuthFlow;

    const shouldCaptureError =
      !isAuthFlow &&
      !isSupportFlow &&
      !skipSupportIncident &&
      !mustRedirectToRenew &&
      (status === null || status >= 400);

    if (
      shouldCaptureError &&
      typeof window !== "undefined"
    ) {
      void reportSupportIncident({
        status:
          status ?? "NETWORK",
        data,
        error,
        method,
        endpoint:
          requestPath ||
          "No disponible",
        page:
          window.location.pathname,
        tokenStorageKey:
          "AUTH_TOKEN",
      });
    }

    if (
      mustRedirectToRenew &&
      typeof window !== "undefined"
    ) {
      window.location.href =
        "/renovar";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;