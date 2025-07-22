import axios from "../config/axiosClient"; // o donde tengas configurado tu axios base con /api

export const buscarClavesProducto = async (filtro = "") => {
  const res = await axios.get(`/taeconta/productos-servicios?search=${filtro}`);
  return res.data.productosServicios;
};

export const buscarClavesUnidad = async (filtro = "") => {
  const res = await axios.get(`/taeconta/claves-unidades?search=${filtro}`);
  return res.data.clavesUnidades;
};
