import React, { Fragment, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";

const CreditCardManager = () => {
    const { pathname } = useLocation();
    const [cards, setCards] = useState([]);
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [error, setError] = useState("");
    const [expiryError, setExpiryError] = useState("");
    const [cvvError, setCvvError] = useState("");
    const [cardNumberError, setCardNumberError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);

    const handleAddCard = (e) => {
        e.preventDefault();
        let hasError = false;

        if (cardNumber.length < 13) {
            setCardNumberError("Número de Tarjeta Incompleto");
            hasError = true;
        } else if (cardNumber.length > 19) {
            setCardNumberError("Número de Tarjeta demasiado largo");
            hasError = true;
        } else {
            setCardNumberError("");
        }

        if (!cardHolder) {
            setError("Obligatorio");
            hasError = true;
        } else {
            setError("");
        }

        if (expiryDate.length !== 5) {
            setExpiryError("Campo incompleto");
            hasError = true;
        } else {
            setExpiryError("");
        }

        if (!cvv) {
            setCvvError("CVV Obligatorio");
            hasError = true;
        } else if (cvv.length < 3) {
            setCvvError("CVV Incompleto");
            hasError = true;
        } else {
            setCvvError("");
        }

        if (hasError) return;

        setModalData({ cardNumber, cardHolder, expiryDate, cvv });
        setShowModal(true); // Muestra el modal
    };

    const handleDeleteCard = (index) => {
        const updatedCards = cards.filter((_, i) => i !== index);
        setCards(updatedCards);
    };

    const handleExpiryChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (value.length >= 2) {
            setExpiryDate(`${value.slice(0, 2)}/${value.slice(2)}`);
        } else {
            setExpiryDate(value);
        }
    };

    const handleSaveCard = () => {
        setCards([...cards, { cardNumber, cardHolder, expiryDate, cvv }]);
        setCardNumber("");
        setCardHolder("");
        setExpiryDate("");
        setCvv("");
        setShowModal(false); // Cierra el modal
    };

    const handleEditCard = () => {
        setShowModal(false); // Cierra el modal
    };

    return (
        <Fragment>
            <SEO
                titleTemplate="Gestor de Tarjetas de Crédito"
                description="Página para gestionar tarjetas de crédito."
            />
            <LayoutOne headerTop="visible">
                <Breadcrumb 
                    pages={[
                        { label: "Inicio", path: '/' },
                        { label: "Mis Tarjetas", path: pathname }
                    ]}
                />
                <div className="credit-card-manager">
                    <div className="card-list">
                        <h3>Tarjetas Agregadas</h3>
                        <ul>
                            {cards.map((card, index) => (
                                <li key={index} className="card-item">
                                    <span>{card.cardHolder} - {card.cardNumber} (Exp: {card.expiryDate})</span>
                                    <div className="icon-container">
                                        <button onClick={() => handleDeleteCard(index)}>
                                            🗑️
                                        </button>
                                        <button>
                                            👁️
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="form-container" style={{ width: "50%" }}>
                        <h2 className="contact-title">Agregar Tarjeta</h2>
                        <form onSubmit={handleAddCard} className="card-form">
                            <input
                                type="text"
                                placeholder="Número de tarjeta"
                                value={cardNumber}
                                onChange={(e) => {
                                    if (e.target.value.length <= 19) {
                                        setCardNumber(e.target.value);
                                    }
                                }}
                                required
                            />
                            {cardNumberError && <p className="error-message">{cardNumberError}</p>}
                            <input
                                type="text"
                                placeholder="Nombre del titular"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                required
                            />
                            {error && <p className="error-message">{error}</p>}
                            <input
                                type="text"
                                placeholder="Fecha de expiración (MM/AA)"
                                value={expiryDate}
                                onChange={handleExpiryChange}
                                required
                            />
                            {expiryError && <p className="error-message">{expiryError}</p>}
                            <input
                                type="text"
                                placeholder="CVV"
                                value={cvv}
                                onChange={(e) => {
                                    if (e.target.value.length <= 3) {
                                        setCvv(e.target.value);
                                    }
                                }}
                                required
                            />
                            {cvvError && <p className="error-message">{cvvError}</p>}
                            <div className="button-container">
                                <button type="submit">Agregar Tarjeta</button>
                            </div>
                        </form>
                    </div>
                </div>
                {showModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Confirmar Información</h3>
                            <p>Número de tarjeta: {modalData.cardNumber}</p>
                            <p>Nombre del titular: {modalData.cardHolder}</p>
                            <p>Fecha de expiración: {modalData.expiryDate}</p>
                            <p>CVV: {modalData.cvv}</p>
                            <div className="modal-buttons">
                                <button onClick={handleSaveCard}>Guardar</button>
                                <button onClick={handleEditCard}>Seguir Editando</button>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutOne>
        </Fragment>
    );
};

export default withAuth(CreditCardManager);