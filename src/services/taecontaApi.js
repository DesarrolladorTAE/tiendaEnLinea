import axios from "../config/axiosClient"; // o donde tengas configurado tu axios base con /api

export const buscarClavesProducto = async (filtro = "") => {
  try {
    const res = await axios.get(`/taeconta/productos-servicios?search=${filtro}`);
    return Array.isArray(res.data.productosServicios) ? res.data.productosServicios : [];
  } catch (err) {
    console.error("Error buscando claves producto:", err);
    return [];
  }
};


export const buscarClavesUnidad = async (texto) => {
  try {
    const res = await axios.get(`/taeconta/claves-unidades?search=${texto}`);
return Array.isArray(res.data.clavesUnidades) ? res.data.clavesUnidades : [];
  } catch (err) {
    console.error("Error buscando claves unidad:", err);
    return [];
  }
};


