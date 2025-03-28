import React, { useEffect, useState } from "react";
import { Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import { fetchProducts } from "../../store/slices/product-slice";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import RelatedProductSlider from "../../wrappers/product/RelatedProductSlider";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import ProductImageDescription from "../../wrappers/product/ProductImageDescription";

const ProductTabLeft = () => {
  let { pathname } = useLocation();
  let { id } = useParams();
  const dispatch = useDispatch();

  const { products, loading } = useSelector((state) => state.product);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const storeName = "Tienda Zapatos MX"; // Reemplázalo con la lógica para obtener el nombre de la tienda dinámicamente
    console.log("Obteniendo productos para la tienda:", storeName);
    
    if (products.length === 0) {
      dispatch(fetchProducts(storeName));
    }
  }, [dispatch, products]);
  

  useEffect(() => {
    console.log("Productos obtenidos:", products);
    if (products.length > 0) {
      const foundProduct = products.find((p) => p.id.toString() === id);
      console.log("Producto encontrado:", foundProduct);
      setProduct(foundProduct || null);
    }
  }, [products, id]);

  if (loading) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Cargando producto...</h2>
        </div>
      </LayoutOne>
    );
  }

  if (!product) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Producto no encontrado</h2>
        </div>
      </LayoutOne>
    );
  }

  return (
    <Fragment>
      <SEO
        titleTemplate="Product Page"
        description="Product page of flone react minimalist eCommerce template."
      />

      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: "/" },
            { label: "Shop Product", path: pathname },
          ]}
        />

        <ProductImageDescription
          spaceTopClass="pt-100"
          spaceBottomClass="pb-100"
          product={product}
          galleryType="leftThumb"
        />

        <ProductDescriptionTab
          spaceBottomClass="pb-90"
          productFullDesc={
            product.fullDescription || "No hay descripción disponible."
          }
        />

        <RelatedProductSlider
          spaceBottomClass="pb-95"
          category={product.category ? product.category[0] : "Sin categoría"}
        />
      </LayoutOne>
    </Fragment>
  );
};

export default ProductTabLeft;
