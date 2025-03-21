// src/wrappers/product/CarrierGrid.jsx
import React from "react";

const CarrierGrid = ({ carriers = [] }) => {
  return (
    <div className="carrier-border-wrapper">
      <div className="border-top"></div>
      <div className="border-bottom"></div>
      <div className="border-left"></div>
      <div className="border-right"></div>

      <div className="carrier-grid-container">
        <div className="row">
          {carriers.map((carrier, index) => (
            <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={index}>
              <div className="carrier-card hover-shake">
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
  );
};

export default CarrierGrid;
