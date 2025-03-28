import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductImages = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [error, setError] = useState("");
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 nuevo

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [imagesRes, productRes] = await Promise.all([
          axios.get(
            `http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}`
          ),
          axios.get(`http://mitiendaenlineamx.com.mx/api/admin/products/${id}`),
        ]);

        setImages(imagesRes.data);

        if (productRes.data.variation) {
          setVariations(productRes.data.variation);
        }
      } catch (err) {
        setError("Error al cargar datos del producto");
      } finally {
        setLoading(false); // ✅ cuando todo termine
      }
    };

    fetchData();
  }, [id]);

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
      .post(
        `http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}`,
        formData
      )
      .then((res) => {
        setImages([...images, ...res.data]);
        setNewImage(null);
      })
      .catch(() => setError("Error al subir la imagen"));
  };

  const handleDelete = (imageId) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;

    axios
      .delete(
        `http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}/${imageId}`
      )
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
            v.id === variation.id
              ? { ...v, image: res.data.image, newImage: null }
              : v
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

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-20">
        <h2 className="text-primary">🖼 Imágenes del Producto</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/products")}
        >
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
        {images.map((img) => (
          <div className="col-md-3 mb-4" key={img.id}>
            <div className="card">
              <img
                src={img.image}
                alt="Producto"
                className="card-img-top"
                style={{ height: "200px", width: "100%", objectFit: "cover" }}
              />
              <div className="card-body text-center">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(img.id)}
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
            {variations.map((v, i) => (
              <div className="col-md-4 mb-4" key={i}>
                <div className="card">
                  <img
                    src={v.image}
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
                    <form
                      onSubmit={(e) => handleVariationImageUpload(e, v)}
                      className="mt-2"
                    >
                      <input
                        type="file"
                        className="form-control mb-2"
                        accept="image/*"
                        onChange={(e) =>
                          setVariations((prev) =>
                            prev.map((varr) =>
                              varr.id === v.id
                                ? { ...varr, newImage: e.target.files[0] }
                                : varr
                            )
                          )
                        }
                      />
                      <button
                        type="submit"
                        className="btn btn-sm btn-warning w-100"
                      >
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
