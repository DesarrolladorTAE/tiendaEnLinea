import React, { useState } from "react";
import ModalCarrier from "./ModalCarrier";
import axios from "../../axiosConfig";
import Swal from "sweetalert2";

const CarrierGrid = ({ carriers = [] }) => {
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [productos, setProductos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCarrier, setLoadingCarrier] = useState(null);

  const handleCarrierClick = async (carrier) => {
    try {
      setLoadingCarrier(carrier?.Nombre || "loading");

      const response = await axios.get(
        `/producto?carrier=${encodeURIComponent(carrier.Nombre)}`
      );

      setProductos(response.data || []);
      setSelectedCarrier(carrier);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener productos:", error);

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "No se pudieron cargar los productos.";

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonText: "Ok",
      });
    } finally {
      setLoadingCarrier(null);
    }
  };

  return (
    <>
      <div className="carrier-border-wrapper">
        <div className="border-top"></div>
        <div className="border-bottom"></div>
        <div className="border-left"></div>
        <div className="border-right"></div>

        <div className="carrier-grid-container">
          {/* ✅ 2 cols en móvil, 3 en sm, 4 en lg */}
          <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-4 g-3 g-md-4">
            {carriers.map((carrier, index) => {
              const isLoading = loadingCarrier === carrier?.Nombre;

              return (
                <div className="col" key={carrier?.Nombre || index}>
<button
  type="button"
  className={`carrier-card hover-shake ${isLoading ? "is-loading" : ""}`}
  onClick={() => handleCarrierClick(carrier)}
  disabled={!!isLoading}
>
  {/* ✅ área que se centra sola */}
  <div className="carrier-logo-area">
    <img
      src={carrier.Logotipo}
      alt={carrier.Nombre}
      className="carrier-logo"
      loading="lazy"
      draggable="false"
    />
  </div>

  <h6 className="carrier-name" title={carrier.Nombre}>
    {carrier.Nombre}
  </h6>

  {isLoading && <span className="carrier-loading">Cargando...</span>}
</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ModalCarrier
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        carrier={selectedCarrier}
        productos={productos}
      />
    </>
  );
};

export default CarrierGrid;