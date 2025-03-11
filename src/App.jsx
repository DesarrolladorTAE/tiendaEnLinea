import React, { Suspense, lazy } from 'react';
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// home pages

const HomeFashionThree = lazy(() => import("./pages/home/HomeFashionThree.jsx"));


// shop pages

const ShopGridRightSidebar = lazy(() =>
  import("./pages/shop/ShopGridRightSidebar.jsx"));
const ShopGridPaquet = lazy(() =>
  import("./pages/shop/ShopGridPaquet.jsx")
);

// product pages
const Product = lazy(() => import("./pages/shop-product/Product.jsx"));

// other pages
const About = lazy(() => import("./pages/other/About.jsx"));
const MyContacts = lazy(() => import("./pages/other/MyContacts.jsx"));
const MyAccount = lazy(() => import("./pages/other/MyAccount.jsx"));
const Wallet = lazy(()=> import("./pages/other/Wallet.jsx"));
const Login = lazy(() => import("./pages/other/Login.jsx"));
const Contact = lazy (()=> import("./pages/other/Contact.jsx"))
const Cart = lazy(() => import("./pages/other/Cart.jsx"));
const Wishlist = lazy(() => import("./pages/other/Wishlist.jsx"));
const Compare = lazy(() => import("./pages/other/Compare.jsx"));
const Checkout = lazy(() => import("./pages/other/Checkout.jsx"));

const NotFound = lazy(() => import("./pages/other/NotFound.jsx"));

const App = () => {
  return (
    <Router>
      <ScrollToTop>
        <Suspense
          fallback={
            <div className="flone-preloader-wrapper">
              <div className="flone-preloader">
                <span></span>
                <span></span>
              </div>
            </div>
          }
        >
          <Routes>
            {/*
              Redirige la raíz ("/") a la ruta "/login-register"
              de modo que la primera página mostrada sea LoginRegister.
            */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Homepages */}
            <Route
              path="/home-fashion-three"
              element={<HomeFashionThree />}
            />

            {/* Shop pages */}
            <Route
              path="/shop-grid-right-sidebar"
              element={<ShopGridRightSidebar />}
            />
             <Route
              path="/shop-grid-paquet"
              element={<ShopGridPaquet />}
            />

            {/* Shop product pages */}
            <Route
              path="/product/:id"
              element={<Product />}
            />

            {/* Other pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/wallet" element={<Wallet />}/>
            <Route path="/login" element={<Login/>} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/mycontacts" element={<MyContacts/>}/>
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Página no encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ScrollToTop>
    </Router>
  );
};

export default App;