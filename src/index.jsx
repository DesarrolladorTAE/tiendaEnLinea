import React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from "./App.jsx";
import { store } from "./store/store.jsx";
import PersistProvider from "./store/providers/persist-provider.jsx";
import { setProducts } from "./store/slices/product-slice.jsx";
import products from "./data/products.json";
import 'animate.css';
import 'swiper/swiper-bundle.min.css';
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./assets/scss/style.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'leaflet/dist/leaflet.css';
import { CssBaseline } from '@mui/material';

// ⛔️ Quita el import estático de 'virtual:pwa-register'
// import { registerSW } from 'virtual:pwa-register';

// ✅ Registro del Service Worker (PWA) a prueba de fallos
if ('serviceWorker' in navigator) {
  (async () => {
    try {
      // En prod siempre existe; en dev requiere devOptions.enabled: true en vite.config.js
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        immediate: true,
        onNeedRefresh() {},
        onOfflineReady() {},
      });
      console.log('[PWA] Service Worker registrado');
    } catch (e) {
      // En dev, si el plugin aún no está habilitado o no reiniciaste Vite, no rompe la app
      console.debug('[PWA] módulo virtual no disponible (dev).', e?.message);
    }
  })();
}

// Despacha los productos en el store
store.dispatch(setProducts(products));

// Root render
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistProvider>
      <CssBaseline />
      <App />
    </PersistProvider>
  </Provider>
);
