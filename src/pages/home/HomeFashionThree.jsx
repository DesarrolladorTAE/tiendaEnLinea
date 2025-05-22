import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import FeatureIconTwo from "../../wrappers/feature-icon/FeatureIconTwo";
import HeroSliderTen from "../../wrappers/hero-slider/HeroSliderTen";
import NewProductGrid from "../../wrappers/product/NewProductGrid";
import BlogFeatured from "../../wrappers/blog-featured/BlogFeatured";
import withAuth from '../../components/withAuth';

const HomeFashionThree = () => {
  const user = useSelector((state) => state.user.user);
  const isAgent = user?.role === "agent";

  return (
    <Fragment>
      <SEO
        titleTemplate="Inicio"
        description="Fashion home of flone react minimalist eCommerce template."
      />
      <LayoutOne
        headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible"
      >
        {/* Hero principal */}
        <HeroSliderTen />

        {/* Iconos de características */}
        <FeatureIconTwo spaceTopClass="pt-100" spaceBottomClass="pb-60" />

        {/* Solo se muestra si NO es agente */}
        {!isAgent && (
          <>
            <NewProductGrid category="accessories" limit={10} />
            <BlogFeatured spaceBottomClass="pb-55" />
          </>
        )}
      </LayoutOne>
    </Fragment>
  );
};

export default withAuth(HomeFashionThree);
