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
import "./i18n";

// MUI Theme
import { ThemeProvider, CssBaseline } from '@mui/material';
// import { ColorModeProvider } from "./context/ThemeContext";


// Despacha los productos en el store
store.dispatch(setProducts(products));

// Root render
const container = document.getElementById('root');
const root = createRoot(container);


root.render(
  <Provider store={store}>
    <PersistProvider>
      {/* <ColorModeProvider> */}
        <CssBaseline />
        <App />
      {/* </ColorModeProvider> */}
    </PersistProvider>
  </Provider>
);
