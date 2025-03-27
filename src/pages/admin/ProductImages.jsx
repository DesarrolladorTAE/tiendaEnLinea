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

  useEffect(() => {
    axios
      .get(`http://mitiendaenlineamx.com.mx/api/admin/products/images/${id}`)
      .then((res) => setImages(res.data))
      .catch(() => setError("Error al cargar imágenes"));
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
        `//mitiendaenlineamx.com.mx/api/admin/products/images/${id}/${imageId}`
      )
      .then(() => {
        setImages(images.filter((img) => img.id !== imageId));
      })
      .catch(() => setError("Error al eliminar la imagen"));
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 text-primary">🖼 Imágenes del Producto</h2>
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

      <div className="text-center mt-4">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/products")}
        >
          ← Volver a productos
        </button>
      </div>
    </div>
  );
};

export default ProductImages;
