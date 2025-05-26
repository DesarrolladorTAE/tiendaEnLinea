import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import { store } from "./store/store.jsx";
import PersistProvider from "./store/providers/persist-provider.jsx";

// Estilos y librerías
import "animate.css";
import "swiper/swiper-bundle.min.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./assets/scss/style.scss";
import "./i18n";

// Montar la app
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistProvider>
      <App />
    </PersistProvider>
  </Provider>
);
