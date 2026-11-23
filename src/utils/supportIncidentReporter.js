export const SUPPORT_ERROR_STORAGE_KEY =
  "LAST_SUPPORT_HTTP_ERROR";

export const SUPPORT_ERROR_EVENT =
  "support:http-error";

const SUPPORT_INCIDENT_URL =
  "https://mitiendaenlineamx.com.mx/api/the-business-ticket/incidents";

const normalizeScalar = (
  value,
  maximumLength
) => {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maximumLength);
};

const resolveMessage = (data, error) => {
  const rawMessage =
    data?.message ||
    data?.error ||
    error?.message;

  if (
    typeof rawMessage === "string" &&
    rawMessage.trim()
  ) {
    return rawMessage.trim().slice(0, 10000);
  }

  return "Ocurrio un error al comunicarse con el servidor.";
};

const dispatchSupportEvent = (detail) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SUPPORT_ERROR_EVENT, {
      detail,
    })
  );
};

export const reportSupportIncident = async ({
  status,
  data,
  error,
  method,
  endpoint,
  page,
  tokenStorageKey,
}) => {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedStatus =
    status ?? "NETWORK";

  const normalizedMethod =
    normalizeScalar(method, 10) || "GET";

  const normalizedEndpoint =
    normalizeScalar(endpoint, 500) ||
    "No disponible";

  const normalizedPage =
    normalizeScalar(page, 500) || "/";

  const errorCode = normalizeScalar(
    data?.code ?? data?.error_code,
    120
  );

  const message = resolveMessage(
    data,
    error
  );

  const detectedAt =
    new Date().toISOString();

  const localError = {
    status: normalizedStatus,
    error_code: errorCode,
    message,
    method: normalizedMethod,
    endpoint: normalizedEndpoint,
    page: normalizedPage,
    occurred_at: detectedAt,
  };

  try {
    sessionStorage.setItem(
      SUPPORT_ERROR_STORAGE_KEY,
      JSON.stringify(localError)
    );
  } catch (storageError) {
    console.warn(
      "No fue posible guardar el error para soporte:",
      storageError
    );
  }

  dispatchSupportEvent(localError);

  const token = localStorage.getItem(
    tokenStorageKey
  );

  if (!token) {
    return localError;
  }

  const payload = {
    incident: {
      status_code: normalizedStatus,
      error_code: errorCode,
      message,
      method: normalizedMethod,
      endpoint: normalizedEndpoint,
      screen: normalizedPage,
      detected_at: detectedAt,
      context: {
        source: "frontend",
        browser_online:
          typeof navigator !== "undefined"
            ? navigator.onLine
            : null,
      },
    },
  };

  try {
    const response = await fetch(
      SUPPORT_INCIDENT_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData =
      await response
        .json()
        .catch(() => null);

    if (
      !response.ok ||
      !responseData?.ok
    ) {
      return localError;
    }

    const pendingCount = Number(
      responseData.pending_count ?? 0
    );

    const registeredError = {
      ...localError,
      incident_id:
        responseData?.incident
          ?.incident_id ?? null,
      pending_count:
        Number.isFinite(pendingCount)
          ? pendingCount
          : 0,
    };

    dispatchSupportEvent(
      registeredError
    );

    return registeredError;
  } catch (reportError) {
    return localError;
  }
};