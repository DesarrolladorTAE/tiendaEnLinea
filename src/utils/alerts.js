// src/utils/alerts.js
import Swal from 'sweetalert2';

export const showSuccess = (
  text = "Operación realizada correctamente",
  opts = {}
) => {
  return Swal.fire({
    icon: 'success',
    title: 'Éxito',
    ...(opts.html ? { html: opts.html } : { text }),
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'OK',
    backdrop: true,
    customClass: { popup: 'swal-popup-override' }
  });
};

export const showError = (text = "Ocurrió un error", opts = {}) => {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    ...(opts.html ? { html: opts.html } : { text }),
    confirmButtonColor: '#d33',
    confirmButtonText: 'OK',
    backdrop: true,
    customClass: { popup: 'swal-popup-override' }
  });
};

export const showConfirm = async (
  text = "¿Estás seguro?",
  confirmText = "Sí, continuar"
) => {
  const result = await Swal.fire({
    title: 'Confirmación',
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    backdrop: true,
    customClass: { popup: 'swal-popup-override' }
  });
  return result.isConfirmed;
};

// --- Helpers para respuestas de API TAEconta / Axios ---

const errorsObjectToHtml = (errors = {}) => {
  const items = Object.entries(errors).flatMap(([field, arr]) =>
    (Array.isArray(arr) ? arr : [String(arr)]).map(
      (msg) => `<li><b>${field}</b>: ${String(msg)}</li>`
    )
  );
  if (!items.length) return "";
  return `<ul style="text-align:left;margin-left:1rem">${items.join("")}</ul>`;
};

const getAxiosData = (err) => err?.response?.data ?? null;

export const showApiSuccess = (data, fallback = "Operación exitosa") => {
  const title = data?.mensaje || data?.message || fallback;
  return showSuccess(undefined, { html: `<p>${title}</p>` });
};

export const showApiErrors = (data, fallback = "Ocurrió un error") => {
  const generalMessage =
    data?.mensaje ||
    data?.message ||
    fallback;

  const backendError = data?.error
    ? `<p style="margin-top:8px"><b>Detalle:</b> ${String(data.error)}</p>`
    : "";

  const extraDetails = data?.details
    ? `<p style="margin-top:8px"><b>Información adicional:</b> ${String(data.details)}</p>`
    : "";

  const htmlErrors = errorsObjectToHtml(data?.errors || {});

  const html = `
    <div style="text-align:left">
      <p>${generalMessage}</p>
      ${backendError}
      ${extraDetails}
      ${htmlErrors}
    </div>
  `;

  return showError(undefined, { html });
};

export const alertFromApiResult = (data, successFallback, errorFallback) => {
  if (data?.status === true || data?.ok === true) {
    return showApiSuccess(data, successFallback);
  }
  return showApiErrors(data, errorFallback);
};

export const alertFromAxiosError = (
  err,
  fallback = "Error de red o del servidor"
) => {
  const data = getAxiosData(err);
  if (data) return showApiErrors(data, fallback);
  return showError(fallback + (err?.message ? `: ${err.message}` : ""));
};
export const showToastSuccess = (
  title = "Operación realizada correctamente"
) => {
  return Swal.fire({
    icon: "success",
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    backdrop: false,
    customClass: { popup: "swal-popup-override" },
  });
};