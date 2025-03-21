import React, { Fragment, useState, useEffect } from "react";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { useLocation } from "react-router-dom";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import CarrierGrid from "../../wrappers/product/CarrierGrid";
import withAuth from "../../components/withAuth";
import axios from "../../axiosConfig";

const ShopGridRightSidebar = () => {
  const [carriers, setCarriers] = useState([]);
  const { pathname } = useLocation();

  const fetchCarriers = async () => {
    try {
      const response = await axios.get("/carriers");
      const filtered = response.data.filter(
        (carrier) =>
          carrier.Categoria &&
          carrier.Categoria.toLowerCase() === "paquetes"
      );
      setCarriers(filtered);
    } catch (error) {
      console.error("Error al obtener los carriers:", error);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  return (
    <Fragment>
      <SEO titleTemplate="Paquetes" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Inicio", path: "/" },
            { label: "Paquetes", path: pathname },
          ]}
        />
          <CarrierGrid carriers={carriers} />
      </LayoutOne>
    </Fragment>
  );
};

export default withAuth(ShopGridRightSidebar);























// import React, { Fragment, useState, useEffect } from "react";
// import Paginator from "react-hooks-paginator";
// import SEO from "../../components/seo";
// import LayoutOne from "../../layouts/LayoutOne";
// import { useLocation } from "react-router-dom";
// import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
// import ShopSidebar from "../../wrappers/product/ShopSidebar";
// import ShopTopbar from "../../wrappers/product/ShopTopbar";
// import ShopProducts from "../../wrappers/product/ShopProducts";
// import withAuth from '../../components/withAuth';
// import axios from "../../axiosConfig";

// const ShopGridRightSidebar = () => {
//   const [layout, setLayout] = useState("grid three-column");
//   const [offset, setOffset] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [currentData, setCurrentData] = useState([]);
//   const [sortedProducts, setSortedProducts] = useState([]);
//   const [products, setProducts] = useState([]);

//   const pageLimit = 15;
//   let { pathname } = useLocation();

//   const fetchProducts = async () => {
//     try {
//       const response = await axios.get("/carriers");
//       const filtered = response.data.filter(
//         (producto) => producto.Categoria.toLowerCase() === "tiempo aire"
//       );
//       setProducts(filtered);
//     } catch (error) {
//       console.error("Error al obtener los productos desde Laravel:", error);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   useEffect(() => {
//     setSortedProducts(products);
//     setCurrentData(products.slice(offset, offset + pageLimit));
//   }, [offset, products]);

//   const getLayout = (layout) => setLayout(layout);

//   return (
//     <Fragment>
//       <SEO titleTemplate="Paquetes" />
//       <LayoutOne headerTop="visible">
//         <Breadcrumb 
//           pages={[
//             { label: "Inicio", path: "/" },
//             { label: "Paquetes", path: pathname }
//           ]}
//         />
//         <div className="shop-area pt-95 pb-100">
//           <div className="container">
//             <div className="row">
//               <div className="col-lg-3 order-2">
//                 <ShopSidebar products={products} />
//               </div>
//               <div className="col-lg-9 order-1">
//                 <ShopTopbar
//                   getLayout={getLayout}
//                   productCount={products.length}
//                   sortedProductCount={currentData.length}
//                 />
//                 <ShopProducts layout={layout} products={currentData} />
//                 <div className="pro-pagination-style text-center mt-30">
//                   <Paginator
//                     totalRecords={sortedProducts.length}
//                     pageLimit={pageLimit}
//                     pageNeighbours={2}
//                     setOffset={setOffset}
//                     currentPage={currentPage}
//                     setCurrentPage={setCurrentPage}
//                     pageContainerClass="mb-0 mt-0"
//                     pagePrevText="«"
//                     pageNextText="»"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </LayoutOne>
//     </Fragment>
//   );
// };

// export default withAuth(ShopGridRightSidebar);
