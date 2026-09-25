import axiosClient from "../../config/axiosClient";

const paymentMethodsPath = "/admin/payment-methods";

/**
 * Obtiene la configuración general de los métodos
 * disponibles para la tienda autenticada.
 */
export const getPaymentMethods = () =>
  axiosClient.get(paymentMethodsPath);

/**
 * Obtiene un método específico.
 *
 * Ej:
 * paypal
 * transferencia
 * whatsapp
 */
export const getPaymentMethod = (code) =>
  axiosClient.get(
    `${paymentMethodsPath}/${encodeURIComponent(code)}`
  );

/**
 * Actualiza la configuración de un método.
 *
 * payload:
 * {
 *   is_active?: boolean,
 *   config?: {},
 *   sort_order?: number
 * }
 */
export const updatePaymentMethod = (code, payload) =>
  axiosClient.put(
    `${paymentMethodsPath}/${encodeURIComponent(code)}`,
    payload
  );

/**
 * Activa/desactiva un método.
 */
export const togglePaymentMethod = (code) =>
  axiosClient.post(
    `${paymentMethodsPath}/${encodeURIComponent(code)}/toggle`
  );