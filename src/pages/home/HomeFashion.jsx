import React, { Fragment } from "react";
import SEO from "../../components/seo.jsx";
import LayoutOne from "../../layouts/LayoutOne.jsx";
import HeroSliderOne from "../../wrappers/hero-slider/HeroSliderOne.jsx";
import FeatureIcon from "../../wrappers/feature-icon/FeatureIcon.jsx";
import TabProduct from "../../wrappers/product/TabProduct.jsx";
import BlogFeatured from "../../wrappers/blog-featured/BlogFeatured.jsx";

const HomeFashion = () => {
  return (
    <Fragment>
      <SEO
        titleTemplate="Fashion Home"
        description="Fashion home of flone react minimalist eCommerce template."
      />
      <LayoutOne
        headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-1"
      >
        {/* hero slider */}
        <HeroSliderOne />

        {/* featured icon */}
        <FeatureIcon spaceTopClass="pt-100" spaceBottomClass="pb-60" />

        {/* tab product */}
        <TabProduct spaceBottomClass="pb-60" category="fashion" />

        {/* blog featured */}
        {/* <BlogFeatured spaceBottomClass="pb-55" /> */}
      </LayoutOne>
    </Fragment>
  );
};

export default HomeFashion;
