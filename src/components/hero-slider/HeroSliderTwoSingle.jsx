// src/components/hero-slider/HeroSliderTwoSingle.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const HeroSliderTwoSingle = ({ data }) => {
  return (
    <div className="single-slider single-slider-10 slider-height-8 bg-aqua">
      <div className="container">
        <div className="row">
          {/* Columna izquierda: textos */}
          <div className="col-12 col-sm-6 d-flex align-items-center">
            <div className="slider-content slider-content-10 slider-animated-2">
              {/* Logo opcional, sin cambiar estilos base */}
              {data.logo && (
                <img
                  src={data.logo}
                  alt={data.title || "logo"}
                  className="img-fluid mb-3"
                  style={{ maxHeight: 64, objectFit: "contain" }}
                />
              )}
              <h3 className="animated">{data.title}</h3>
              <h1 className="animated">{data.subtitle}</h1>
              <div className="slider-btn btn-hover">
                <Link className="animated" to={data.url}>
                  SHOP NOW
                </Link>
              </div>
            </div>
          </div>

          {/* Columna derecha: imagen de portada */}
          <div className="col-12 col-sm-6">
            <div className="slider-singleimg-hm10 slider-animated-2 ml-40 mr-40">
              <img className="animated img-fluid" src={data.image} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

HeroSliderTwoSingle.propTypes = {
  data: PropTypes.shape({})
};

export default HeroSliderTwoSingle;
