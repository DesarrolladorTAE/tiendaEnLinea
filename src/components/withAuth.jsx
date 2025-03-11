// src/components/withAuth.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const withAuth = (WrappedComponent) => {
    return (props) => {
        const navigate = useNavigate();
        const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

        useEffect(() => {
            if (!isAuthenticated) {
                alert("Acción Inválida. Debes iniciar sesión.");
                navigate("/login"); // Redirige a la página de inicio de sesión
            }
        }, [isAuthenticated, navigate]);

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
