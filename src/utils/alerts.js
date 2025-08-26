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
