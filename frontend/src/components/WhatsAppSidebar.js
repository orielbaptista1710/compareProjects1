import React from "react";
import "./WhatsAppSidebar.css"; // Create a CSS file for styling
import { FaWhatsapp } from "react-icons/fa"; // Using FontAwesome icons

const WhatsAppSidebar = () => {
  const phoneNumber = "8928464726"; // Change this to your WhatsApp number

  return (
    <div className="whatsapp-sidebar">
      <a
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-button"
      >
        <FaWhatsapp size={32} /> Chat with us
      </a>
    </div>
  );
};

export default WhatsAppSidebar;
