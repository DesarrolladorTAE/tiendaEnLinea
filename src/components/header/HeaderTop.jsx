import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { Link } from "react-router-dom";

const HeaderTop = ({ borderStyle }) => {
  const currency = useSelector((state) => state.currency);
  const user = useSelector((state) => state.user.user);

  const saldo = Number(user?.saldo) || 0;
  const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
  const isBajoSaldo = saldo < 100;
  const isAgente = user?.role === "agent"; // ✅ detectar si es agente

  return (
    <div
      className={clsx(
        "header-top-wap",
        borderStyle === "fluid-border" && "border-bottom"
      )}
    >
      <div className="header-offer">
        {user && (
          <>
            <div className="saldo-wrapper">
              <p className="texto-saldo">
                El saldo de tu Cartera es{" "}
                <span className={isBajoSaldo ? "saldo-rojo" : "saldo-verde"}>
                  {currency.currencySymbol + saldoConvertido}
                </span>
              </p>

              {/* ✅ Solo mostrar el botón si NO es agente */}
              {isBajoSaldo && !isAgente && (
                <Link to="/saldo-recarga" className="boton-recarga">
                  Recarga ahora
                </Link>
              )}
            </div>

            <div className="lado-derecho">
              <p className="bienvenida">
                Bienvenido,{" "}
                <strong>
                  {user.name} {user.apellidos}
                </strong>
                !
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

HeaderTop.propTypes = {
  borderStyle: PropTypes.string,
};

export default HeaderTop;
