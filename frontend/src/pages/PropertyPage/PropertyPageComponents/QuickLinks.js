// src/components/QuickLinks.js
import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { toast } from "react-toastify"; // still using Toastify here for now
import { Phone, Mail, Download, Heart } from "lucide-react"; // 
import "./QuickLinks.css";

function QuickLinks({ property }) {
  const { currentUser } = useContext(AuthContext);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const navigate = useNavigate();
  const modalRef = useRef(null);

  // Close modal on Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setShowModal(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    if (!showModal || !modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], button, textarea, input, select'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    window.addEventListener("keydown", handleTab);
    firstEl.focus();
    return () => window.removeEventListener("keydown", handleTab);
  }, [showModal]);

  const handleCall = () => {
    window.location.href = "tel:+911234567890";
  };

  const handleEnquiry = () => setShowModal(true);

  const handleBrochure = () => {
    if (!property?.brochure) {
      toast.warning("Brochure not available.");
      return;
    }
    toast.success("Brochure downloaded");
    window.open(property.brochure, "_blank", "noopener,noreferrer");
  };

  const handleSave = () => {
    if (!currentUser) {
      toast.warning("Please log in to save properties.");
      setTimeout(() => navigate("/customer-login"), 1500);
      return;
    }

    setSaved((prev) => !prev);
    toast.success(saved ? "❌ Removed from saved." : "❤️ Property saved!");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log("Enquiry submitted:", formData);
    toast.success("Enquiry submitted successfully!");
    setFormData({ name: "", email: "", message: "" });
    setShowModal(false);
  };

  return (
    <>
      <div className="quick-action-bar">
        <button className="quick-action-btn" onClick={handleCall}>
          <Phone size={18} strokeWidth={1.5} />
          <span>Call Now</span>
        </button>

        <button className="quick-action-btn" onClick={handleEnquiry}>
          <Mail size={18} strokeWidth={1.5} />
          <span>Enquiry</span>
        </button>

        <button className="quick-action-btn" onClick={handleBrochure}>
          <Download size={18} strokeWidth={1.5} />
          <span>Brochure</span>
        </button>

        <button className="quick-action-btn" onClick={handleSave}>
          <Heart
            size={18}
            strokeWidth={1.5}
            color={saved ? "#D90429" : "#333"}
            fill={saved ? "#D90429" : "none"}
          />
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquiry-modal-title"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="enquiry-modal-title">Enquiry Form</h3>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleFormChange}
                required
              />
              <button type="submit">Submit</button>
            </form>
            <button
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickLinks;
