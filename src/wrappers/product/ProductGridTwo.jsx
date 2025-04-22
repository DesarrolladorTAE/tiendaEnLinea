import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import ProductGridSingleTwo from "../../components/product/ProductGridSingleTwo";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig"; // Asegúrate de que este archivo exista y esté bien configurado

const ProductGridTwo = ({
  spaceBottomClass,
  colorClass,
  titlePriceClass,
  limit
}) => {
  const currency = useSelector((state) => state.currency);
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener productos populares
        const productosRes = await axios.get("/productos-populares");

        // 2. Obtener carriers
        const carriersRes = await axios.get("/carriers");

        // 3. Crear un mapa Carrier -> Logotipo
        const logoMap = {};
        carriersRes.data.forEach((c) => {
          logoMap[c.Nombre] = c.Logotipo;
        });

        // 4. Formatear productos para la vista
        const formateados = productosRes.data.map((p) => ({
          id: p.Codigo,
          name: `$${p.Monto} - ${p.Carrier}`,
          price: p.Monto,
          discount: p.populares ? 5 : 0,
          image: [logoMap[p.Carrier] ?? "/imagenes/default.png"],
          new: true
        }));

        setProductos(formateados.slice(0, limit));
      } catch (error) {
        console.error("Error al cargar productos populares o carriers", error);
      }
    };

    fetchData();
  }, [limit]);

  return (
    <Fragment>
      {productos.map((product) => (
        <div className="col-xl-3 col-md-6 col-lg-4 col-sm-6" key={product.id}>
          <ProductGridSingleTwo
            spaceBottomClass={spaceBottomClass}
            colorClass={colorClass}
            product={product}
            currency={currency}
            cartItem={cartItems.find((c) => c.id === product.id)}
            wishlistItem={wishlistItems.find((w) => w.id === product.id)}
            compareItem={compareItems.find((c) => c.id === product.id)}
            titlePriceClass={titlePriceClass}
          />
        </div>
      ))}
    </Fragment>
  );
};

ProductGridTwo.propTypes = {
  sliderClassName: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  colorClass: PropTypes.string,
  titlePriceClass: PropTypes.string,
  category: PropTypes.string,
  type: PropTypes.string,
  limit: PropTypes.number
};

export default ProductGridTwo;


// import React from "react";
// import { Fragment } from "react";
// import PropTypes from "prop-types";
// import { useSelector } from "react-redux";
// import { getProducts } from "../../helpers/product";
// import ProductGridSingleTwo from "../../components/product/ProductGridSingleTwo";

// const ProductGridTwo = ({
//   spaceBottomClass,
//   colorClass,
//   titlePriceClass,
//   category,
//   type,
//   limit
// }) => {
//   const { products } = useSelector((state) => state.product);
//   const currency = useSelector((state) => state.currency);
//   const { cartItems } = useSelector((state) => state.cart);
//   const { wishlistItems } = useSelector((state) => state.wishlist);
//   const { compareItems } = useSelector((state) => state.compare);
//   const prods = getProducts(products, category, type, limit);
  
//   return (
//     <Fragment>
//       {prods?.map((product) => {
//         return (
//           <div className="col-xl-3 col-md-6 col-lg-4 col-sm-6" key={product.id}>
//             <ProductGridSingleTwo
//               spaceBottomClass={spaceBottomClass}
//               colorClass={colorClass}
//               product={product}
//               currency={currency}
//               cartItem={
//                 cartItems.find((cartItem) => cartItem.id === product.id)
//               }
//               wishlistItem={
//                 wishlistItems.find(
//                   (wishlistItem) => wishlistItem.id === product.id
//                 )
//               }
//               compareItem={
//                 compareItems.find(
//                   (compareItem) => compareItem.id === product.id
//                 )
//               }
//               titlePriceClass={titlePriceClass}
//             />
//           </div>
//         );
//       })}
//     </Fragment>
//   );
// };

// ProductGridTwo.propTypes = {
//   sliderClassName: PropTypes.string,
//   spaceBottomClass: PropTypes.string,
//   colorClass: PropTypes.string,
//   titlePriceClass: PropTypes.string,
//   category: PropTypes.string,
//   type: PropTypes.string,
//   limit: PropTypes.number
// };

// export default ProductGridTwo;
