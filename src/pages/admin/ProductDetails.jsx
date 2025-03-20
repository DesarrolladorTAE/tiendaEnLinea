import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                console.log(`🔍 Obteniendo producto con ID: ${id}`);

                const headers = {
                    "X-Store-Name": "Tienda1",  // ❗ Reemplaza con el nombre de la tienda
                    "Authorization": `Bearer ${localStorage.getItem("token")}`  // Si usas tokens
                };

                const response = await axios.get(`https://mitiendaenlineamx.com.mx/api/products/${id}`, { headers });
                console.log("✅ Producto obtenido:", response.data);

                setProduct(response.data);
            } catch (error) {
                console.error("❌ Error al obtener el producto:", error);
                setError("No se pudo cargar el producto. Verifica la API.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) return <p className="text-center text-muted mt-5">⏳ Cargando producto...</p>;
    if (error) return <p className="text-center text-danger mt-5">⚠️ {error}</p>;
    if (!product) return <p className="text-center text-muted mt-5">❌ Producto no encontrado.</p>;

    return (
        <div className="container mt-5">
            <div className="card shadow-lg p-4">
                <h1 className="card-title text-center text-primary">{product.name}</h1>
                <p className="text-muted"><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Precio:</strong> ${product.price}</p>
                <p><strong>Stock:</strong> {product.stock ?? "Con Variaciones"}</p>
                <p className="mb-4"><strong>Descripción:</strong> {product.shortDescription}</p>

                <button className="btn btn-primary w-100">
                    ✏️ Editar Producto
                </button>
            </div>
        </div>
    );
};

export default ProductDetails;
