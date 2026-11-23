// src/components/admin/productForm/sections/ImagesSection.jsx
import React from "react";

/**
 * Sección: 🖼️ Imágenes del Producto
 *
 * Props:
 *  - id (string | undefined) -> para saber si es edición
 *  - imageFiles (File[])
 *  - setImageFiles (fn)
 */
export default function ImagesSection({ id, imageFiles, setImageFiles }) {
  return (
    <div className="row">
      {/* Solo permitir carga inicial cuando NO es edición */}
      {!id && (
        <div className="col-12 mb-3">
          <label className="form-label text-white">
            🖼 Imágenes del producto (hasta 6)
          </label>

          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);

              if (files.length > 6) {
                alert("Solo se permiten hasta 6 imágenes.");
                return;
              }

              const tooBig = files.find((f) => f.size > 2 * 1024 * 1024);
              if (tooBig) {
                alert(
                  `La imagen ${tooBig.name} supera los 2MB permitidos.`
                );
                return;
              }

              setImageFiles(files);
            }}
          />

          {imageFiles?.length > 0 && (
            <div className="row mt-3">
              {imageFiles.map((file, idx) => (
                <div key={idx} className="col-md-2 col-4 mb-2">
                  <div className="bg-dark p-2 rounded">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      style={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {id && (
        <div className="col-12">
          <p className="text-muted mb-0">
            Las imágenes principales se gestionan desde el editor del producto.
          </p>
        </div>
      )}
    </div>
  );
}
