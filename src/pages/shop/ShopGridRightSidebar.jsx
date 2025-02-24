import React, { Fragment, useState, useEffect } from "react";
import Paginator from "react-hooks-paginator";
import { useLocation } from "react-router-dom";
import { getSortedProducts } from "../../helpers/product";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopSidebar from "../../wrappers/product/ShopSidebar";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";


const ShopGridRightSidebar = () => {
  const [layout, setLayout] = useState("grid three-column");
  const [sortType, setSortType] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [filterSortType, setFilterSortType] = useState("");
  const [filterSortValue, setFilterSortValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [products, setProducts] = useState([]); // Estado local para los productos

  const pageLimit = 15;
  let { pathname } = useLocation();

  // Función para obtener productos desde la API de Strapi
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/products"); // URL de la API de Strapi
      const data = await response.json();
      // En tu caso, la API devuelve los datos en el mismo nivel, sin "attributes"
      if (data && data.data) {
        setProducts(data.data);
      } else {
        console.error("La respuesta de la API no tiene el formato esperado:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    }
  };

  // Llamar a la API cuando el componente se monte
  useEffect(() => {
    fetchProducts();
  }, []);

  // Actualizar los productos ordenados y paginados
  useEffect(() => {
    let sortedProducts = getSortedProducts(products, sortType, sortValue);
    const filterSortedProducts = getSortedProducts(
      sortedProducts,
      filterSortType,
      filterSortValue
    );
    sortedProducts = filterSortedProducts;
    setSortedProducts(sortedProducts);
    setCurrentData(sortedProducts.slice(offset, offset + pageLimit));
  }, [offset, products, sortType, sortValue, filterSortType, filterSortValue]);

  const getLayout = (layout) => {
    setLayout(layout);
  };

  const getSortParams = (sortType, sortValue) => {
    setSortType(sortType);
    setSortValue(sortValue);
  };

  const getFilterSortParams = (sortType, sortValue) => {
    setFilterSortType(sortType);
    setFilterSortValue(sortValue);
  };

  return (
    <Fragment>
      <SEO
        titleTemplate="Shop Page"
        description="Shop page of flone react minimalist eCommerce template."
      />

      <LayoutOne headerTop="visible">
        {/* Breadcrumb */}
        <Breadcrumb 
          pages={[
            { label: "Home", path: "/" },
            { label: "Shop", path: pathname }
          ]}
        />

        <div className="shop-area pt-95 pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-3 order-2">
                {/* Shop Sidebar */}
                <ShopSidebar
                  products={products}
                  getSortParams={getSortParams}
                  sideSpaceClass="ml-30"
                />
              </div>
              <div className="col-lg-9 order-1">
                {/* Shop Topbar */}
                <ShopTopbar
                  getLayout={getLayout}
                  getFilterSortParams={getFilterSortParams}
                  productCount={products.length}
                  sortedProductCount={currentData.length}
                />

                {/* Shop Products */}
                <ShopProducts layout={layout} products={currentData} />

                {/* Shop Product Pagination */}
                <div className="pro-pagination-style text-center mt-30">
                  <Paginator
                    totalRecords={sortedProducts.length}
                    pageLimit={pageLimit}
                    pageNeighbours={2}
                    setOffset={setOffset}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    pageContainerClass="mb-0 mt-0"
                    pagePrevText="«"
                    pageNextText="»"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ShopGridRightSidebar;
