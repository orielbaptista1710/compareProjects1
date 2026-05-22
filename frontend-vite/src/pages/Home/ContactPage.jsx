import React from "react";
import "./ContactPage.css";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react"; 
import ContactForm from "../components/HomePageComponents/ContactForm";

export default function ContactPage() {
  return (
    <div className="contact-page">

      {/* HERO SECTION */}
      <div className="contact-hero">
        <div className="contact-hero-overlay" />
        <div className="contact-hero-content">
          <h1>Contact Us</h1>
          <p>
            Get in touch with our support team for any help with properties,
            projects or partnerships.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="contact-container">

        {/* LEFT PANEL */}
        <div className="contact-left">
          <h2>Get in Touch</h2>
          <p className="contact-desc">
            We're here to assist you. Reach out via phone, email, or visit our office.
          </p>

          <div className="contact-info-item">
            <Phone className="contact-icon" />
            <div>
              <h4>Phone</h4>
              <p>+91 98765 43210</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Mail className="contact-icon" />
            <div>
              <h4>Email</h4>
              <p>support@realestate.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <MapPin className="contact-icon" />
            <div>
              <h4>Location</h4>
              <p>Mumbai, Maharashtra, India</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock className="contact-icon" />
            <div>
              <h4>Working Hours</h4>
              <p>Mon – Sat: 10 AM – 7 PM</p>
            </div>
          </div>

          <button className="contact-action-btn">
            Call Now <ArrowRight size={18} />
          </button>
        </div>

        {/* RIGHT PANEL (FORM) */}
        <div className="contact-right">
          <ContactForm />
        </div>
      </div>

      {/* MAP */}
      <div className="contact-map">
        <iframe
          title="Office Location"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.098!2d72.8777!3d19.076!"
        ></iframe>
      </div>
    </div>
  );
}
