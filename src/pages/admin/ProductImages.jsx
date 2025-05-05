import React, { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClient";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductImages = ({ productId, onClose }) => {
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState([]);
  const [error, setError] = useState("");
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const MAX_IMAGES = 6;
  const MAX_IMAGE_SIZE_MB = 2;
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const [productRes, variationsRes] = await Promise.all([
          axiosClient.get(`/admin/products/${productId}/images`),
          axiosClient.get(`/admin/products/${productId}/variations/images`),
        ]);
  
        // console.log("🖼 Imágenes del producto:", productRes.data);      // 👈 Aquí ves lo que responde el backend
        // console.log("🎨 Imágenes de variaciones:", variationsRes.data); // 👈 También lo que devuelve para variaciones
  
        setImages(productRes.data);
        setVariations(variationsRes.data);
      } catch (err) {
        console.error("❌ Error al cargar imágenes:", err);
        setError("Error al cargar las imágenes del producto");
      } finally {
        setLoading(false);
      }
    };
  
    fetchImages();
  }, [productId]);  

  const normalizeImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://mitiendaenlineamx.com.mx${url.replace(/\/\/+/g, "/")}`;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newImage || newImage.length === 0) return;

    for (const file of newImage) {
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen.");
        return;
      }
      if (file.size / 1024 / 1024 > MAX_IMAGE_SIZE_MB) {
        setError(`La imagen ${file.name} excede los ${MAX_IMAGE_SIZE_MB}MB permitidos.`);
        return;
      }
    }

    if (images.length + newImage.length > MAX_IMAGES) {
      setError("Solo se permiten hasta 6 imágenes por producto.");
      return;
    }

    const formData = new FormData();
    newImage.forEach((file) => formData.append("images[]", file));

    try {
      setUploading(true);
      const res = await axiosClient.post(`/admin/products/${productId}/images`, formData);
      setImages((prev) => [...prev, ...res.data]);
      setNewImage([]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.images?.[0] || "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (imageId) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;

    axiosClient
      .delete(`/admin/products/${productId}/images/${imageId}`)
      .then(() => {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      })
      .catch(() => setError("Error al eliminar la imagen"));
  };

  const updateVariationImage = (variationId, file) => {
    setVariations((prev) =>
      prev.map((v) => (v.id === variationId ? { ...v, newImage: file } : v))
    );
  };

  const handleVariationImageUpload = (e, variation) => {
    e.preventDefault();
    if (!variation.newImage) {
      alert("Selecciona una imagen primero.");
      return;
    }

    const formData = new FormData();
    formData.append("image", variation.newImage);

    axiosClient
      .post(`/admin/products/${productId}/variations/${variation.id}/image`, formData)
      .then((res) => {
        setVariations((prev) =>
          prev.map((v) =>
            v.id === variation.id ? { ...v, image: res.data.image, newImage: null } : v
          )
        );
      })
      .catch(() => alert("Error al subir la imagen de la variación."));
  };

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

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">🖼 Imágenes del Producto</h2>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>
            ← Volver a productos
          </button>
        )}
      </div>

      {error && <p className="text-danger">{error}</p>}

      <form onSubmit={handleUpload} className="mb-4">
        <div className="input-group">
          <input
            type="file"
            multiple
            className="form-control"
            onChange={(e) => setNewImage(Array.from(e.target.files))}
            accept="image/*"
          />
          <button type="submit" className="btn btn-success" disabled={uploading}>
            {uploading ? "Subiendo..." : "Agregar Imagen"}
          </button>
        </div>
      </form>

      {images.length === 0 && <p className="text-muted text-center">No hay imágenes aún.</p>}

      <div className="row">
        {images.map((img, index) => (
          <div className="col-md-3 mb-4" key={img.id || `img-${index}`}>
            <div className="card">
              <img
                src={normalizeImageUrl(img.image)}
                alt={`Imagen del producto ${productId}`}
                className="card-img-top"
                style={{ height: "200px", width: "100%", objectFit: "cover" }}
                loading="lazy"
              />
              <div className="card-body text-center">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(img.id)}
                  title="Eliminar imagen"
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
                    alt={`Variación color ${v.color}`}
                    className="card-img-top"
                    style={{ height: "200px", width: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                  <div className="card-body">
                    <strong>Color:</strong> {v.color}
                    <form onSubmit={(e) => handleVariationImageUpload(e, v)} className="mt-2">
                      <input
                        type="file"
                        className="form-control mb-2"
                        accept="image/*"
                        onChange={(e) => updateVariationImage(v.id, e.target.files[0])}
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
