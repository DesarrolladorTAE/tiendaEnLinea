import React, { Fragment, useState, useEffect } from "react";
import Paginator from "react-hooks-paginator";
import { useLocation } from "react-router-dom";
import { getSortedProducts } from "../../helpers/product";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";

const Catalogo = () => {
  const [layout, setLayout] = useState("grid three-column");
  const sortType = "";
  const sortValue = "";
  const [filterSortType, setFilterSortType] = useState("");
  const [filterSortValue, setFilterSortValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [products, setProducts] = useState([]); // ⬅️ Aquí se guardan los productos de la API
  const { pathname } = useLocation();

  const pageLimit = 15;

  const getLayout = layout => {
    setLayout(layout);
  };

  const getFilterSortParams = (sortType, sortValue) => {
    setFilterSortType(sortType);
    setFilterSortValue(sortValue);
  };

  // ✅ Hacemos fetch y guardamos en estado local (NO REDUX)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://mitiendaenlineamx.com.mx/api/products", {
          headers: {
            "X-Store-Name": "Tienda Zapatos MX",
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (response.ok) {
          setProducts(data); // ✅ Guardamos en estado local
        } else {
          console.error("Error del servidor:", data.error || data);
        }
      } catch (error) {
        console.error("Error al cargar productos desde la API:", error);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Cada vez que los productos cambian, los ordenamos y paginamos
  useEffect(() => {
    let sorted = getSortedProducts(products, sortType, sortValue);
    sorted = getSortedProducts(sorted, filterSortType, filterSortValue);
    setSortedProducts(sorted);
    setCurrentData(sorted.slice(offset, offset + pageLimit));
  }, [offset, products, sortType, sortValue, filterSortType, filterSortValue]);

  return (
    <Fragment>
      <SEO
        titleTemplate="Shop Page"
        description="Shop page of flone react minimalist eCommerce template."
      />

      <LayoutOne headerTop="">
        {/* breadcrumb */}
        <Breadcrumb
          pages={[
            { label: "Home", path: "/" },
            { label: "Shop", path: pathname }
          ]}
        />

        <div className="shop-area pt-95 pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <ShopTopbar
                  getLayout={getLayout}
                  getFilterSortParams={getFilterSortParams}
                  productCount={products.length}
                  sortedProductCount={currentData.length}
                />

                <ShopProducts layout={layout} products={currentData} />

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

export default Catalogo;
