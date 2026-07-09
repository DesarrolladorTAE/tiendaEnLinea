import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App.jsx";
import { store } from "./store/store.jsx";
import PersistProvider from "./store/providers/persist-provider.jsx";
import { AuthProvider } from "./context/AuthContext";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// import NavidadToggle from "./components/NavidadToggle";

// Estilos
import "swiper/swiper-bundle.min.css";
import "./assets/scss/style.scss";
import "./i18n";

// Montar la app
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistProvider>
      <AuthProvider>
        {/* 🎄 Botón y nieve global */}
        {/* <NavidadToggle /> */}

        {/* Tu app normal */}
        <App />
      </AuthProvider>
    </PersistProvider>
  </Provider>
);