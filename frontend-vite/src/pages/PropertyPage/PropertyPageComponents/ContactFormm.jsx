// src/pages/PropertyPage/PropertyPageComponents/ContactFormm.jsx
// Lead capture form — sends data to /api/leads/customer

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Heart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import API from "../../../api";
import "./ContactFormm.css";

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

const schema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),

  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

  customerEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254, "Email address is too long"),

  message: z
    .string()
    .trim()
    .max(1000, "Message is too long")
    .optional(),

  customerContactConsent: z.literal(true, {
    errorMap: () => ({
      message: "Please agree to be contacted",
    }),
  }),

  loanInterest: z.boolean(),
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("") || "D";

const getApiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  "Something went wrong. Please try again.";

// ─────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────

const Field = ({ label, error, icon: Icon, children }) => (
  <div className="cf-field">
    <label className="cf-label">
      {Icon && (
        <Icon
          size={13}
          strokeWidth={2}
          className="cf-label__icon"
          aria-hidden="true"
        />
      )}
      {label}
    </label>

    {children}

    {error && (
      <span className="cf-error" role="alert">
        {error}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const ContactFormm = ({ property }) => {
  const [submitStatus, setSubmitStatus] = useState(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      message: "",
      customerContactConsent: true,
      loanInterest: false,
    },
  });

  const onSubmit = async (data) => {
    setSubmitStatus(null);

    try {
      await API.post("/api/leads/customer", {
        ...data,
        customerName: data.customerName.trim(),
        customerPhone: `+91${data.customerPhone.trim()}`,
        customerEmail: data.customerEmail.trim().toLowerCase(),
        message: data.message?.trim() || "",
        source: "property_page_contact",
        propertyId: property?._id || null,
      });

      setSubmitStatus({
        type: "success",
        message: "Thanks! We'll get back to you shortly.",
      });

      reset();
    } catch (err) {
      console.error("Contact developer form submission failed:", err);

      setSubmitStatus({
        type: "error",
        message: getApiErrorMessage(err),
      });
    }
  };

  const devName = property?.developerName || "Developer";
  const devInitial = getInitials(devName);

  return (
    <div className="cf-root">
      {/* Header */}
      <div className="cf-header">
        <p className="cf-header__label">Contact Developer</p>

        <div className="cf-developer">
          <div className="cf-developer__avatar" aria-hidden="true">
            {devInitial}
          </div>

          <div className="cf-developer__info">
            <span className="cf-developer__name">{devName}</span>

            {property?.title && (
              <span className="cf-developer__property">
                {property.title}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="cf-divider" />

      {/* Form */}
      <form
        className="cf-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Contact developer form"
      >
        {/* Name */}
        <Field
          label="Full Name"
          error={errors.customerName?.message}
          icon={User}
        >
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className={`cf-input${
                  errors.customerName ? " cf-input--error" : ""
                }`}
                placeholder="Enter your name"
                disabled={isSubmitting}
                autoComplete="name"
                maxLength={100}
              />
            )}
          />
        </Field>

        {/* Phone */}
        <Field
          label="Phone Number"
          error={errors.customerPhone?.message}
          icon={Phone}
        >
          <div className="cf-phone-row">
            <span className="cf-phone-prefix" aria-hidden="true">
              +91
            </span>

            <Controller
              name="customerPhone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  className={`cf-input cf-input--phone${
                    errors.customerPhone ? " cf-input--error" : ""
                  }`}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  disabled={isSubmitting}
                  autoComplete="tel-national"
                  onChange={(event) => {
                    const value = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    field.onChange(value);
                  }}
                />
              )}
            />
          </div>
        </Field>

        {/* Email */}
        <Field
          label="Email Address"
          error={errors.customerEmail?.message}
          icon={Mail}
        >
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                className={`cf-input${
                  errors.customerEmail ? " cf-input--error" : ""
                }`}
                placeholder="your@email.com"
                disabled={isSubmitting}
                autoComplete="email"
                maxLength={254}
              />
            )}
          />
        </Field>

        {/* Message */}
        <Field
          label="Message (optional)"
          error={errors.message?.message}
          icon={MessageSquare}
        >
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className={`cf-textarea${
                  errors.message ? " cf-input--error" : ""
                }`}
                placeholder="Any specific requirements or questions?"
                rows={3}
                disabled={isSubmitting}
                maxLength={1000}
              />
            )}
          />
        </Field>

        <div className="cf-divider" />

        {/* Checkboxes */}
        <div className="cf-checks">
          {/* Contact consent */}
          <Controller
            name="customerContactConsent"
            control={control}
            render={({ field }) => (
              <label
                className={`cf-check-label${
                  errors.customerContactConsent
                    ? " cf-check-label--error"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="cf-checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />

                <span className="cf-check-text">
                  I agree to be contacted via WhatsApp, SMS, phone and email
                </span>
              </label>
            )}
          />

          {errors.customerContactConsent && (
            <span className="cf-error" role="alert">
              {errors.customerContactConsent.message}
            </span>
          )}

          {/* Loan interest */}
          <Controller
            name="loanInterest"
            control={control}
            render={({ field }) => (
              <label className="cf-check-label">
                <input
                  type="checkbox"
                  className="cf-checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />

                <span className="cf-check-text">
                  I'm interested in{" "}
                  <Link to="/apnaloan" className="cf-loan-link">
                    Home Loans
                  </Link>
                </span>
              </label>
            )}
          />
        </div>

        {/* Submission status */}
        {submitStatus && (
          <div
            className={`cf-submit-status cf-submit-status--${submitStatus.type}`}
            role="alert"
            aria-live="polite"
          >
            {submitStatus.type === "success" ? (
              <CheckCircle size={16} aria-hidden="true" />
            ) : (
              <AlertCircle size={16} aria-hidden="true" />
            )}

            <span>{submitStatus.message}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="cf-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span
                className="cf-submit__spinner"
                aria-hidden="true"
              />
              Submitting…
            </>
          ) : (
            "Contact Developer"
          )}
        </button>

        {/* Footer */}
        <div className="cf-footer-nudge">
          <Heart size={14} strokeWidth={2} aria-hidden="true" />
          <span>
            Still deciding? Save this property to your favorites
          </span>
        </div>
      </form>
    </div>
  );
};

export default ContactFormm;