//frontend-vite\src\pages\Home\HomePageComponents\PostPropertyBanner.jsx
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GradientBanner from "./GradientBanner";

// Same entry as the header's POST PROPERTY: owners, agents and developers
// choose their path on /post-property (developers still get the partner form).
const PostPropertyBanner = () => {
  const navigate = useNavigate();
  const goToPostProperty = useCallback(() => navigate("/post-property"), [navigate]);

  return (
    <GradientBanner
      id="post-property-banner"
      ariaLabelledBy="post-property-heading"
      title="Looking to Post Your Property?"
      subtitle="Owners, agents and developers: list with us and reach thousands of buyers."
      buttonText="Post property"
      onButtonClick={goToPostProperty}
      backgroundImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    />
  );
};

export default React.memo(PostPropertyBanner);
