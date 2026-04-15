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

// Convierte { campo: [ "msg1", "msg2" ], ... } a una lista HTML
const errorsObjectToHtml = (errors = {}) => {
  const items = Object.entries(errors).flatMap(([field, arr]) =>
    (Array.isArray(arr) ? arr : [String(arr)]).map(
      (msg) => `<li><b>${field}</b>: ${String(msg)}</li>`
    )
  );
  if (!items.length) return "";
  return `<ul style="text-align:left;margin-left:1rem">${items.join("")}</ul>`;
};

// Extrae "data" seguro de un error de Axios
const getAxiosData = (err) => err?.response?.data ?? null;

// Muestra un éxito tomando en cuenta las claves típicas del backend: {status, mensaje}
export const showApiSuccess = (data, fallback = "Operación exitosa") => {
  const title = data?.mensaje || fallback;
  return showSuccess(undefined, { html: `<p>${title}</p>` });
};

// Muestra errores del backend: usa data.mensaje y data.errors si existen
export const showApiErrors = (data, fallback = "Ocurrió un error") => {
  const mensaje =
    data?.mensaje ||
    data?.message ||
    data?.error ||
    fallback;

  const htmlErrors = errorsObjectToHtml(data?.errors || {});
  const details = data?.details
    ? `<p style="margin-top:8px"><b>Detalle:</b> ${String(data.details)}</p>`
    : "";

  const html = `
    <div style="text-align:left">
      <p>${mensaje}</p>
      ${details}
      ${htmlErrors}
    </div>
  `;

  return showError(undefined, { html });
};

// Atajo: decide automáticamente según "status" (true/false) y muestra el alert correcto.
// Si es falso o viene en un catch, muestra los errores.
export const alertFromApiResult = (data, successFallback, errorFallback) => {
  if (data?.status === true) {
    return showApiSuccess(data, successFallback);
  }
  return showApiErrors(data, errorFallback);
};

// Para usar en catch(e): intenta leer e.response.data; si no hay, muestra e.message
export const alertFromAxiosError = (err, fallback = "Error de red o del servidor") => {
  const data = getAxiosData(err);
  if (data) return showApiErrors(data, fallback);
  return showError(fallback + (err?.message ? `: ${err.message}` : ""));
};
