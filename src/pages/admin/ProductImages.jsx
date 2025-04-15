import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductImages = ({ product, onClose }) => {
  const { id } = product; // 👈 importante
  const [images, setImages] = useState(product.image || []);
  const [newImage, setNewImage] = useState(null);
  const [error, setError] = useState("");
  const [variations, setVariations] = useState(product.variation || []);
  const [loading] = useState(false); // No se necesita fetch inicial

  const MAX_IMAGES = 6;

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newImage || newImage.length === 0) return;

    if (images.length + newImage.length > MAX_IMAGES) {
      setError("Solo se permiten hasta 6 imágenes por producto.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < newImage.length; i++) {
      formData.append("images[]", newImage[i]);
    }

    axios
      .post(`http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}`, formData)
      .then((res) => {
        setImages([...images, ...res.data]);
        setNewImage(null);
      })
      .catch(() => setError("Error al subir la imagen"));
  };

  const handleDelete = (imageId) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;

    axios
      .delete(`http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}/${imageId}`)
      .then(() => {
        setImages(images.filter((img) => img.id !== imageId));
      })
      .catch(() => setError("Error al eliminar la imagen"));
  };

  const handleVariationImageUpload = (e, variation) => {
    e.preventDefault();

    if (!variation.newImage) {
      alert("Selecciona una imagen primero.");
      return;
    }

    const formData = new FormData();
    formData.append("image", variation.newImage);

    axios
      .post(
        `http://mitiendaenlineamx.com.mx/api/products/${id}/variations/${variation.id}/image`,
        formData
      )
      .then((res) => {
        setVariations((prev) =>
          prev.map((v) =>
            v.id === variation.id ? { ...v, image: res.data.image, newImage: null } : v
          )
        );
      })
      .catch(() => alert("Error al subir la imagen de la variación."));
  };

  // ✅ Loader mientras se cargan datos
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted mt-3">Cargando imágenes y variaciones...</p>
      </div>
    );
  }

  const normalizeImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://mitiendaenlineamx.com.mx${url.replace(/\/\/+/g, "/")}`;
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">🖼 Imágenes del Producto</h2>
        <button className="btn btn-secondary" onClick={onClose}>
          ← Volver a productos
        </button>
      </div>
      {error && <p className="text-danger">{error}</p>}

      <form onSubmit={handleUpload} className="mb-4">
        <div className="input-group">
          <input
            type="file"
            multiple
            className="form-control"
            onChange={(e) => setNewImage(e.target.files)}
            accept="image/*"
          />
          <button type="submit" className="btn btn-success">
            Agregar Imagen
          </button>
        </div>
      </form>

      <div className="row">
        {images.map((imgUrl, index) => (
          <div className="col-md-3 mb-4" key={imgUrl || index}>
            <div className="card">
              <img
                src={typeof imgUrl === "string" ? imgUrl : imgUrl.image}
                alt="Producto"
                className="card-img-top"
                style={{ height: "200px", width: "100%", objectFit: "cover" }}
              />
              <div className="card-body text-center">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(imgUrl.id || imgUrl)}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {variations.length > 0 && (
        <div className="mt-5">
          <h4 className="text-info">🎨 Variaciones del producto</h4>
          <div className="row">
            {variations.map((v) => (
              <div className="col-md-4 mb-4" key={v.id}>
                <div className="card">
                  <img
                    src={normalizeImageUrl(v.image)}
                    alt={`Variación ${v.color}`}
                    className="card-img-top"
                    style={{
                      height: "200px",
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div className="card-body">
                    <strong>Color:</strong> {v.color}
                    <form onSubmit={(e) => handleVariationImageUpload(e, v)} className="mt-2">
                      <input
                        type="file"
                        className="form-control mb-2"
                        accept="image/*"
                        onChange={(e) =>
                          setVariations((prev) =>
                            prev.map((varr) =>
                              varr.id === v.id ? { ...varr, newImage: e.target.files[0] } : varr
                            )
                          )
                        }
                      />
                      <button type="submit" className="btn btn-sm btn-warning w-100">
                        ✏️ Cambiar Imagen
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImages;
