import React, { Fragment, useState, useEffect } from "react";
import Paginator from "react-hooks-paginator";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getSortedProducts } from "../../helpers/product";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ShopTopbar from "../../wrappers/product/ShopTopbar";
import ShopProducts from "../../wrappers/product/ShopProducts";
import ShopSidebar from '../../wrappers/product/ShopSidebar';
import { useStoreData } from "../../hooks/useStoreData";
import WhatsAppFloatingButton from "../../components/WhatsAppFloatingButton";

const Catalogo = () => {
  const { storeSlug } = useParams();
  const { isStoreValid, products, storePhone, storeName } = useStoreData(storeSlug);
  const { pathname } = useLocation();
  const [layout, setLayout] = useState("grid three-column");
  const [filterSortType, setFilterSortType] = useState("");
  const [filterSortValue, setFilterSortValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const sortType = "";
  const sortValue = "";

  const pageLimit = 15;

  const getLayout = (layout) => setLayout(layout);

  const getFilterSortParams = (sortType, sortValue) => {
    setFilterSortType(sortType);
    setFilterSortValue(sortValue);
  };

  useEffect(() => {
    const sorted = getSortedProducts(
      getSortedProducts(products, sortType, sortValue),
      filterSortType,
      filterSortValue
    );

    setSortedProducts(sorted);
    setCurrentData(sorted.slice(offset, offset + pageLimit));
  }, [offset, products, sortType, sortValue, filterSortType, filterSortValue]);

  if (isStoreValid === null) return <div>Cargando tienda...</div>;

  return (
    <Fragment>
      <SEO
        title={`Catálogo de ${storeName}`}
        titleTemplate="%s | MiTiendaEnLineaMX"
        description={`Explora los productos disponibles en ${storeName}. Compra fácil y rápido.`}
      />

      {/* <LayoutOne headerTop=""> */}
      <Breadcrumb
        pages={[
          { label: "BIENVENIDO", path: pathname },
          { label: "CATALOGO", path: pathname },
        ]}
      />

      <div className="shop-area pt-50 pb-100">
        <div className="container">
          <div className="row">
            {/* <div className="col-lg-3 order-2 order-lg-1">
              <ShopSidebar
                products={products}
                getSortParams={getSortParams}
                sideSpaceClass="mr-30"
              />
            </div> */}

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
      {/* </LayoutOne> */}
      <WhatsAppFloatingButton storePhone={storePhone} />
    </Fragment>
  );
};

export default Catalogo;
