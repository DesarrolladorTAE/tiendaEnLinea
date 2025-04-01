import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../store/slices/userSlice"; // Asegúrate de que la ruta esté bien
import axios from "../../axiosConfig";
import { motion } from "framer-motion";
import ModalMensaje from "../conekta/ModalMensaje";
import { toast } from "react-toastify";


const PagoConekta = () => {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [monto, setMonto] = useState("");
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [mensajeModal, setMensajeModal] = useState("");
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const playSuccessSound = () => {
        const audio = new Audio("src/data/tons/sound2.mp3");
        audio.play();
      };
      

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdn.conekta.io/js/latest/conekta.js";
        script.async = true;
        script.onload = () => {
            window.Conekta.setPublicKey("key_JCa9uYunTSvcY7GsGzL2kNo");
        };
        document.body.appendChild(script);
    }, []);

    const handlePago = (e) => {
        e.preventDefault();
        setLoading(true);

        window.Conekta.Token.create(
            {
                card: {
                    number: document.getElementById("cardNumber").value,
                    name: document.getElementById("cardName").value,
                    exp_year: document.getElementById("expYear").value,
                    exp_month: document.getElementById("expMonth").value,
                    cvc: document.getElementById("cvc").value,
                },
            },
            async (token) => {
                try {
                    const res = await axios.post("/conekta/crear-cargo", {
                        token_id: token.id,
                        nombre,
                        email,
                        telefono,
                        monto,
                    });

                    if (res.data.success) {
                        const nuevoSaldo = parseFloat(user?.saldo || 0) + parseFloat(monto);
                        const updatedUser = { ...user, saldo: nuevoSaldo };
                        dispatch(setUser({ user: updatedUser, token: localStorage.getItem("token") }));

                        setMensajeModal(`✅ Pago exitoso. Se ha abonado $${monto} a tu saldo.`);
                        setModalVisible(true);

                        toast.success("💰 Recarga exitosa. Saldo actualizado", {
                            position: "top-right",
                            autoClose: 3000,
                            pauseOnHover: true,
                            draggable: true,
                        });

                        playSuccessSound();


                    } else {
                        setMensajeModal("❌ Error en el servidor.");
                    }
                } catch (err) {
                    setMensajeModal("❌ Error al procesar el pago.");
                } finally {
                    setModalVisible(true);
                    setLoading(false);
                }
            },
            (err) => {
                setMensajeModal(err.message_to_purchaser || "❌ Error en los datos de tarjeta.");
                setModalVisible(true);
                setLoading(false);
            }
        );
    };

    return (
        <motion.div className="pago-container" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            {/* ✅ MODAL MENSAJE */}
            <ModalMensaje
                visible={modalVisible}
                mensaje={mensajeModal}
                onClose={() => setModalVisible(false)}
            />

            <div className="formulario">
                <h2>💳 Paga con Conekta</h2>
                <form onSubmit={handlePago} className="formulario-doble">
                    <div className="col">
                        <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                        <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="tel" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
                        <input type="number" placeholder="Monto a recargar" value={monto} onChange={(e) => setMonto(e.target.value)} required />
                    </div>

                    <div className="col">
                        <input id="cardName" type="text" placeholder="Nombre en la tarjeta" required />
                        <input id="cardNumber" type="text" placeholder="Número de tarjeta" required />
                        <div className="card-row">
                            <input id="expMonth" type="text" placeholder="Mes (MM)" required />
                            <input id="expYear" type="text" placeholder="Año (YYYY)" required />
                            <input id="cvc" type="text" placeholder="CVC" required />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Procesando..." : `Pagar $${monto || "..."}`}
                    </button>
                </form>

                <button type="submit" onClick={handlePago} className="btn-pago">
                    Pagar ${monto || '...'}
                </button>
            </div>

            <motion.div className="info-extra" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <img src="https://cdn-icons-png.flaticon.com/512/891/891419.png" alt="Pago seguro" />
                <p>Realiza tu recarga de forma segura usando tu tarjeta bancaria.</p>
            </motion.div>
        </motion.div>
    );
};

export default PagoConekta;
