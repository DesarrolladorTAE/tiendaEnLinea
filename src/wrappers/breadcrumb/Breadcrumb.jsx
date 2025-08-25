// src/components/common/BreadcrumbWrap.jsx
import React from "react";
import PropTypes from "prop-types";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { Link } from "react-router-dom";
import StorefrontIcon from "@mui/icons-material/Storefront"; // 🏪 icono Material UI

const BreadcrumbWrap = ({ pages }) => {
  return (
    <div className="breadcrumb-area">
      <div className="container">
        <Breadcrumb className="custom-breadcrumb">
          {pages?.map(({ path, label }, i) =>
            i !== pages.length - 1 ? (
              <Breadcrumb.Item
                key={label}
                linkProps={{ to: path }}
                linkAs={Link}
              >
                {i === 0 ? (
                  <span className="crumb-home">
                    <StorefrontIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {label}
                  </span>
                ) : (
                  label
                )}
              </Breadcrumb.Item>
            ) : (
              <Breadcrumb.Item key={label} active>
                {label}
              </Breadcrumb.Item>
            )
          )}
        </Breadcrumb>
      </div>

      <style>{`
        .breadcrumb-area {
          padding: 10px 0;
          margin-bottom: 22px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(10,12,16,0.92) 0%, rgba(12,14,20,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 36px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03);
          backdrop-filter: blur(8px);
        }

        .custom-breadcrumb {
          margin: 0;
          padding: 0 8px;
          background: transparent;
        }

        .custom-breadcrumb .breadcrumb-item {
          font-weight: 600;
          font-size: 14px;
          color: rgba(255,255,255,0.72);
          letter-spacing: .3px;
          display: flex;
          align-items: center;
        }

        .custom-breadcrumb .breadcrumb-item a {
          color: #76E0FF; /* cyan */
          text-decoration: none;
          transition: color .2s ease;
          display: flex;
          align-items: center;
        }
        .custom-breadcrumb .breadcrumb-item a:hover {
          color: #7C4DFF; /* morado */
          text-shadow: 0 0 6px rgba(124,77,255,0.45);
        }

        .custom-breadcrumb .breadcrumb-item.active {
          color: #fff;
          font-weight: 800;
        }

        .custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
          color: rgba(255,255,255,0.45);
          content: "›"; /* separador moderno */
          font-weight: 700;
        }

        .crumb-home {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

BreadcrumbWrap.propTypes = {
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default BreadcrumbWrap;
