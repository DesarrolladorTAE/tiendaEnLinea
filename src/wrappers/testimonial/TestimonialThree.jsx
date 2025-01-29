import React from "react";
import Swiper, { SwiperSlide } from "../../components/swiper";
import testimonialData from "../../data/testimonial/testimonial-three.json";
import TestimonialThreeSingle from "../../components/testimonial/TestimonialThreeSingle.jsx";

const TestimonialThree = () => {
  // swiper slider settings
  const settings = {
    slidesPerView: 1,
    loop: true,
    autoplay: true
  };

  return (
    <div
      className="testimonial-area bg-img mt-195"
      style={{
        backgroundImage: `url(${
          "/assets/img/bg/testimonial-bg-2.jpg"
        })`
      }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-7">
            <div className="testimonial-active-2">
              {testimonialData && (
                <Swiper options={settings}>
                  {testimonialData.map((single, key) => (
                    <SwiperSlide key={key}>
                      <TestimonialThreeSingle
                        data={single}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </div>
          <div className="col-lg-6 col-md-5">
            <div className="testimonial-img-2">
              <img
                className="wow fadeInUp"
                src={
                  "/assets/img/testimonial/testi-2.png"
                }
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialThree;
