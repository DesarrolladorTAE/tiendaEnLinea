import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const headers = {
            "X-Store-Name": "Tienda1",
        };

        axios.get("http://mitiendaenlineamx.com.mx/api/products", { headers })
            .then(response => setProducts(response.data))
            .catch(error => {
                console.error("Error al obtener productos:", error);
                setError(error.response?.data?.error || "Error desconocido");
            });
    }, []);

    return (
        <div className="container mt-4">
            <h1 className="text-center text-primary">🛒 Lista de Productos</h1>

            {error && <p className="text-danger text-center">{error}</p>}

            <div className="table-responsive mt-3">
                <table className="table table-bordered table-striped">
                    <thead className="thead-dark">
                        <tr>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.name || "N/A"}</td>
                                    <td>${product.price || "0.00"}</td>
                                    <td>{product.stock ?? "Con Variaciones"}</td>
                                    <td>
                                        <Link to={`/admin/products/${product.id}`} className="btn btn-success">
                                            🔍 Ver detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted">No hay productos disponibles</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
