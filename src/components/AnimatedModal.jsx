import React, { useEffect } from 'react';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { FaSmileWink, FaRegSmileBeam } from 'react-icons/fa';
import confetti from 'canvas-confetti';

Modal.setAppElement('#root');

const AnimatedModal = ({ isOpen, onRequestClose, message = "¡Hasta luego!", tipo = "bye" }) => {
    useEffect(() => {
        if (isOpen) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Mensaje de sesión"
            className="modaaal-content"
            overlayClassName="modal-overlaaay"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
            >
                {tipo === 'bye' ? (
                    <FaSmileWink size={60} color="#be4bdb" />
                ) : (
                    <FaRegSmileBeam size={60} color="#4dabf7" />
                )}
                <h2 className="mt-4 text-xl font-bold text-gray-800">{message}</h2>
                <button
                    onClick={onRequestClose}
                    className="mt-6 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Cerrar
                </button>
            </motion.div>
        </Modal>
    );
};

export default AnimatedModal;
