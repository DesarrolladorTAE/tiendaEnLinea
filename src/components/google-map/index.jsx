import React from 'react';
import PropTypes from "prop-types";
import GoogleMapReact from 'google-map-react';

const Marker = ({ text }) => (
  <div className="map-marker">
    <img src="/assets/img/icon-img/2.png" alt={text} style={{ width: 32, height: 32 }} />
  </div>
);

const GoogleMap = ({ lat, lng, zoom }) => {
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{
          key: "AIzaSyB2D8wrWMY3XZnuHO6C31uq90JiuaFzGws",
          language: "es",
          region: "MX",
        }}
        defaultCenter={{ lat, lng }}
        defaultZoom={zoom}
      >
        <Marker lat={lat} lng={lng} text="TeLoRecargo" />
      </GoogleMapReact>
    </div>
  );
};

GoogleMap.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  zoom: PropTypes.number,
};

GoogleMap.defaultProps = {
  lat: 16.84769437234485,
  lng: -99.81158903334735,
  zoom: 15,
};

export default GoogleMap;
