import React, { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Slider from "react-slick";
import { Box, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const BlogFeatured = ({ images = [], storeName = "" }) => {
  const [openImage, setOpenImage] = useState(null);
  const scrollYRef = useRef(0);

  const hasImages = images && images.length > 0;

  // 🔹 Si no hay imágenes → mostrar mensaje fijo
  const title = useMemo(() => {
    if (!hasImages) {
      return "Conoce más sobre los productos de TAE";
    }
    const s = (storeName || "").trim();
    return s ? `Conoce más sobre ${s}` : "Conoce más";
  }, [storeName, hasImages]);

  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 0,
    speed: 5000,
    cssEase: "linear",
    slidesToShow: 4,
    slidesToScroll: 1,
    pauseOnHover: false,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4 } },
      { breakpoint: 992, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
    ],
  };

  const fallback = [
    { src: "/assets/img/post/1.png" },
    { src: "/assets/img/post/2.png" },
    { src: "/assets/img/post/3.png" },
    { src: "/assets/img/post/4.png" },
    { src: "/assets/img/post/5.png" },
    { src: "/assets/img/post/6.png" },
    { src: "/assets/img/post/7.png" },
    { src: "/assets/img/post/8.png" },
  ];

  const data = hasImages ? images : fallback;

  const openModal = (item) => {
    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    setOpenImage(item);
  };

  const closeModal = () => {
    const body = document.body;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    window.scrollTo(0, scrollYRef.current);
    setOpenImage(null);
  };

  return (
    <Box sx={{ py: 8 }}>
      <style>{styles}</style>

      <div className="container">
        {/* Header estilo BannerTwo */}
        <div className="b2-header">
          <h3 className="b2-title">{title}</h3>
          <div className="b2-legend">Galería</div>
        </div>

        <Slider {...settings}>
          {data.map((item, index) => (
            <Box key={index} px={1}>
              <button
                type="button"
                className="b2-card-btn"
                onClick={() => openModal(item)}
                title="Ver grande"
              >
                <div className="b2-card">
                  <img
                    src={item.src}
                    alt={`Imagen ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              </button>
            </Box>
          ))}
        </Slider>

        {/* Modal / Lightbox */}
        <Modal
          open={Boolean(openImage)}
          onClose={closeModal}
          disableScrollLock
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
        >
          <Box
            sx={{
              position: "relative",
              bgcolor: "#0f0f0f",
              borderRadius: 2,
              maxWidth: "96vw",
              maxHeight: "92vh",
              p: 2,
              outline: "none",
              boxShadow: 24,
            }}
          >
            <IconButton
              onClick={closeModal}
              aria-label="Cerrar"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                color: "#fff",
                bgcolor: "rgba(255,255,255,.12)",
                zIndex: 2,
                "&:hover": { bgcolor: "rgba(255,255,255,.18)" },
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box
              component="img"
              src={openImage?.src}
              alt="Imagen ampliada"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 1,
                boxShadow: "0 20px 60px rgba(0,0,0,.35)",
              }}
            />
          </Box>
        </Modal>
      </div>
    </Box>
  );
};

const styles = `
.b2-header{
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;
}
.b2-title{ margin:0; font-weight:800; letter-spacing:.2px; }
.b2-legend{ font-size:.9rem; opacity:.7 }
.b2-card-btn{
  width:100%; border:none; background:transparent; padding:0; cursor:pointer; text-align:initial;
}
.b2-card{
  border-radius:16px; overflow:hidden; background:#fff;
  box-shadow: 0 10px 25px rgba(0,0,0,.06);
  transition: transform .25s ease, box-shadow .25s ease;
  aspect-ratio: 16 / 10;
  display:flex; align-items:center; justify-content:center;
}
.b2-card:hover{ transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.10); }
.b2-card img{ width:100%; height:100%; object-fit:cover; }
`;

BlogFeatured.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
    })
  ),
  storeName: PropTypes.string,
};

export default BlogFeatured;
