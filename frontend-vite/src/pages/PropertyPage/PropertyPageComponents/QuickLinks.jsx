// src/pages/PropertyPage/PropertyPageComponents/QuickLinks.jsx

import { useState, useRef, useEffect } from "react";
import {
  Phone,
  Mail,
  Download,
  Heart,
  X,
  AlertCircle,
  Check,
} from "lucide-react";

import API from "../../../api";
import useHeartProperty from "../../../hooks/useHeartProperty";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

import "./QuickLinks.css";

const INITIAL_FORM_DATA = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
};

const getApiErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  "Something went wrong. Please try again.";

function QuickLinks({ property }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const modalRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const { isSaved, handleToggleHeart } = useHeartProperty(property?._id);

  // Close modal on Escape.
  useEscapeKey(showModal, () => setShowModal(false));

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!showModal) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Clean up delayed modal close.
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Focus trap.
  useEffect(() => {
    if (!showModal || !modalRef.current) return undefined;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );

    const firstElement = focusableElements[0];
    const lastElement =
      focusableElements[focusableElements.length - 1];

    const handleTab = (event) => {
      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleTab);

    firstElement?.focus();

    return () => {
      window.removeEventListener("keydown", handleTab);
    };
  }, [showModal]);

  const handleCall = () => {
    window.location.href = "tel:+911234567890";
  };

  const handleEnquiry = () => {
    setStatus(null);
    setShowModal(true);
  };

  const handleBrochure = () => {
    const brochureUrl = property?.brochure;

    if (!brochureUrl || typeof brochureUrl !== "string") {
      setStatus({
        type: "error",
        message: "Brochure is currently unavailable.",
      });
      return;
    }

    window.open(
      brochureUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear an existing error once the user starts correcting the form.
    if (status?.type === "error") {
      setStatus(null);
    }
  };

  const validateForm = () => {
    const name = formData.customerName.trim();
    const email = formData.customerEmail.trim();
    const phone = formData.customerPhone.trim();

    if (name.length < 2) {
      return "Enter your full name";
    }

    if (name.length > 100) {
      return "Name is too long";
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Enter a valid 10-digit mobile number";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "Enter a valid email address";
    }

    if (email.length > 254) {
      return "Email address is too long";
    }

    return null;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const validationError = validateForm();

    if (validationError) {
      setStatus({
        type: "error",
        message: validationError,
      });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      await API.post("/api/leads/customer", {
        customerName: formData.customerName.trim(),
        customerPhone: `+91${formData.customerPhone.trim()}`,
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        propertyId: property?._id || null,
        propertyTitle: property?.title || "",
        source: "quick_links_property_page_form",
        pageUrl: window.location.href,
      });

      setStatus({
        type: "success",
        message: "Enquiry sent! We'll reach out shortly.",
      });

      setFormData({ ...INITIAL_FORM_DATA });

      closeTimeoutRef.current = window.setTimeout(() => {
        setShowModal(false);
        setStatus(null);
      }, 1500);
    } catch (error) {
      console.error(
        "Quick Links enquiry submission failed:",
        error
      );

      setStatus({
        type: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="quick-action-bar">
        <button
          type="button"
          className="quick-action-btn"
          onClick={handleCall}
          aria-label="Call developer"
        >
          <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>Call Now</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleEnquiry}
          aria-label="Send property enquiry"
        >
          <Mail size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>Enquiry</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleBrochure}
          aria-label="Download property brochure"
          disabled={!property?.brochure}
        >
          <Download size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>Brochure</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleToggleHeart}
          aria-label={
            isSaved
              ? "Remove property from favorites"
              : "Save property to favorites"
          }
          aria-pressed={isSaved}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            color={isSaved ? "#D90429" : "#333"}
            fill={isSaved ? "#D90429" : "none"}
            aria-hidden="true"
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
          <div
            className="quick-modal-content"
            ref={modalRef}
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="quick-enquiry-modal-title"
              className="quick-modal-title"
            >
              Enquiry Form
            </h3>

            <form
              className="quick-enquiry-modal-form"
              onSubmit={handleFormSubmit}
              noValidate
            >
              <label
                className="sr-only"
                htmlFor="quick-name"
              >
                Full name
              </label>

              <input
                id="quick-name"
                type="text"
                name="customerName"
                placeholder="Your Name"
                value={formData.customerName}
                onChange={handleFormChange}
                maxLength={100}
                autoComplete="name"
                disabled={loading}
                required
              />

              <label
                className="sr-only"
                htmlFor="quick-phone"
              >
                Phone number
              </label>

              <input
                id="quick-phone"
                type="tel"
                name="customerPhone"
                placeholder="Your Phone"
                value={formData.customerPhone}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);

                  setFormData((previous) => ({
                    ...previous,
                    customerPhone: value,
                  }));

                  if (status?.type === "error") {
                    setStatus(null);
                  }
                }}
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                autoComplete="tel-national"
                disabled={loading}
                required
              />

              <label
                className="sr-only"
                htmlFor="quick-email"
              >
                Email address
              </label>

              <input
                id="quick-email"
                type="email"
                name="customerEmail"
                placeholder="Your Email"
                value={formData.customerEmail}
                onChange={handleFormChange}
                maxLength={254}
                autoComplete="email"
                disabled={loading}
                required
              />

              {status && (
                <div
                  className={`quick-form-status quick-form-status--${status.type}`}
                  role="alert"
                  aria-live="polite"
                >
                  {status.type === "success" ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                    />
                  )}

                  <span>{status.message}</span>
                </div>
              )}

              <button
                className="quick-enquiry-modal-form-submit-btn"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>

            <button
              type="button"
              className="quick-modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close enquiry form"
              disabled={loading}
            >
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickLinks;