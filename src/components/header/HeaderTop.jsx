// src/components/header/HeaderTop.jsx
import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import clsx from "clsx";

const HeaderTop = ({ borderStyle }) => {
  const currency = useSelector((state) => state.currency);
  const user = useSelector((state) => state.user.user); // Obtener el objeto del usuario

  return (
    <div className={clsx("header-top-wap", borderStyle === "fluid-border" && "border-bottom")}>
      <div className="header-offer">
        <p>
          El saldo de tu Cartera es{" "}
          <span>
            {currency.currencySymbol + (2300 * currency.currencyRate).toFixed(2)}
          </span>
        </p>
        {user && user.name && ( // Mostrar el mensaje de bienvenida solo si hay un usuario
          <p>
            Bienvenido, <strong>{user.name}</strong>!
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
