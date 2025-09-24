import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faDownload, faHeart } from "@fortawesome/free-solid-svg-icons";
import "./QuickLinks.css";

function QuickLinks({property}) {
  const { currentUser } = useContext(AuthContext);  // ✅ global auth state
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleCall = () => {
    window.location.href = "tel:+911234567890";
  };

  const handleEnquiry = () => setShowModal(true);

  const handleBrochure = () => {
    toast.success("Brochure downloaded");
    window.open(property.brochure, "https://example.com/brochures/sobha-heartland-villas.pdf");
  };

  const handleSave = () => {
    if (!currentUser) {
      toast.warning(" Please log in to save properties.");
      setTimeout(() => navigate("/customer-login"), 1500);
      return;
    }

    setSaved(!saved);
    toast.success(saved ? "❌ Removed from saved." : "❤️ Property saved!");

    // TODO: Call backend API to save in DB for logged-in user
    // fetch(`/api/customers/${currentUser._id}/save-property`, { ... })
  };

  return (
    <>
      <div className="quick-action-bar">
        <button className="quick-action-btn" onClick={handleCall}>
          <FontAwesomeIcon icon={faPhone} />
          <span>Call Now</span>
        </button>

        <button className="quick-action-btn" onClick={handleEnquiry}>
          <FontAwesomeIcon icon={faEnvelope} />
          <span>Enquiry</span>
        </button>

        <button className="quick-action-btn" onClick={handleBrochure}>
          <FontAwesomeIcon icon={faDownload} />
          <span>Brochure</span>
        </button>

        <button className="quick-action-btn" onClick={handleSave}>
          <FontAwesomeIcon icon={faHeart} color={saved ? "#D90429" : "#333"} />
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Enquiry Form</h3>
            <form>
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Your Email" required />
              <textarea placeholder="Your Message" required />
              <button type="submit">Submit</button>
            </form>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickLinks;
