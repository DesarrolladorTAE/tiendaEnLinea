import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import clsx from "clsx";

const HeaderTop = ({ borderStyle }) => {
  const currency = useSelector((state) => state.currency);
  const userName = useSelector((state) => state.user.name); // Obtener el nombre del usuario

  return (
    <div className={clsx("header-top-wap", borderStyle === "fluid-border" && "border-bottom")}>
      <div className="header-offer">
        <p>
          El saldo de tu Cartera es{" "}
          <span>
            {currency.currencySymbol + (2300 * currency.currencyRate).toFixed(2)}
          </span>
        </p>
        {userName && ( // Mostrar el mensaje de bienvenida solo si hay un nombre de usuario
          <p>
            Bienvenido, <strong>{userName}</strong>!
          </p>
        )}
      </div>
    </div>
  );
};

HeaderTop.propTypes = {
  borderStyle: PropTypes.string,
};

export default HeaderTop;
