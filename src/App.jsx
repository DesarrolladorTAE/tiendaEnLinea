import React, { Suspense, lazy } from 'react';
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// home pages
const HomeFashion = lazy(() => import("./pages/home/HomeFashion.jsx"));
const HomeFashionTwo = lazy(() => import("./pages/home/HomeFashionTwo.jsx"));
const HomeFashionThree = lazy(() => import("./pages/home/HomeFashionThree.jsx"));
const HomeFashionFour = lazy(() => import("./pages/home/HomeFashionFour.jsx"));
const HomeFashionFive = lazy(() => import("./pages/home/HomeFashionFive.jsx"));
const HomeFashionSix = lazy(() => import("./pages/home/HomeFashionSix.jsx"));
const HomeFashionSeven = lazy(() => import("./pages/home/HomeFashionSeven.jsx"));
const HomeFashionEight = lazy(() => import("./pages/home/HomeFashionEight.jsx"));
const HomeKidsFashion = lazy(() => import("./pages/home/HomeKidsFashion.jsx"));
const HomeCosmetics = lazy(() => import("./pages/home/HomeCosmetics.jsx"));
const HomeFurniture = lazy(() => import("./pages/home/HomeFurniture.jsx"));
const HomeFurnitureTwo = lazy(() => import("./pages/home/HomeFurnitureTwo.jsx"));
const HomeFurnitureThree = lazy(() =>
  import("./pages/home/HomeFurnitureThree.jsx")
);
const HomeFurnitureFour = lazy(() => import("./pages/home/HomeFurnitureFour.jsx"));
const HomeFurnitureFive = lazy(() => import("./pages/home/HomeFurnitureFive.jsx"));
const HomeFurnitureSix = lazy(() => import("./pages/home/HomeFurnitureSix.jsx"));
const HomeFurnitureSeven = lazy(() =>
  import("./pages/home/HomeFurnitureSeven.jsx")
);
const HomeElectronics = lazy(() => import("./pages/home/HomeElectronics.jsx"));
const HomeElectronicsTwo = lazy(() =>
  import("./pages/home/HomeElectronicsTwo.jsx")
);
const HomeElectronicsThree = lazy(() =>
  import("./pages/home/HomeElectronicsThree.jsx")
);
const HomeBookStore = lazy(() => import("./pages/home/HomeBookStore.jsx"));
const HomeBookStoreTwo = lazy(() => import("./pages/home/HomeBookStoreTwo.jsx"));
const HomePlants = lazy(() => import("./pages/home/HomePlants.jsx"));
const HomeFlowerShop = lazy(() => import("./pages/home/HomeFlowerShop.jsx"));
const HomeFlowerShopTwo = lazy(() => import("./pages/home/HomeFlowerShopTwo.jsx"));
const HomeOrganicFood = lazy(() => import("./pages/home/HomeOrganicFood.jsx"));
const HomeOrganicFoodTwo = lazy(() =>
  import("./pages/home/HomeOrganicFoodTwo.jsx")
);
const HomeOnepageScroll = lazy(() => import("./pages/home/HomeOnepageScroll.jsx"));
const HomeGridBanner = lazy(() => import("./pages/home/HomeGridBanner.jsx"));
const HomeAutoParts = lazy(() => import("./pages/home/HomeAutoParts.jsx"));
const HomeCakeShop = lazy(() => import("./pages/home/HomeCakeShop.jsx"));
const HomeHandmade = lazy(() => import("./pages/home/HomeHandmade.jsx"));
const HomePetFood = lazy(() => import("./pages/home/HomePetFood.jsx"));
const HomeMedicalEquipment = lazy(() =>
  import("./pages/home/HomeMedicalEquipment.jsx")
);
const HomeChristmas = lazy(() => import("./pages/home/HomeChristmas.jsx"));
const HomeBlackFriday = lazy(() => import("./pages/home/HomeBlackFriday.jsx"));
const HomeBlackFridayTwo = lazy(() =>
  import("./pages/home/HomeBlackFridayTwo.jsx")
);
const HomeValentinesDay = lazy(() => import("./pages/home/HomeValentinesDay.jsx"));

// shop pages
const ShopGridStandard = lazy(() => import("./pages/shop/ShopGridStandard.jsx"));
const ShopGridFilter = lazy(() => import("./pages/shop/ShopGridFilter.jsx"));
const ShopGridTwoColumn = lazy(() => import("./pages/shop/ShopGridTwoColumn.jsx"));
const ShopGridNoSidebar = lazy(() => import("./pages/shop/ShopGridNoSidebar.jsx"));
const ShopGridFullWidth = lazy(() => import("./pages/shop/ShopGridFullWidth.jsx"));
const ShopGridRightSidebar = lazy(() =>
  import("./pages/shop/ShopGridRightSidebar.jsx")
);
const ShopListStandard = lazy(() => import("./pages/shop/ShopListStandard.jsx"));
const ShopListFullWidth = lazy(() => import("./pages/shop/ShopListFullWidth.jsx"));
const ShopListTwoColumn = lazy(() => import("./pages/shop/ShopListTwoColumn.jsx"));

// product pages
const Product = lazy(() => import("./pages/shop-product/Product.jsx"));
const ProductTabLeft = lazy(() =>
  import("./pages/shop-product/ProductTabLeft.jsx")
);
const ProductTabRight = lazy(() =>
  import("./pages/shop-product/ProductTabRight.jsx")
);
const ProductSticky = lazy(() => import("./pages/shop-product/ProductSticky.jsx"));
const ProductSlider = lazy(() => import("./pages/shop-product/ProductSlider.jsx"));
const ProductFixedImage = lazy(() =>
  import("./pages/shop-product/ProductFixedImage.jsx")
);

// blog pages
const BlogStandard = lazy(() => import("./pages/blog/BlogStandard.jsx"));
const BlogNoSidebar = lazy(() => import("./pages/blog/BlogNoSidebar.jsx"));
const BlogRightSidebar = lazy(() => import("./pages/blog/BlogRightSidebar.jsx"));
const BlogDetailsStandard = lazy(() =>
  import("./pages/blog/BlogDetailsStandard.jsx")
);

// other pages
const About = lazy(() => import("./pages/other/About.jsx"));
const Contact = lazy(() => import("./pages/other/Contact.jsx"));
const MyAccount = lazy(() => import("./pages/other/MyAccount.jsx"));
const LoginRegister = lazy(() => import("./pages/other/LoginRegister.jsx"));

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
              <Route
                path="/"
                element={<HomeFashion/>}
              />

              {/* Homepages */}
              <Route
                path={  "/home-fashion"}
                element={<HomeFashion/>}
              />
              <Route
                path={  "/home-fashion-two"}
                element={<HomeFashionTwo/>}
              />
              <Route
                path={  "/home-fashion-three"}
                element={<HomeFashionThree/>}
              />
              <Route
                path={  "/home-fashion-four"}
                element={<HomeFashionFour/>}
              />
              <Route
                path={  "/home-fashion-five"}
                element={<HomeFashionFive/>}
              />
              <Route
                path={  "/home-fashion-six"}
                element={<HomeFashionSix/>}
              />
              <Route
                path={  "/home-fashion-seven"}
                element={<HomeFashionSeven/>}
              />
              <Route
                path={  "/home-fashion-eight"}
                element={<HomeFashionEight/>}
              />
              <Route
                path={  "/home-kids-fashion"}
                element={<HomeKidsFashion/>}
              />
              <Route
                path={  "/home-cosmetics"}
                element={<HomeCosmetics/>}
              />
              <Route
                path={  "/home-furniture"}
                element={<HomeFurniture/>}
              />
              <Route
                path={  "/home-furniture-two"}
                element={<HomeFurnitureTwo/>}
              />
              <Route
                path={  "/home-furniture-three"}
                element={<HomeFurnitureThree/>}
              />
              <Route
                path={  "/home-furniture-four"}
                element={<HomeFurnitureFour/>}
              />
              <Route
                path={  "/home-furniture-five"}
                element={<HomeFurnitureFive/>}
              />
              <Route
                path={  "/home-furniture-six"}
                element={<HomeFurnitureSix/>}
              />
              <Route
                path={  "/home-furniture-seven"}
                element={<HomeFurnitureSeven/>}
              />
              <Route
                path={  "/home-electronics"}
                element={<HomeElectronics/>}
              />
              <Route
                path={  "/home-electronics-two"}
                element={<HomeElectronicsTwo/>}
              />
              <Route
                path={  "/home-electronics-three"}
                element={<HomeElectronicsThree/>}
              />
              <Route
                path={  "/home-book-store"}
                element={<HomeBookStore/>}
              />
              <Route
                path={  "/home-book-store-two"}
                element={<HomeBookStoreTwo/>}
              />
              <Route
                path={  "/home-plants"}
                element={<HomePlants/>}
              />
              <Route
                path={  "/home-flower-shop"}
                element={<HomeFlowerShop/>}
              />
              <Route
                path={  "/home-flower-shop-two"}
                element={<HomeFlowerShopTwo/>}
              />
              <Route
                path={  "/home-organic-food"}
                element={<HomeOrganicFood/>}
              />
              <Route
                path={  "/home-organic-food-two"}
                element={<HomeOrganicFoodTwo/>}
              />
              <Route
                path={  "/home-onepage-scroll"}
                element={<HomeOnepageScroll/>}
              />
              <Route
                path={  "/home-grid-banner"}
                element={<HomeGridBanner/>}
              />
              <Route
                path={  "/home-auto-parts"}
                element={<HomeAutoParts/>}
              />
              <Route
                path={  "/home-cake-shop"}
                element={<HomeCakeShop/>}
              />
              <Route
                path={  "/home-handmade"}
                element={<HomeHandmade/>}
              />
              <Route
                path={  "/home-pet-food"}
                element={<HomePetFood/>}
              />
              <Route
                path={  "/home-medical-equipment"}
                element={<HomeMedicalEquipment/>}
              />
              <Route
                path={  "/home-christmas"}
                element={<HomeChristmas/>}
              />
              <Route
                path={  "/home-black-friday"}
                element={<HomeBlackFriday/>}
              />
              <Route
                path={  "/home-black-friday-two"}
                element={<HomeBlackFridayTwo/>}
              />
              <Route
                path={  "/home-valentines-day"}
                element={<HomeValentinesDay/>}
              />

              {/* Shop pages */}
              <Route
                path={  "/shop-grid-standard"}
                element={<ShopGridStandard/>}
              />
              <Route
                path={  "/shop-grid-filter"}
                element={<ShopGridFilter/>}
              />
              <Route
                path={  "/shop-grid-two-column"}
                element={<ShopGridTwoColumn/>}
              />
              <Route
                path={  "/shop-grid-no-sidebar"}
                element={<ShopGridNoSidebar/>}
              />
              <Route
                path={  "/shop-grid-full-width"}
                element={<ShopGridFullWidth/>}
              />
              <Route
                path={  "/shop-grid-right-sidebar"}
                element={<ShopGridRightSidebar/>}
              />
              <Route
                path={  "/shop-list-standard"}
                element={<ShopListStandard/>}
              />
              <Route
                path={  "/shop-list-full-width"}
                element={<ShopListFullWidth/>}
              />
              <Route
                path={  "/shop-list-two-column"}
                element={<ShopListTwoColumn/>}
              />

              {/* Shop product pages */}
              <Route
                path={  "/product/:id"}
                element={<Product />}
              />
              <Route
                path={  "/product-tab-left/:id"}
                element={<ProductTabLeft/>}
              />
              <Route
                path={  "/product-tab-right/:id"}
                element={<ProductTabRight/>}
              />
              <Route
                path={  "/product-sticky/:id"}
                element={<ProductSticky/>}
              />
              <Route
                path={  "/product-slider/:id"}
                element={<ProductSlider/>}
              />
              <Route
                path={  "/product-fixed-image/:id"}
                element={<ProductFixedImage/>}
              /> 

              {/* Blog pages */}
              <Route
                path={  "/blog-standard"}
                element={<BlogStandard/>}
              />
              <Route
                path={  "/blog-no-sidebar"}
                element={<BlogNoSidebar/>}
              />
              <Route
                path={  "/blog-right-sidebar"}
                element={<BlogRightSidebar/>}
              />
              <Route
                path={  "/blog-details-standard"}
                element={<BlogDetailsStandard/>}
              /> 

              {/* Other pages */}
              <Route
                path={  "/about"}
                element={<About/>}
              />
              <Route
                path={  "/contact"}
                element={<Contact/>}
              />
              <Route
                path={  "/my-account"}
                element={<MyAccount/>}
              />
              <Route
                path={  "/login-register"}
                element={<LoginRegister/>}
              />

              <Route
                path={  "/cart"}
                element={<Cart/>}
              />
              <Route
                path={  "/wishlist"}
                element={<Wishlist/>}
              />
              <Route
                path={  "/compare"}
                element={<Compare/>}
              />
              <Route
                path={  "/checkout"}
                element={<Checkout/>}
              /> 

              <Route path="*" element={<NotFound/>} />
            </Routes>
          </Suspense>
        </ScrollToTop>
      </Router>
  );
};

export default App;