import React from "react";
import useScrollTop from "../hooks/useScrollTop";

const ScrollTopButton = () => {
  const visible = useScrollTop(300);

  // return (
  //   // <button
  //   //   className={`scroll-top ${visible ? "visible" : ""}`}
  //   //   onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  //   //   aria-label="Volver arriba"
  //   // >
  //   //   <i className="bi bi-arrow-up"></i>
  //   // </button>
  // );
};

export default ScrollTopButton;
