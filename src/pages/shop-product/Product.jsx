import React, { useEffect, useState } from "react";
import { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
// import { fetchProducts } from "../../store/slices/product-slice"; // Importamos la función de Redux
import { fetchProductById } from "../../store/slices/product-slice";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import RelatedProductSlider from "../../wrappers/product/RelatedProductSlider";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import ProductImageDescription from "../../wrappers/product/ProductImageDescription";

const Product = () => {
  let { pathname } = useLocation();
  let { id } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.product);
  // const [product, setProduct] = useState(null);
  const storeName = "Tienda1";

  useEffect(() => {
    dispatch(fetchProductById({ storeName, productId: id }));
  }, [dispatch, id]);

  // useEffect(() => {
  //   if (products.length > 0) {
  //     const foundProduct = products.find(
  //       (product) => product.id === parseInt(id)
  //     );
  //     setProduct(foundProduct);
  //   }
  // }, [products, id]);

  if (loading) return <p>Cargando producto...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!product) return <p>Producto no encontrado</p>;

  return (
    <Fragment>
      <SEO
        titleTemplate="Product Page"
        description="Product Page of Flone React minimalist eCommerce template."
      />

      <LayoutOne headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb
          pages={[
            { label: "Home", path: "/" },
            { label: "Shop Product", path: pathname },
          ]}
        />

        {/* product description with image */}
        <ProductImageDescription
          spaceTopClass="pt-100"
          spaceBottomClass="pb-100"
          product={product}
        />

        {/* product description tab */}
        <ProductDescriptionTab
          spaceBottomClass="pb-90"
          productFullDesc={product.fullDescription}
        />

        {/* related product slider */}
        <RelatedProductSlider
          spaceBottomClass="pb-95"
          category={product.category ? product.category[0] : ""}
        />
      </LayoutOne>
    </Fragment>
  );
};

export default Product;
