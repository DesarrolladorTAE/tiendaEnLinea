import React from 'react'; // Importa React aquí
import AppLoading from '../../components/loading/AppLoading';
import PropTypes from 'prop-types';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '../store.jsx';

const PersistProvider = ({ children }) => {
    return (
        <PersistGate loading={<AppLoading label="Recuperando tu sesión" />} persistor={persistor}>
            {children}
        </PersistGate>
    );
};

PersistProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PersistProvider;
