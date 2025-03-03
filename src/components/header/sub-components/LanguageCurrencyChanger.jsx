import React from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { setCurrency } from "../../../store/slices/currency-slice.jsx";

const LanguageCurrencyChanger = ({ currency }) => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();

  const changeLanguageTrigger = (e) => {
    const languageCode = e.target.value;
    i18n.changeLanguage(languageCode);
  };

  const setCurrencyTrigger = (e) => {
    const currencyName = e.target.value;
    dispatch(setCurrency(currencyName));
  };

  return (
    <div className="language-currency-wrap">
      <div className="same-language-currency language-style">
        <span>
          {i18n.resolvedLanguage === "es"
            ? "Español"
            : i18n.resolvedLanguage === "en"
            ? "English"
            : i18n.resolvedLanguage === "fn"
            ? "Français"
            : i18n.resolvedLanguage === "de"
            ? "Deutsch"
            : ""}{" "}
        </span>
      </div>
      <div className="same-language-currency use-style">
        <span>{currency.currencyName}</span>
      </div>
      <div className="same-language-currency">
        <p>Llamonos 7441663916</p>
      </div>
    </div>
  );
};

LanguageCurrencyChanger.propTypes = {
  currency: PropTypes.shape({
    currencyName: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
  }).isRequired,
};

export default LanguageCurrencyChanger;