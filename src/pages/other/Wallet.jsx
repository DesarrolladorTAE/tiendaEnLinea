import React, { Fragment, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";
import Cards from 'react-credit-cards';
import 'react-credit-cards/es/styles-compiled.css';
import { motion, AnimatePresence } from "framer-motion";

const CreditCardManager = () => {
    const { pathname } = useLocation();
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [error, setError] = useState("");
    const [expiryError, setExpiryError] = useState("");
    const [cvvError, setCvvError] = useState("");
    const [cardNumberError, setCardNumberError] = useState("");
    const [focused, setFocused] = useState("");
    const [direction, setDirection] = useState(0);

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

        setCards([...cards, { cardNumber, cardHolder, expiryDate, cvv }]);
        setCardNumber("");
        setCardHolder("");
        setExpiryDate("");
        setCvv("");
        setFocused("");
        setCurrentCardIndex(cards.length);
    };

    const handleDeleteCard = (index) => {
        const updatedCards = cards.filter((_, i) => i !== index);
        setCards(updatedCards);
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
    };

    const handleExpiryChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (value.length >= 2) {
            setExpiryDate(`${value.slice(0, 2)}/${value.slice(2)}`);
        } else {
            setExpiryDate(value);
        }
    };

    const handleCvvChange = (e) => {
        const value = e.target.value;
        if (value.length <= 3) {
            setCvv(value);
        }
    };

    const paginate = (newDirection) => {
        const newIndex = (currentCardIndex + newDirection + cards.length) % cards.length;
        setDirection(newDirection);
        setCurrentCardIndex(newIndex);
    };

    const cardVariants = {
        enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
    };

    return (
        <Fragment>
            <SEO titleTemplate="Gestor de Tarjetas de Crédito" description="Página para gestionar tarjetas de crédito." />
            <LayoutOne headerTop="visible">
                <Breadcrumb pages={[{ label: "Inicio", path: '/' }, { label: "Mis Tarjetas", path: pathname }]} />
                <div className="credit-card-manager">
                    <div className="card-list">
                        <h3>Tarjetas Agregadas</h3>
                        <div className="card-display">
                            {cards.length > 0 ? (
                                <AnimatePresence custom={direction} mode="wait">
                                    <motion.div
                                        key={currentCardIndex}
                                        className="motion-card"
                                        custom={direction}
                                        variants={cardVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.4 }}
                                    >
                                        <Cards
                                            number={cards[currentCardIndex].cardNumber}
                                            name={cards[currentCardIndex].cardHolder}
                                            expiry={cards[currentCardIndex].expiryDate}
                                            cvc={cards[currentCardIndex].cvv}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <p style={{ textAlign: 'center' }}>No hay tarjetas aún</p>
                            )}
                            <div className="card-controls">
                                <button onClick={() => paginate(-1)} disabled={cards.length <= 1}>◀</button>
                                <button onClick={() => handleDeleteCard(currentCardIndex)} disabled={cards.length === 0}>🗑️</button>
                                <button onClick={() => paginate(1)} disabled={cards.length <= 1}>▶</button>
                            </div>
                        </div>
                    </div>
                    <div className="form-container">
                        <h2 className="contact-title">Agregar Tarjeta</h2>
                        <div className="card-animation">
                            <Cards
                                number={cardNumber}
                                name={cardHolder}
                                expiry={expiryDate}
                                cvc={cvv}
                                focused={focused}
                            />
                        </div>
                        <form onSubmit={handleAddCard} className="card-form">
                            <input type="text" placeholder="Número de tarjeta" value={cardNumber} onChange={(e) => e.target.value.length <= 19 && setCardNumber(e.target.value)} onFocus={() => setFocused("number")} required />
                            {cardNumberError && <p className="error-message">{cardNumberError}</p>}
                            <input type="text" placeholder="Nombre del titular" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} onFocus={() => setFocused("name")} required />
                            {error && <p className="error-message">{error}</p>}
                            <input type="text" placeholder="Fecha de expiración (MM/AA)" value={expiryDate} onChange={handleExpiryChange} onFocus={() => setFocused("expiry")} required />
                            {expiryError && <p className="error-message">{expiryError}</p>}
                            <input type="text" placeholder="CVV" value={cvv} onChange={handleCvvChange} onFocus={() => setFocused("cvc")} required />
                            {cvvError && <p className="error-message">{cvvError}</p>}
                            <div className="button-container">
                                <button type="submit">Agregar Tarjeta</button>
                            </div>
                        </form>
                    </div>
                </div>
            </LayoutOne>
        </Fragment>
    );
};

export default withAuth(CreditCardManager);
