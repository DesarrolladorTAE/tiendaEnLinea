import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";

const Logo = ({ imageUrl, logoClass }) => {
  return (
    <div className={clsx(logoClass)}>
      <Link to={ "/home-fashion-three"}>
        <img alt="" src={ imageUrl} />
      </Link>
    </div>
  );
};

Logo.propTypes = {
  imageUrl: PropTypes.string,
  logoClass: PropTypes.string
};

export default Logo;

// import React from "react";
// import PropTypes from "prop-types";
// import { Box } from "@mui/material";
// import { Link } from "react-router-dom";

// const Logo = ({ imageUrl }) => {
//   return (
//     <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
//       <Link to="/home-fashion-three">
//         <Box
//           component="img"
//           src={imageUrl}
//           alt="Logo"
//           sx={{ height: 48 }}
//         />
//       </Link>
//     </Box>
//   );
// };

// Logo.propTypes = {
//   imageUrl: PropTypes.string,
// };

// export default Logo;
