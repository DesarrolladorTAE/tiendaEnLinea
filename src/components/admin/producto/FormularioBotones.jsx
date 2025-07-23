import React from "react";

const FormularioBotones = ({ id }) => (
  <button type="submit" className="btn btn-success w-100 mt-4">
    {id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
  </button>
);

export default FormularioBotones;
