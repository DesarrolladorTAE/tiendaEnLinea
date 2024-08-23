import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const HeroSliderOneSingle = ({ data }) => {
  return (
    <div className="single-slider  bg-purple">
      <div className="container">
        <div className="row">
          <div className="col-xl-6 col-lg-6 col-md-6 col-12 col-sm-6 ">
            <div className="slider-content slider-animated-1">
              <h3 className="animated">{data.title}</h3>
              <h1 className="animated">{data.subtitle}</h1>
              <div className="slider-btn btn-hover">
                <Link
                  className="animated"
                  to={process.env.PUBLIC_URL + data.url}
                >
                  Comprar ahora
                </Link>
              </div>
            </div>
          </div>
          <div className="col-xl-6 col-lg-6 col-md-6 col-12 col-sm-6 ">
            <div 
              className="slider-single-img slider-animated-1"
              style={{ marginLeft: '20px',marginTop: '100px' }} // Ajusta el margen según sea necesario
            >
              <img
                className="animated img-fluid rounded shadow"
                src={process.env.PUBLIC_URL + data.image}
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

HeroSliderOneSingle.propTypes = {
  data: PropTypes.shape({})
};

export default HeroSliderOneSingle;
