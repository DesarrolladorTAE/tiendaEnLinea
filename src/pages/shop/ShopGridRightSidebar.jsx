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
          carrier.Categoria.toLowerCase() === "tiempo aire"
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
      <SEO titleTemplate="Tiempo Aire" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Inicio", path: "/" },
            { label: "TiempO Aire", path: pathname },
          ]}
        />
        <CarrierGrid carriers={carriers} />
      </LayoutOne>
    </Fragment>
  );
};

export default withAuth(ShopGridRightSidebar);
