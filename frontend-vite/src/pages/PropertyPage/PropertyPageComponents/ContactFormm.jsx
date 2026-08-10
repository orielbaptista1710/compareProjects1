// src/pages/PropertyPage/PropertyPageComponents/ContactFormm 
// Lead capture form — sends data to /api/leads/customer

import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, Mail, MessageSquare, Heart } from "lucide-react";
import API from "../../../api";
import "./ContactFormm.css";

// ── Zod schema ────────────────────────────────────────────────
const schema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit number"),
  customerEmail: z
    .string()
    .email("Enter a valid email address"),
  message: z.string().optional(),
  customerContactConsent: z.literal(true, {
    errorMap: () => ({ message: "Please agree to be contacted" }),
  }),
  loanInterest: z.boolean(),
});

// ── Helper: initials from name string ─────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "D";

// ── Field wrapper ─────────────────────────────────────────────
const Field = ({ label, error, icon: Icon, children }) => (
  <div className="cf-field">
    <label className="cf-label">
      {Icon && <Icon size={13} strokeWidth={2} className="cf-label__icon" />}
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
// COMPONENT
// ─────────────────────────────────────────────────────────────
const ContactFormm = ({ property }) => {

  const {
    handleSubmit,
    control,
    reset,
    // register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName:           "",
      customerPhone:          "",
      customerEmail:          "",
      message:                "",
      customerContactConsent: true,
      loanInterest:           false,
    },
  });

  const onSubmit = async (data) => {
    try {
      await API.post("/api/leads/customer", {
        ...data,
        // Prepend country code to phone before sending
        customerPhone: `+91${data.customerPhone}`,
        source:     "property_page_contact",
        propertyId: property?._id || null,
      });
      //CHECK THIS HAVE TO ADD A TOAST OR A MESSAGE - TEAM WILL GET BACK TO YOU SHORTYLY
      reset();
    } catch (err) {
      error(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const devName    = property?.developerName || "Developer";
  const devInitial = getInitials(devName);

  return (
    <div className="cf-root">
      {/* ── Header ── */}
      <div className="cf-header">
        <p className="cf-header__label">Contact Developer</p>
        <div className="cf-developer">
          <div className="cf-developer__avatar" aria-hidden="true">
            {devInitial}
          </div>
          <div className="cf-developer__info">
            <span className="cf-developer__name">{devName}</span>
            {property?.title && (
              <span className="cf-developer__property">{property.title}</span>
            )}
          </div>
        </div>
      </div>

      <div className="cf-divider" />

      {/* ── Form ── */}
      <form
        className="cf-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Contact developer form"
      >
        {/* Name */}
        <Field label="Full Name" error={errors.customerName?.message} icon={User}>
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className={`cf-input${errors.customerName ? " cf-input--error" : ""}`}
                placeholder="Enter your name"
                disabled={isSubmitting}
                autoComplete="name"
              />
            )}
          />
        </Field>

        {/* Phone */}
        <Field label="Phone Number" error={errors.customerPhone?.message} icon={Phone}>
          <div className="cf-phone-row">
            <span className="cf-phone-prefix">+91</span>
            <Controller
              name="customerPhone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={`cf-input cf-input--phone${errors.customerPhone ? " cf-input--error" : ""}`}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  disabled={isSubmitting}
                  autoComplete="tel-national"
                />
              )}
            />
          </div>
        </Field>

        {/* Email */}
        <Field label="Email Address" error={errors.customerEmail?.message} icon={Mail}>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                className={`cf-input${errors.customerEmail ? " cf-input--error" : ""}`}
                placeholder="your@email.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
            )}
          />
        </Field>

        {/* Message */}
        <Field label="Message (optional)" icon={MessageSquare}>
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="cf-textarea"
                placeholder="Any specific requirements or questions?"
                rows={3}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        <div className="cf-divider" />

        {/* Checkboxes */}
        <div className="cf-checks">
          {/* Consent */}
          <Controller
            name="customerContactConsent"
            control={control}
            render={({ field }) => (
              <label className={`cf-check-label${errors.customerContactConsent ? " cf-check-label--error" : ""}`}>
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

        {/* Submit */}
        <button
          type="submit"
          className="cf-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="cf-submit__spinner" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            "Contact Developer"
          )}
        </button>

        {/* Footer nudge */}
        <div className="cf-footer-nudge">
          <Heart size={14} strokeWidth={2} />
          <span>Still deciding? Save this property to your favorites</span>
        </div>
      </form>
    </div>
  );
};

export default ContactFormm;