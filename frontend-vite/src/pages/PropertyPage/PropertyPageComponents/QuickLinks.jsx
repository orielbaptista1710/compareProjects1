//src/components/QuickLinks 
import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { Phone, Mail, Download, Heart, X, AlertCircle, Check} from "lucide-react";

import useHeartProperty from "../../../hooks/useHeartProperty";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

import "./QuickLinks.css";

function QuickLinks({ property }) {
  const { currentUser } = useContext(AuthContext);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isSaved, handleToggleHeart } = useHeartProperty(property?._id);


  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  }); 

  const navigate = useNavigate();
  const modalRef = useRef(null);

  // Close modal on Escape
  useEscapeKey(
  showModal,
  () => setShowModal(false)
);

// Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  // Focus trap
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
    firstEl?.focus();

    return () => window.removeEventListener("keydown", handleTab);
  }, [showModal]);

  const handleCall = () => {
    window.location.href = "tel:+911234567890";
  };

  const handleEnquiry = () => {
    setShowModal(true);
  };

  const handleBrochure = () => {
    if (!property?.brochure) return;
    window.open(property.brochure, "_blank", "noopener,noreferrer");
  };


  //CHECK THIS -- CUSTOMER FORM API N BACKEND ZOD , RATE LIMITS NEEDS TO BE DONE
  // const handleHeart = () => {
  //   if (!currentUser) {
  //     toast.warning("Please log in to save properties.");
  //     setTimeout(() => navigate("/customer-login"), 1500);
  //     return;
  //   }

  //   setSaved((prev) => !prev);
  //   toast.success(saved ? "Removed from saved." : "Property saved!");
  // };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
  const name = formData.customerName.trim();
  const email = formData.customerEmail.trim();
  const phone = formData.customerPhone.trim();

  if (name.length < 2) return "Enter your full name";
    if (!/^[6-9]\d{9}$/.test(phone)) return "Enter a valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; 

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);


      //CHECK THIS -- CUSTOMER FORM API N BACKEND ZOD , RATE LIMITS NEEDS TO BE DONE
      //CHECK THIS URL -  y REACT_APP_API_URL WHEN VITE_API_BASE_URL/REACT_APP_API_BASE_URL process.

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/leads/customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            propertyId: property?._id,
            propertyTitle: property?.title,
            source: "quick_links_property_page_form",
            pageUrl: window.location.href, //this is use for track the page from where the lead is generated
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit enquiry");
      }

      setStatus({ type: "success", message: "Enquiry sent! We'll reach out shortly." });
      setFormData({ customerName: "", customerPhone: "", customerEmail: "" });
      setTimeout(() => setShowModal(false), 1500);
    } catch (error) {
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="quick-action-bar">
        <button type="button" className="quick-action-btn" onClick={handleCall}>
          <Phone size={18} strokeWidth={1.5} />
          <span>Call Now</span>
        </button>

        <button type="button" className="quick-action-btn" onClick={handleEnquiry}>
          <Mail size={18} strokeWidth={1.5} />
          <span>Enquiry</span>
        </button>

        <button type="button" className="quick-action-btn" onClick={handleBrochure}>
          <Download size={18} strokeWidth={1.5} />
          <span>Brochure</span>
        </button>

        <button type="button" className="quick-action-btn" onClick={handleToggleHeart}>
          <Heart
            size={18}
            strokeWidth={1.5}
            color={isSaved ? "#D90429" : "#333"}
            fill={isSaved ? "#D90429" : "none"}
          />
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {showModal && (
        <div
          className="quick-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-enquiry-modal-title"
          onClick={() => setShowModal(false)}
        >
          <div className="quick-modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <h3 id="quick-enquiry-modal-title" className="quick-modal-title">Enquiry Form</h3>

            <form className="quick-enquiry-modal-form" onSubmit={handleFormSubmit}>
              <label className="sr-only" htmlFor="quick-name">Full name</label>
              <input
                id="quick-name"
                type="text"
                name="customerName"
                placeholder="Your Name"
                value={formData.customerName}
                onChange={handleFormChange}
                required
              />

              <label className="sr-only" htmlFor="quick-phone">Phone number</label>
              <input
                id="quick-phone"
                type="tel"
                name="customerPhone"
                placeholder="Your Phone"
                value={formData.customerPhone}
                onChange={handleFormChange}
                required
              />

              <label className="sr-only" htmlFor="quick-email">Email address</label>
              <input
                id="quick-email"
                type="email"
                name="customerEmail"
                placeholder="Your Email"
                value={formData.customerEmail}
                onChange={handleFormChange}
                required
              />

              {status && (
                <div className={`quick-form-status quick-form-status--${status.type}`}>
                  {status.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{status.message}</span>
                </div>
              )}

              <button
                className="quick-enquiry-modal-form-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>

            <button
              type="button"
              className="quick-modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickLinks;

