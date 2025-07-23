import React from "react";

const FormularioImagenes = ({ setImageFiles }) => (
  <div className="mb-3">
    <label className="form-label text-white">🖼 Imágenes del producto (hasta 6)</label>
    <input
      type="file"
      className="form-control"
      accept="image/*"
      multiple
      onChange={(e) => {
        const files = Array.from(e.target.files);
        if (files.length > 6) {
          alert("Solo se permiten hasta 6 imágenes.");
          return;
        }
        const tooBig = files.find((f) => f.size > 2 * 1024 * 1024);
        if (tooBig) {
          alert(`La imagen ${tooBig.name} supera los 2MB permitidos.`);
          return;
        }
        setImageFiles(files);
      }}
    />
  </div>
);

export default FormularioImagenes;
