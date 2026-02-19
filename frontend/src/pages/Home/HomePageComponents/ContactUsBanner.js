import React, { useCallback } from "react";
import GradientBanner from "../../../pages/Home/HomePageComponents/GradientBanner";

const ContactUsBanner = () => {
  const handleScrollToContact = useCallback(() => {
    const section = document.getElementById("contact-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <GradientBanner
      id="contact-us-banner"
      ariaLabelledBy="contact-us-heading"
      title="Need Help Finding the Right Property?"
      subtitle="Our team is here to guide you. Get expert assistance tailored to your needs."
      buttonText="Contact Us"
      onButtonClick={handleScrollToContact}
    />
  );
};

export default React.memo(ContactUsBanner);
