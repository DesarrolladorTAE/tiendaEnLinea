import React from 'react'; // Importa React aquí
import PropTypes from 'prop-types';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '../store.jsx';

const PersistProvider = ({ children }) => {
    return (
        <PersistGate loading={null} persistor={persistor}>
            {children}
        </PersistGate>
    );
};

PersistProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PersistProvider;
