import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const LanguageCurrencyChanger = ({ currency }) => {
  const { i18n } = useTranslation();

  return (
    <div className="language-currency-wrap">
      <div className="same-language-currency language-style">
        <span>
          {i18n.resolvedLanguage === "es" ? "Español" : ""}
        </span>
      </div>
      <div className="same-language-currency use-style">
        <span>{currency.currencyName}</span> {/* Solo se mostrará "MXN" */}
      </div>
    </div>
  );
};

LanguageCurrencyChanger.propTypes = {
  currency: PropTypes.shape({
    currencyName: PropTypes.string.isRequired,
    balance: PropTypes.number, // Puedes hacer que balance no sea requerido si no lo usas
  }).isRequired,
};

export default LanguageCurrencyChanger;
