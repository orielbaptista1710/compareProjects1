import React, { useState, useCallback, useEffect } from "react";
import GradientBanner from "../../../pages/Home/HomePageComponents/GradientBanner";
import DeveloperPopup from "../../../shared/Popups/DeveloperPopup";

const PostPropertyBanner = () => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = useCallback(() => setShowPopup(true), []);
  const closePopup = useCallback(() => setShowPopup(false), []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowPopup(false);
    };

    if (showPopup) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showPopup]);

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
