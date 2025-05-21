import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { Link } from "react-router-dom";

const HeaderTop = ({ borderStyle }) => {
  const currency = useSelector((state) => state.currency);
  const { user, userType } = useSelector((state) => state.user);

  // Obtener saldo dependiendo del tipo de usuario
  const saldo = Number(
    userType === 'agent' ? user?.saldo_asignado : user?.saldo
  ) || 0;

  const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
  const isBajoSaldo = saldo < 100;

  // Mostrar nombre dependiendo de si es agente o store
  const nombre = user?.nombre || user?.name || "";
  const apellidos = user?.apellidos || "";

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

              {/* Puedes activar este botón si quieres permitir recargas */}
              {/* {isBajoSaldo && (
                <Link to="/recargar-saldo" className="boton-recarga">
                  Recarga ahora
                </Link>
              )} */}
            </div>

            <div className="lado-derecho">
              <p className="bienvenida">
                Bienvenido,{" "}
                <strong>
                  {nombre} {apellidos}
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
