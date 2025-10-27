import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import { store } from "./store/store.jsx";
import PersistProvider from "./store/providers/persist-provider.jsx";
import { setProducts } from "./store/slices/product-slice.jsx";
import products from "./data/products.json";
import "animate.css";
import "swiper/swiper-bundle.min.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./assets/scss/style.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "leaflet/dist/leaflet.css";
import { CssBaseline } from "@mui/material";

// ✅ Registro del Service Worker (solo en producción)
// ✅ Registro del Service Worker en DEV y PROD
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      console.log("[PWA] prod SW registrado");
    } catch (e) {
      console.warn("[PWA] No se pudo registrar el SW:", e);
    }
  });
}



// 🧩 Inicializa los productos en Redux
store.dispatch(setProducts(products));

// 🧱 Render principal
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistProvider>
      <CssBaseline />
      <App />
    </PersistProvider>
  </Provider>
);
