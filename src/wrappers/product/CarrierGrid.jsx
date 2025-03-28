import React, { useState } from "react";
import ModalCarrier from "./ModalCarrier";
import axios from "../../axiosConfig";

const CarrierGrid = ({ carriers = [] }) => {
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [productos, setProductos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCarrierClick = async (carrier) => {
    try {
      const response = await axios.get(`/producto?carrier=${carrier.Nombre}`);
      setProductos(response.data);
      setSelectedCarrier(carrier);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener productos:", error);
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
          <div className="row">
            {carriers.map((carrier, index) => (
              <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={index}>
                <div
                  className="carrier-card hover-shake"
                  onClick={() => handleCarrierClick(carrier)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={carrier.Logotipo}
                    alt={carrier.Nombre}
                    className="carrier-logo"
                  />
                  <h6 className="carrier-name">{carrier.Nombre}</h6>
                </div>
              </div>
            ))}
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
