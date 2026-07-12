//frontend-vite\src\pages\Home\HomePageComponents\PostPropertyBanner.jsx
import React, { useState, useCallback, useEffect } from "react";
import GradientBanner from "./GradientBanner";
import DeveloperPopup from "../../../shared/Popups/DeveloperPopup";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

const PostPropertyBanner = () => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = useCallback(() => setShowPopup(true), []);
  const closePopup = useCallback(() => setShowPopup(false), []);

  useEscapeKey(showPopup, closePopup);

  return (
    <>
      <GradientBanner
        id="post-property-banner"
        ariaLabelledBy="post-property-heading"
        title="Looking to Post Your Property?"
        subtitle="Join our network of trusted developers and reach thousands of buyers."
        buttonText="Contact Us"
        onButtonClick={openPopup}
        backgroundImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
      />

      <DeveloperPopup isOpen={showPopup} onClose={closePopup} />
    </>
  );
};

export default React.memo(PostPropertyBanner);
