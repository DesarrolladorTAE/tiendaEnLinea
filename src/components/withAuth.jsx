// src/components/withAuth.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AnimatedModal from '../../src/components/AnimatedModal'; // ajusta la ruta

const withAuth = (WrappedComponent) => {
    return (props) => {
        const navigate = useNavigate();
        const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
        const [showModal, setShowModal] = useState(false);

        useEffect(() => {
            if (!isAuthenticated) {
                setShowModal(true);
                setTimeout(() => {
                    navigate("/loginmui");
                }, 3000);
            }
        }, [isAuthenticated]);

        return (
            <>
                <WrappedComponent {...props} />
            </>
        );
    };
};

export default withAuth;

