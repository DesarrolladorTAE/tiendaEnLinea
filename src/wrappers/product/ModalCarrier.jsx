import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import axios from "../../axiosConfig";
import { Link } from "react-router-dom";
import { updateSaldo } from "../../store/slices/userSlice";
import { toast } from "react-toastify";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // 👈 Spinner

const ModalCarrier = ({ isOpen, onClose, carrier, productos }) => {
  const [numero, setNumero] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [errorNumero, setErrorNumero] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 👈 Estado de carga

  const user = useSelector((state) => state.user.user);
  const saldo = Number(user?.saldo) || 0;
  const isBajoSaldo = saldo < 100;
  const dispatch = useDispatch();

  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setNumero("");
      setConfirmacion("");
      setProductoSeleccionado(null);
      setErrorNumero("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      axios
        .get("/contacts")
        .then((res) => setContactos(res.data))
        .catch((err) => console.error("Error al obtener contactos", err));
    }
  }, [isOpen]);

  const handleContactoSelect = (e) => {
    const telefono = e.target.value;
    if (telefono) {
      setNumero(telefono);
      setConfirmacion(telefono);
    }
  };

  const handleInput = (value, setter) => {
    if (!/^\d*$/.test(value)) {
      setErrorNumero("Solo se permiten números");
      return;
    }

    if (value.length <= 10) {
      setter(value);
      setErrorNumero(value.length === 10 ? "" : "Son 10 números");
    }
  };

  const handleEnviarRecarga = async () => {
    if (!productoSeleccionado) return toast.warning("Selecciona un producto");
    if (numero.length !== 10 || confirmacion.length !== 10) return toast.error("Son 10 números");
    if (numero !== confirmacion) return toast.error("Los números no coinciden");
    if (productoSeleccionado.Monto > saldo) return toast.error("Saldo insuficiente");

    setIsLoading(true); // 👈 Inicio carga

    try {
      const res = await axios.post("/recargar", {
        producto: productoSeleccionado.Codigo,
        referencia: numero,
      });

      const nuevaTransaccion = res.data.transaccion;
      const nuevoSaldo = saldo - productoSeleccionado.Monto;

      dispatch(updateSaldo(nuevoSaldo));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          saldo: nuevoSaldo,
        })
      );

      toast.success(`✅ Recarga exitosa\nID: ${nuevaTransaccion.transID}`);
      onClose();
    } catch (error) {
      console.error("Error en recarga:", error.response?.data || error.message);
      toast.error("❌ " + (error.response?.data?.message || "Error desconocido"));
    } finally {
      setIsLoading(false); // 👈 Fin carga
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-contenido"
            ref={modalRef}
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            exit={{ y: -30 }}
          >
            <button className="cerrar" onClick={onClose}>
              ×
            </button>

            <div className="header">
              <div className="saldo-con-boton">
                <p className={`saldo ${isBajoSaldo ? "rojo" : "verde"}`}>
                  Saldo Disponible: ${saldo.toFixed(2)}
                </p>

                {productoSeleccionado && productoSeleccionado.Monto > saldo && (
                  <Link to="/saldo-recarga" className="boton-recarga">
                    Recargar ahora
                  </Link>
                )}
              </div>

              <img
                src={carrier.Logotipo}
                alt={carrier.Nombre}
                className="logo-carrier"
              />
            </div>

            <div className="formulario">
              <select
                onChange={(e) => {
                  const selected = productos.find(
                    (p) => p.proID === parseInt(e.target.value)
                  );
                  setProductoSeleccionado(selected);
                }}
              >
                <option value="">Selecciona un monto</option>
                {productos
                  .filter(
                    (p) =>
                      p.Carrier === carrier.Nombre &&
                      p.Categoria?.toLowerCase() ===
                        carrier.Categoria?.toLowerCase()
                  )
                  .sort((a, b) => a.Monto - b.Monto)
                  .map((p) => (
                    <option key={`producto-${p.proID}`} value={p.proID}>
                      ${p.Monto}
                    </option>
                  ))}
              </select>

              <select onChange={handleContactoSelect}>
                <option value="">Elegir Contacto</option>
                {contactos.map((c) => (
                  <option key={`contacto-${c.id}`} value={c.phone}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Número"
                value={numero}
                onChange={(e) => handleInput(e.target.value, setNumero)}
              />

              <input
                type="password"
                placeholder="Confirmar Número"
                value={confirmacion}
                onChange={(e) => handleInput(e.target.value, setConfirmacion)}
              />

              {errorNumero && (
                <p className="mensaje-error">{errorNumero}</p>
              )}

              {productoSeleccionado && (
                <div className="detalle">
                  <p>
                    📝 Al dar click en <strong>Enviar Recarga</strong>, aceptas
                    nuestros{" "}
                    <a
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Términos y Condiciones
                    </a>
                  </p>
                  <p>
                    💰 <strong>Costo del Producto:</strong> $
                    {productoSeleccionado.Monto} MXN
                  </p>
                  <p>
                    💵 <strong>Comisión por Servicio:</strong> $
                    {productoSeleccionado.suscrip}.00 MXN
                  </p>
                  <p>
                    ⏳ <strong>Vigencia:</strong>{" "}
                    <span className="vigencia">
                      {productoSeleccionado.Vigencia}
                    </span>
                  </p>
                  <p>
                    ℹ️ <strong>Descripción:</strong>{" "}
                    {productoSeleccionado.Descripcion}
                  </p>
                </div>
              )}
            </div>

            <button
              className="btn-enviar"
              onClick={handleEnviarRecarga}
              disabled={isLoading}
            >
              <span>
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="icon-spinner" />
                ) : (
                  "Enviar Recarga"
                )}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalCarrier;
