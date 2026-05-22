// src/pages/PropertyPage/PropertyPageComponents/FAQSection 
/**
 * IMPROVEMENTS vs old version:
 *  - h2 removed (parent Card already has title)
 *  - Animated accordion via CSS max-height transition (no layout thrash)
 *  - formatCurrencyShort used for price answers
 *  - reraNumber field reference corrected (was property.rera → property.reraNumber)
 *  - Date formatted properly
 *  - "Information not available" answers are filtered out — if all fields are
 *    missing, the whole section shows a graceful empty state
 *  - Keyboard accessible (Enter + Space both toggle)
 */
import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrencyShort } from "../../../utils/formatters";
import "./FAQSection.css";

// ── Build Q&A from property data ──────────────────────────────
const buildFaqs = (property) => {
  const title = property.title || "this property";
  const loc   = [property.locality, property.state].filter(Boolean).join(", ");

  const raw = [
    {
      q: `Where is ${title} located?`,
      a: loc
        ? `${title} is located in ${loc}${property.pincode ? ` (PIN: ${property.pincode})` : ""}.`
        : null,
    },
    {
      q: `What is the price of ${title}?`,
      a: property.price
        ? `The listed price of ${title} starts at ${formatCurrencyShort(property.price)}.`
        : null,
    },
    {
      q: `What configurations are available in ${title}?`,
      a: property.bhk
        ? `${title} offers ${property.bhk} BHK ${property.propertyType || "units"}.`
        : null,
    },
    {
      q: `What is the total area of units in ${title}?`,
      a: property.area?.value
        ? `Units in ${title} have a built-up area of ${new Intl.NumberFormat("en-IN").format(property.area.value)} ${property.area.unit || "sqft"}.`
        : null,
    },
    {
      q: `How many units are available in ${title}?`,
      a: property.unitsAvailable
        ? `${title} currently has ${property.unitsAvailable} units available.`
        : null,
    },
    {
      q: `How many floors does ${title} have?`,
      a: property.totalFloors
        ? `${title} has ${property.totalFloors} floors in total.`
        : null,
    },
    {
      q: `Is ${title} RERA approved?`,
      a: property.reraApproved != null
        ? property.reraApproved
          ? `Yes, ${title} is RERA approved. Registration number: ${property.reraNumber || "available on request"}.`
          : `${title} does not currently have RERA approval listed.`
        : null,
    },
    {
      q: `What is the possession date for ${title}?`,
      a: property.reraDate || property.possessionStatus
        ? `Possession status: ${property.possessionStatus || "N/A"}${
            property.reraDate
              ? `. Expected date: ${new Date(property.reraDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
              : ""
          }.`
        : null,
    },
    {
      q: `What is the age of ${title}?`,
      a: property.ageOfProperty
        ? `${title} is approximately ${property.ageOfProperty}.`
        : null,
    },
    {
      q: `Is the price of ${title} negotiable?`,
      a: property.priceNegotiable != null
        ? property.priceNegotiable
          ? `Yes, the price of ${title} is negotiable. Contact the developer for details.`
          : `The listed price of ${title} is fixed.`
        : null,
    },
    {
      q: `Where can I download the brochure for ${title}?`,
      a: property.brochure
        ? `The brochure for ${title} is available for download on this page. Click the "Download Brochure" button in the sidebar.`
        : null,
    },
    {
      q: `What amenities does ${title} offer?`,
      a: property.amenities?.length
        ? `${title} offers: ${property.amenities.slice(0, 5).join(", ")}${property.amenities.length > 5 ? " and more" : ""}.`
        : null,
    },
  ];

  // Only return Q&As where we have an actual answer
  return raw.filter(({ a }) => a !== null && a !== undefined);
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
const FAQSection = ({ property = {} }) => {
  const [openIndex,  setOpenIndex]  = useState(null);
  const [showAll,    setShowAll]    = useState(false);

  const faqs = useMemo(() => buildFaqs(property), [property]);

  const toggle = useCallback((i) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  }, []);

  if (!faqs.length) {
    return (
      <p className="faq-empty">
        No FAQ information is available for this property yet.
      </p>
    );
  }

  const INITIAL_COUNT = 5;
  const visible = showAll ? faqs : faqs.slice(0, INITIAL_COUNT);

  return (
    <div className="faq-root">
      <ul className="faq-list" role="list">
        {visible.map(({ q, a }, i) => {
          const isOpen = openIndex === i;
          return (
            <li className={`faq-item${isOpen ? " faq-item--open" : ""}`} key={i}>
              <button
                className="faq-q"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
              >
                <span className="faq-q__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq-q__text">{q}</span>
                <ChevronDown
                  size={18}
                  strokeWidth={2.2}
                  className="faq-q__chevron"
                  aria-hidden="true"
                />
              </button>

              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className="faq-a"
                // height-based animation driven by CSS class
              >
                <p className="faq-a__text">{a}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {faqs.length > INITIAL_COUNT && (
        <button
          className="faq-toggle-all"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll
            ? "Show Less ↑"
            : `Show All ${faqs.length} Questions ↓`}
        </button>
      )}
    </div>
  );
};

export default React.memo(FAQSection);