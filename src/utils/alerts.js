// src/utils/alerts.js
import Swal from 'sweetalert2';

export const showSuccess = (text = "Operación realizada correctamente") => {
  return Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text,
    confirmButtonColor: '#3085d6'
  });
};

export const showError = (text = "Ocurrió un error") => {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text,
    confirmButtonColor: '#d33'
  });
};

export const showConfirm = async (text = "¿Estás seguro?", confirmText = "Sí, continuar") => {
  const result = await Swal.fire({
    title: 'Confirmación',
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
    confirmButtonText: confirmText
  });
  return result.isConfirmed;
};
