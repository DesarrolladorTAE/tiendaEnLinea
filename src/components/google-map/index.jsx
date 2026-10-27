import React from 'react';
import PropTypes from 'prop-types';
import { CONTACT } from '../../content/marketing.mjs';

const GoogleMap = ({ address = CONTACT.address, zoom = 16 }) => (
  <iframe
    title="Ubicación de TeLoRecargo"
    src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`}
    width="100%"
    height="400"
    style={{ border: 0 }}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    allowFullScreen
  />
);

GoogleMap.propTypes = { address: PropTypes.string, zoom: PropTypes.number };
export default GoogleMap;
