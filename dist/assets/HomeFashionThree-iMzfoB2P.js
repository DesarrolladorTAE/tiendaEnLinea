import {
    P as a,
    R as e,
    L as m,
    r as g,
    a as L,
    b as P,
    c as H,
    u as p
  } from "./index-CJahJ6sc.js";
  
  import {
    c as h,
    g as O,
    u as R,
    a as j,
    S as U,
    L as G
  } from "./useEventCallback-CRx78OpR.js";
  
  import { S as M } from "./SectionTitle-SWOtzOaI.js";
  import { S as V, a as $ } from "./index-DquFoQ5K.js";
  import { E as q, P as D } from "./ProductModal-BUGeYyei.js";
  import { S as W } from "./SectionTitleTwo-CRBiZZ0e.js";
  
  import "./ProductRating-zUwD9DPp.js";
  import "./TransitionWrapper-CqDzojoO.js";
  import "./NoopTransition-CIA2xxt3.js";
  
  const b = [
    {
      id: 1,
      image: "/assets/img/icon-img/support-1.png",
      title: "Free Shipping",
      subtitle: "Lorem ipsum dolor sit amet consectetu adipisicing elit sed"
    },
    {
      id: 2,
      image: "/assets/img/icon-img/support-2.png",
      title: "Support 24/7",
      subtitle: "Lorem ipsum dolor sit amet consectetu adipisicing elit sed"
    },
    {
      id: 3,
      image: "/assets/img/icon-img/support-3.png",
      title: "Money Return",
      subtitle: "Lorem ipsum dolor sit amet consectetu adipisicing elit sed"
    }
  ];
  
  const C = ({ data: t, spaceBottomClass: s, textAlignClass: i }) =>
    e.createElement(
      "div",
      { className: h("support-wrap-2 support-shape", s, i) },
      e.createElement(
        "div",
        { className: "support-content-2" },
        e.createElement("img", { className: "animated", src: t.image, alt: "" }),
        e.createElement("h5", null, t.title),
        e.createElement("p", null, t.subtitle)
      )
    );
  
  C.propTypes = {
    data: a.shape({}),
    spaceBottomClass: a.string,
    textAlignClass: a.string
  };
  
  const S = ({ spaceTopClass: t, spaceBottomClass: s }) =>
    e.createElement(
      "div",
      { className: h("support-area", t, s) },
      e.createElement(
        "div",
        { className: "container" },
        e.createElement(
          "div",
          { className: "row feature-icon-two-wrap" },
          b?.map((i, n) =>
            e.createElement(
              "div",
              { className: "col-md-4", key: n },
              e.createElement(C, {
                data: i,
                spaceBottomClass: "mb-30",
                textAlignClass: "text-center"
              })
            )
          )
        )
      )
    );
  
  S.propTypes = {
    spaceBottomClass: a.string,
    spaceTopClass: a.string
  };
  
  const ae = () =>
    e.createElement(
      g.Fragment,
      null,
      e.createElement(U, {
        titleTemplate: "Fashion Home",
        description: "Fashion home of flone react minimalist eCommerce template."
      }),
      e.createElement(
        G,
        {
          headerContainerClass: "container-fluid",
          headerPaddingClass: "header-padding-2",
          headerTop: "visible"
        },
        e.createElement(I, null),
        e.createElement(S, { spaceTopClass: "pt-100", spaceBottomClass: "pb-60" }),
        e.createElement(A, { category: "accessories", limit: 10 }),
        e.createElement(x, { spaceBottomClass: "pb-55" })
      )
    );
  
  export { ae as default };