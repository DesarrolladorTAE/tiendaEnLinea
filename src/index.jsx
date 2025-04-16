// 1. Setup básico
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import { store } from "./store/store.jsx";
import PersistProvider from "./store/providers/persist-provider.jsx";
import { setProducts } from "./store/slices/product-slice.jsx";
import "animate.css";
import "swiper/swiper-bundle.min.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./assets/scss/style.scss";
import "./i18n";

// 2. Crea el root ANTES
const container = document.getElementById("root");
const root = createRoot(container);

// 3. Fetch de productos desde la API
const fetchProducts = async () => {
  try {
    const response = await fetch("https://mitiendaenlineamx.com.mx/api/productos", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      store.dispatch(setProducts(data));
    } else {
      console.error("Error del servidor:", data.error || data);
    }
  } catch (error) {
    console.error("Error al cargar productos desde la API:", error);
  }

  root.render(
    <Provider store={store}>
      <PersistProvider>
        <App />
      </PersistProvider>
    </Provider>
  );
};

// 5. Llama a la función
fetchProducts();
